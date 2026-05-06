import type { LanguageModelV2 } from '@ai-sdk/provider';

import { getHostUrl } from '@chat-template/utils';
// Import auth module directly
import {
  getDatabricksTokenForRequest,
  getAuthMethod,
  getDatabricksUserIdentity,
  getCachedCliHost,
  type AuthSession,
} from '@chat-template/auth';
import { createDatabricksProvider } from './databricks-provider/index';
import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';

// Use centralized authentication - only on server side
async function getProviderToken(session?: AuthSession | null): Promise<string> {
  // First, check if we have a PAT token
  if (process.env.DATABRICKS_TOKEN) {
    console.log('Using PAT token from DATABRICKS_TOKEN env var');
    return process.env.DATABRICKS_TOKEN;
  }

  // Use the new function that prioritizes OBO token from session
  return getDatabricksTokenForRequest(session);
}

// Cache the workspace hostname once resolved
let cachedWorkspaceHostname: string | null = null;

// Get workspace hostname with one-time resolution and caching
async function getWorkspaceHostname(): Promise<string> {
  if (cachedWorkspaceHostname) {
    return cachedWorkspaceHostname;
  }

  try {
    // Use the same approach as getDatabricksCurrentUser to get hostname
    const authMethod = getAuthMethod();

    if (authMethod === 'cli') {
      // For CLI auth, we need to call getDatabricksUserIdentity which handles hostname resolution
      // This will trigger the CLI auth flow and properly cache the host
      await getDatabricksUserIdentity();

      // After CLI auth succeeds, get the hostname from the CLI cache
      const cliHost = getCachedCliHost();
      if (cliHost) {
        cachedWorkspaceHostname = cliHost;
        return cachedWorkspaceHostname;
      } else {
        throw new Error(
          'CLI authentication succeeded but hostname was not cached',
        );
      }
    } else {
      // For OAuth, use the standard method
      cachedWorkspaceHostname = getHostUrl();
      return cachedWorkspaceHostname;
    }
  } catch (error) {
    throw new Error(
      `Unable to determine Databricks workspace hostname: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Environment variable to enable SSE logging
const LOG_SSE_EVENTS = process.env.LOG_SSE_EVENTS === 'true';

// Custom fetch function to transform Databricks responses to OpenAI format
export const databricksFetch: typeof fetch = async (input, init) => {
  const url = input.toString();

  // Log the request being sent to Databricks
  if (init?.body) {
    try {
      const requestBody =
        typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      console.log(
        'Databricks request:',
        JSON.stringify({
          url,
          method: init.method || 'POST',
          body: requestBody,
        }),
      );
    } catch (_e) {
      console.log('Databricks request (raw):', {
        url,
        method: init.method || 'POST',
        body: init.body,
      });
    }
  }

  const response = await fetch(url, init);

  // If SSE logging is enabled and this is a streaming response, wrap the body to log events
  if (LOG_SSE_EVENTS && response.body) {
    const contentType = response.headers.get('content-type') || '';
    const isSSE =
      contentType.includes('text/event-stream') ||
      contentType.includes('application/x-ndjson');

    if (isSSE) {
      const originalBody = response.body;
      const reader = originalBody.getReader();
      const decoder = new TextDecoder();
      let eventCounter = 0;

      const loggingStream = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('[SSE] Stream ended');
            controller.close();
            return;
          }

          // Decode and log the chunk
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            eventCounter++;
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              try {
                const parsed = JSON.parse(data);
                console.log(`[SSE #${eventCounter}]`, JSON.stringify(parsed));
              } catch {
                console.log(`[SSE #${eventCounter}] (raw)`, data);
              }
            } else if (line.trim()) {
              console.log(`[SSE #${eventCounter}] (line)`, line);
            }
          }

          // Pass the original data through
          controller.enqueue(value);
        },
        cancel() {
          reader.cancel();
        },
      });

      // Create a new response with the logging stream
      return new Response(loggingStream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
  }

  return response;
};

type CachedProvider = ReturnType<typeof createDatabricksProvider>;
let oauthProviderCache: CachedProvider | null = null;
let oauthProviderCacheTime = 0;
const PROVIDER_CACHE_DURATION = 5 * 60 * 1000; // Cache provider for 5 minutes

const API_PROXY = process.env.API_PROXY;

// Helper function to get or create the Databricks provider with OAuth
async function getOrCreateDatabricksProvider(
  session?: AuthSession | null,
): Promise<CachedProvider> {
  // For OBO authentication, don't use cache since each user has their own token
  const useCache = !session?.accessToken;

  // Check if we have a cached provider that's still fresh (only for non-OBO)
  if (
    useCache &&
    oauthProviderCache &&
    Date.now() - oauthProviderCacheTime < PROVIDER_CACHE_DURATION
  ) {
    console.log('Using cached OAuth provider');
    return oauthProviderCache;
  }

  console.log(`Creating new OAuth provider${session?.accessToken ? ' (OBO)' : ''}`);
  // Ensure we have a valid token before creating provider
  await getProviderToken(session);
  const hostname = await getWorkspaceHostname();

  // Create provider with fetch that always uses fresh token
  const provider = createDatabricksProvider({
    baseURL: `${hostname}/serving-endpoints`,
    formatUrl: ({ baseUrl, path }) => API_PROXY ?? `${baseUrl}${path}`,
    fetch: async (...[input, init]: Parameters<typeof fetch>) => {
      // Always get fresh token for each request (will use cache if valid)
      const currentToken = await getProviderToken(session);
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${currentToken}`);

      return databricksFetch(input, {
        ...init,
        headers,
      });
    },
  });

  // Only cache provider for non-OBO authentication
  if (useCache) {
    oauthProviderCache = provider;
    oauthProviderCacheTime = Date.now();
  }

  return provider;
}

const endpointDetailsCache = new Map<
  string,
  { task: string | undefined; timestamp: number }
>();
const ENDPOINT_DETAILS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get the task type of the serving endpoint
// Note: Uses service principal token (not OBO) since reading endpoint metadata
// requires broader permissions than querying the endpoint for inference
const getEndpointDetails = async (
  servingEndpoint: string,
  _session?: AuthSession | null,
) => {
  const cached = endpointDetailsCache.get(servingEndpoint);
  if (
    cached &&
    Date.now() - cached.timestamp < ENDPOINT_DETAILS_CACHE_DURATION
  ) {
    return cached;
  }

  // Use service principal token for metadata lookup (not OBO)
  // OBO tokens may not have permission to read endpoint metadata
  const currentToken = await getProviderToken(null);
  const hostname = await getWorkspaceHostname();
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${currentToken}`);

  const response = await databricksFetch(
    `${hostname}/api/2.0/serving-endpoints/${servingEndpoint}`,
    {
      method: 'GET',
      headers,
    },
  );

  // Handle non-OK responses gracefully
  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`[getEndpointDetails] Failed to get endpoint details: ${response.status} ${errorText}`);
    // Default to responses agent if we can't determine the task type
    return {
      task: undefined,
      timestamp: Date.now(),
    };
  }

  const data = (await response.json()) as { task: string | undefined };
  const returnValue = {
    task: data.task as string | undefined,
    timestamp: Date.now(),
  };
  endpointDetailsCache.set(servingEndpoint, returnValue);
  return returnValue;
};

// Create a smart provider wrapper that handles OAuth initialization
interface SmartProvider {
  languageModel(id: string, session?: AuthSession | null): Promise<LanguageModelV2>;
}

export class OAuthAwareProvider implements SmartProvider {
  private modelCache = new Map<
    string,
    { model: LanguageModelV2; timestamp: number }
  >();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async languageModel(id: string, session?: AuthSession | null): Promise<LanguageModelV2> {
    // For OBO authentication, don't use cache since each user has their own context
    const useCache = !session?.accessToken;

    // Check cache first (only for non-OBO)
    if (useCache) {
      const cached = this.modelCache.get(id);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`Using cached model for ${id}`);
        return cached.model;
      }
    }

    // Get the OAuth provider (passing session for OBO)
    const provider = await getOrCreateDatabricksProvider(session);

    const model = await (async () => {
      if (API_PROXY) {
        // For API proxy we always use the responses agent
        return provider.responsesAgent(id);
      }
      if (id === 'title-model' || id === 'artifact-model') {
        // Foundation Model API doesn't support OBO tokens, so use service principal
        // Get a non-OBO provider for these models
        if (session?.accessToken) {
          console.log(`[${id}] Foundation Model API call - using service principal instead of OBO`);
          const nonOboProvider = await getOrCreateDatabricksProvider(null);
          return nonOboProvider.fmapi('databricks-meta-llama-3-3-70b-instruct');
        }
        return provider.fmapi('databricks-meta-llama-3-3-70b-instruct');
      }
      // Server-side environment validation
      if (!process.env.DATABRICKS_SERVING_ENDPOINT) {
        throw new Error(
          'Please set the DATABRICKS_SERVING_ENDPOINT environment variable to the name of an agent serving endpoint',
        );
      }

      const servingEndpoint = process.env.DATABRICKS_SERVING_ENDPOINT;
      const endpointDetails = await getEndpointDetails(servingEndpoint, session);

      console.log(`Creating fresh model for ${id}${session?.accessToken ? ' (OBO)' : ''}`);
      switch (endpointDetails.task) {
        case 'agent/v2/chat':
          return provider.chatAgent(servingEndpoint);
        case 'agent/v1/responses':
        case 'agent/v2/responses':
          return provider.responsesAgent(servingEndpoint);
        case 'llm/v1/chat':
          return provider.fmapi(servingEndpoint);
        default:
          return provider.responsesAgent(servingEndpoint);
      }
    })();

    const wrappedModel = wrapLanguageModel({
      model,
      middleware: [extractReasoningMiddleware({ tagName: 'think' })],
    });

    // Cache the model (only for non-OBO)
    if (useCache) {
      this.modelCache.set(id, { model: wrappedModel, timestamp: Date.now() });
    }

    return wrappedModel;
  }
}

// Create a singleton instance
const providerInstance = new OAuthAwareProvider();

// Export function that returns the provider (no server function needed here)
export function getDatabricksServerProvider() {
  return providerInstance;
}
