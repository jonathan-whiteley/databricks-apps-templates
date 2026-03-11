import { r as getHostUrl } from "./src-BaHhVWSg.mjs";
import { c as getDatabricksUserIdentity, i as getCachedCliHost, s as getDatabricksTokenForRequest, t as getAuthMethod } from "./src-CKoYY1O3.mjs";
import { a as extractApprovalStatusFromToolResult, n as MCP_APPROVAL_RESPONSE_TYPE, o as DATABRICKS_TOOL_CALL_ID, r as createApprovalStatusOutput, s as DATABRICKS_TOOL_DEFINITION, t as MCP_APPROVAL_REQUEST_TYPE } from "./mcp-approval-utils-DEd3wq6H.mjs";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { z } from "zod/v4";
import "zod/v3";

//#region ../node_modules/@ai-sdk/provider/dist/index.mjs
var marker = "vercel.ai.error";
var symbol = Symbol.for(marker);
var _a;
var _AISDKError = class _AISDKError$1 extends Error {
	/**
	* Creates an AI SDK Error.
	*
	* @param {Object} params - The parameters for creating the error.
	* @param {string} params.name - The name of the error.
	* @param {string} params.message - The error message.
	* @param {unknown} [params.cause] - The underlying cause of the error.
	*/
	constructor({ name: name14, message, cause }) {
		super(message);
		this[_a] = true;
		this.name = name14;
		this.cause = cause;
	}
	/**
	* Checks if the given error is an AI SDK Error.
	* @param {unknown} error - The error to check.
	* @returns {boolean} True if the error is an AI SDK Error, false otherwise.
	*/
	static isInstance(error) {
		return _AISDKError$1.hasMarker(error, marker);
	}
	static hasMarker(error, marker15) {
		const markerSymbol = Symbol.for(marker15);
		return error != null && typeof error === "object" && markerSymbol in error && typeof error[markerSymbol] === "boolean" && error[markerSymbol] === true;
	}
};
_a = symbol;
var AISDKError = _AISDKError;
var name = "AI_APICallError";
var marker2 = `vercel.ai.error.${name}`;
var symbol2 = Symbol.for(marker2);
var _a2;
var APICallError = class extends AISDKError {
	constructor({ message, url, requestBodyValues, statusCode, responseHeaders, responseBody, cause, isRetryable = statusCode != null && (statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500), data }) {
		super({
			name,
			message,
			cause
		});
		this[_a2] = true;
		this.url = url;
		this.requestBodyValues = requestBodyValues;
		this.statusCode = statusCode;
		this.responseHeaders = responseHeaders;
		this.responseBody = responseBody;
		this.isRetryable = isRetryable;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker2);
	}
};
_a2 = symbol2;
var name2 = "AI_EmptyResponseBodyError";
var marker3 = `vercel.ai.error.${name2}`;
var symbol3 = Symbol.for(marker3);
var _a3;
var EmptyResponseBodyError = class extends AISDKError {
	constructor({ message = "Empty response body" } = {}) {
		super({
			name: name2,
			message
		});
		this[_a3] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker3);
	}
};
_a3 = symbol3;
function getErrorMessage(error) {
	if (error == null) return "unknown error";
	if (typeof error === "string") return error;
	if (error instanceof Error) return error.message;
	return JSON.stringify(error);
}
var name3 = "AI_InvalidArgumentError";
var marker4 = `vercel.ai.error.${name3}`;
var symbol4 = Symbol.for(marker4);
var _a4;
var InvalidArgumentError = class extends AISDKError {
	constructor({ message, cause, argument }) {
		super({
			name: name3,
			message,
			cause
		});
		this[_a4] = true;
		this.argument = argument;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker4);
	}
};
_a4 = symbol4;
var name4 = "AI_InvalidPromptError";
var marker5 = `vercel.ai.error.${name4}`;
var symbol5 = Symbol.for(marker5);
var _a5;
_a5 = symbol5;
var name5 = "AI_InvalidResponseDataError";
var marker6 = `vercel.ai.error.${name5}`;
var symbol6 = Symbol.for(marker6);
var _a6;
_a6 = symbol6;
var name6 = "AI_JSONParseError";
var marker7 = `vercel.ai.error.${name6}`;
var symbol7 = Symbol.for(marker7);
var _a7;
var JSONParseError = class extends AISDKError {
	constructor({ text, cause }) {
		super({
			name: name6,
			message: `JSON parsing failed: Text: ${text}.
Error message: ${getErrorMessage(cause)}`,
			cause
		});
		this[_a7] = true;
		this.text = text;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker7);
	}
};
_a7 = symbol7;
var name7 = "AI_LoadAPIKeyError";
var marker8 = `vercel.ai.error.${name7}`;
var symbol8 = Symbol.for(marker8);
var _a8;
_a8 = symbol8;
var name8 = "AI_LoadSettingError";
var marker9 = `vercel.ai.error.${name8}`;
var symbol9 = Symbol.for(marker9);
var _a9;
_a9 = symbol9;
var name9 = "AI_NoContentGeneratedError";
var marker10 = `vercel.ai.error.${name9}`;
var symbol10 = Symbol.for(marker10);
var _a10;
_a10 = symbol10;
var name10 = "AI_NoSuchModelError";
var marker11 = `vercel.ai.error.${name10}`;
var symbol11 = Symbol.for(marker11);
var _a11;
_a11 = symbol11;
var name11 = "AI_TooManyEmbeddingValuesForCallError";
var marker12 = `vercel.ai.error.${name11}`;
var symbol12 = Symbol.for(marker12);
var _a12;
_a12 = symbol12;
var name12 = "AI_TypeValidationError";
var marker13 = `vercel.ai.error.${name12}`;
var symbol13 = Symbol.for(marker13);
var _a13;
var _TypeValidationError = class _TypeValidationError$1 extends AISDKError {
	constructor({ value, cause }) {
		super({
			name: name12,
			message: `Type validation failed: Value: ${JSON.stringify(value)}.
Error message: ${getErrorMessage(cause)}`,
			cause
		});
		this[_a13] = true;
		this.value = value;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker13);
	}
	/**
	* Wraps an error into a TypeValidationError.
	* If the cause is already a TypeValidationError with the same value, it returns the cause.
	* Otherwise, it creates a new TypeValidationError.
	*
	* @param {Object} params - The parameters for wrapping the error.
	* @param {unknown} params.value - The value that failed validation.
	* @param {unknown} params.cause - The original error or cause of the validation failure.
	* @returns {TypeValidationError} A TypeValidationError instance.
	*/
	static wrap({ value, cause }) {
		return _TypeValidationError$1.isInstance(cause) && cause.value === value ? cause : new _TypeValidationError$1({
			value,
			cause
		});
	}
};
_a13 = symbol13;
var TypeValidationError = _TypeValidationError;
var name13 = "AI_UnsupportedFunctionalityError";
var marker14 = `vercel.ai.error.${name13}`;
var symbol14 = Symbol.for(marker14);
var _a14;
var UnsupportedFunctionalityError = class extends AISDKError {
	constructor({ functionality, message = `'${functionality}' functionality not supported.` }) {
		super({
			name: name13,
			message
		});
		this[_a14] = true;
		this.functionality = functionality;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker14);
	}
};
_a14 = symbol14;

//#endregion
//#region ../node_modules/eventsource-parser/dist/index.js
var ParseError = class extends Error {
	constructor(message, options) {
		super(message), this.name = "ParseError", this.type = options.type, this.field = options.field, this.value = options.value, this.line = options.line;
	}
};
function noop(_arg) {}
function createParser(callbacks) {
	if (typeof callbacks == "function") throw new TypeError("`callbacks` must be an object, got a function instead. Did you mean `{onEvent: fn}`?");
	const { onEvent = noop, onError = noop, onRetry = noop, onComment } = callbacks;
	let incompleteLine = "", isFirstChunk = !0, id, data = "", eventType = "";
	function feed(newChunk) {
		const chunk = isFirstChunk ? newChunk.replace(/^\xEF\xBB\xBF/, "") : newChunk, [complete, incomplete] = splitLines(`${incompleteLine}${chunk}`);
		for (const line of complete) parseLine(line);
		incompleteLine = incomplete, isFirstChunk = !1;
	}
	function parseLine(line) {
		if (line === "") {
			dispatchEvent();
			return;
		}
		if (line.startsWith(":")) {
			onComment && onComment(line.slice(line.startsWith(": ") ? 2 : 1));
			return;
		}
		const fieldSeparatorIndex = line.indexOf(":");
		if (fieldSeparatorIndex !== -1) {
			const field = line.slice(0, fieldSeparatorIndex), offset = line[fieldSeparatorIndex + 1] === " " ? 2 : 1;
			processField(field, line.slice(fieldSeparatorIndex + offset), line);
			return;
		}
		processField(line, "", line);
	}
	function processField(field, value, line) {
		switch (field) {
			case "event":
				eventType = value;
				break;
			case "data":
				data = `${data}${value}
`;
				break;
			case "id":
				id = value.includes("\0") ? void 0 : value;
				break;
			case "retry":
				/^\d+$/.test(value) ? onRetry(parseInt(value, 10)) : onError(new ParseError(`Invalid \`retry\` value: "${value}"`, {
					type: "invalid-retry",
					value,
					line
				}));
				break;
			default:
				onError(new ParseError(`Unknown field "${field.length > 20 ? `${field.slice(0, 20)}\u2026` : field}"`, {
					type: "unknown-field",
					field,
					value,
					line
				}));
				break;
		}
	}
	function dispatchEvent() {
		data.length > 0 && onEvent({
			id,
			event: eventType || void 0,
			data: data.endsWith(`
`) ? data.slice(0, -1) : data
		}), id = void 0, data = "", eventType = "";
	}
	function reset(options = {}) {
		incompleteLine && options.consume && parseLine(incompleteLine), isFirstChunk = !0, id = void 0, data = "", eventType = "", incompleteLine = "";
	}
	return {
		feed,
		reset
	};
}
function splitLines(chunk) {
	const lines = [];
	let incompleteLine = "", searchIndex = 0;
	for (; searchIndex < chunk.length;) {
		const crIndex = chunk.indexOf("\r", searchIndex), lfIndex = chunk.indexOf(`
`, searchIndex);
		let lineEnd = -1;
		if (crIndex !== -1 && lfIndex !== -1 ? lineEnd = Math.min(crIndex, lfIndex) : crIndex !== -1 ? crIndex === chunk.length - 1 ? lineEnd = -1 : lineEnd = crIndex : lfIndex !== -1 && (lineEnd = lfIndex), lineEnd === -1) {
			incompleteLine = chunk.slice(searchIndex);
			break;
		} else {
			const line = chunk.slice(searchIndex, lineEnd);
			lines.push(line), searchIndex = lineEnd + 1, chunk[searchIndex - 1] === "\r" && chunk[searchIndex] === `
` && searchIndex++;
		}
	}
	return [lines, incompleteLine];
}

//#endregion
//#region ../node_modules/eventsource-parser/dist/stream.js
var EventSourceParserStream = class extends TransformStream {
	constructor({ onError, onRetry, onComment } = {}) {
		let parser;
		super({
			start(controller) {
				parser = createParser({
					onEvent: (event) => {
						controller.enqueue(event);
					},
					onError(error) {
						onError === "terminate" ? controller.error(error) : typeof onError == "function" && onError(error);
					},
					onRetry,
					onComment
				});
			},
			transform(chunk) {
				parser.feed(chunk);
			}
		});
	}
};

//#endregion
//#region ../node_modules/@ai-sdk/provider-utils/dist/index.mjs
function combineHeaders(...headers) {
	return headers.reduce((combinedHeaders, currentHeaders) => ({
		...combinedHeaders,
		...currentHeaders != null ? currentHeaders : {}
	}), {});
}
function extractResponseHeaders(response) {
	return Object.fromEntries([...response.headers]);
}
var createIdGenerator = ({ prefix, size = 16, alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", separator = "-" } = {}) => {
	const generator = () => {
		const alphabetLength = alphabet.length;
		const chars = new Array(size);
		for (let i = 0; i < size; i++) chars[i] = alphabet[Math.random() * alphabetLength | 0];
		return chars.join("");
	};
	if (prefix == null) return generator;
	if (alphabet.includes(separator)) throw new InvalidArgumentError({
		argument: "separator",
		message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
	});
	return () => `${prefix}${separator}${generator()}`;
};
var generateId = createIdGenerator();
function isAbortError(error) {
	return (error instanceof Error || error instanceof DOMException) && (error.name === "AbortError" || error.name === "ResponseAborted" || error.name === "TimeoutError");
}
var FETCH_FAILED_ERROR_MESSAGES = ["fetch failed", "failed to fetch"];
function handleFetchError({ error, url, requestBodyValues }) {
	if (isAbortError(error)) return error;
	if (error instanceof TypeError && FETCH_FAILED_ERROR_MESSAGES.includes(error.message.toLowerCase())) {
		const cause = error.cause;
		if (cause != null) return new APICallError({
			message: `Cannot connect to API: ${cause.message}`,
			cause,
			url,
			requestBodyValues,
			isRetryable: true
		});
	}
	return error;
}
function getRuntimeEnvironmentUserAgent(globalThisAny = globalThis) {
	var _a$1, _b, _c;
	if (globalThisAny.window) return `runtime/browser`;
	if ((_a$1 = globalThisAny.navigator) == null ? void 0 : _a$1.userAgent) return `runtime/${globalThisAny.navigator.userAgent.toLowerCase()}`;
	if ((_c = (_b = globalThisAny.process) == null ? void 0 : _b.versions) == null ? void 0 : _c.node) return `runtime/node.js/${globalThisAny.process.version.substring(0)}`;
	if (globalThisAny.EdgeRuntime) return `runtime/vercel-edge`;
	return "runtime/unknown";
}
function normalizeHeaders(headers) {
	if (headers == null) return {};
	const normalized = {};
	if (headers instanceof Headers) headers.forEach((value, key) => {
		normalized[key.toLowerCase()] = value;
	});
	else {
		if (!Array.isArray(headers)) headers = Object.entries(headers);
		for (const [key, value] of headers) if (value != null) normalized[key.toLowerCase()] = value;
	}
	return normalized;
}
function withUserAgentSuffix(headers, ...userAgentSuffixParts) {
	const normalizedHeaders = new Headers(normalizeHeaders(headers));
	const currentUserAgentHeader = normalizedHeaders.get("user-agent") || "";
	normalizedHeaders.set("user-agent", [currentUserAgentHeader, ...userAgentSuffixParts].filter(Boolean).join(" "));
	return Object.fromEntries(normalizedHeaders.entries());
}
var VERSION = "3.0.16";
var suspectProtoRx = /"__proto__"\s*:/;
var suspectConstructorRx = /"constructor"\s*:/;
function _parse(text) {
	const obj = JSON.parse(text);
	if (obj === null || typeof obj !== "object") return obj;
	if (suspectProtoRx.test(text) === false && suspectConstructorRx.test(text) === false) return obj;
	return filter(obj);
}
function filter(obj) {
	let next = [obj];
	while (next.length) {
		const nodes = next;
		next = [];
		for (const node of nodes) {
			if (Object.prototype.hasOwnProperty.call(node, "__proto__")) throw new SyntaxError("Object contains forbidden prototype property");
			if (Object.prototype.hasOwnProperty.call(node, "constructor") && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) throw new SyntaxError("Object contains forbidden prototype property");
			for (const key in node) {
				const value = node[key];
				if (value && typeof value === "object") next.push(value);
			}
		}
	}
	return obj;
}
function secureJsonParse(text) {
	const { stackTraceLimit } = Error;
	Error.stackTraceLimit = 0;
	try {
		return _parse(text);
	} finally {
		Error.stackTraceLimit = stackTraceLimit;
	}
}
var validatorSymbol = Symbol.for("vercel.ai.validator");
function validator(validate) {
	return {
		[validatorSymbol]: true,
		validate
	};
}
function isValidator(value) {
	return typeof value === "object" && value !== null && validatorSymbol in value && value[validatorSymbol] === true && "validate" in value;
}
function asValidator(value) {
	return isValidator(value) ? value : typeof value === "function" ? value() : standardSchemaValidator(value);
}
function standardSchemaValidator(standardSchema) {
	return validator(async (value) => {
		const result = await standardSchema["~standard"].validate(value);
		return result.issues == null ? {
			success: true,
			value: result.value
		} : {
			success: false,
			error: new TypeValidationError({
				value,
				cause: result.issues
			})
		};
	});
}
async function validateTypes({ value, schema }) {
	const result = await safeValidateTypes({
		value,
		schema
	});
	if (!result.success) throw TypeValidationError.wrap({
		value,
		cause: result.error
	});
	return result.value;
}
async function safeValidateTypes({ value, schema }) {
	const validator2 = asValidator(schema);
	try {
		if (validator2.validate == null) return {
			success: true,
			value,
			rawValue: value
		};
		const result = await validator2.validate(value);
		if (result.success) return {
			success: true,
			value: result.value,
			rawValue: value
		};
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: result.error
			}),
			rawValue: value
		};
	} catch (error) {
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: error
			}),
			rawValue: value
		};
	}
}
async function parseJSON({ text, schema }) {
	try {
		const value = secureJsonParse(text);
		if (schema == null) return value;
		return validateTypes({
			value,
			schema
		});
	} catch (error) {
		if (JSONParseError.isInstance(error) || TypeValidationError.isInstance(error)) throw error;
		throw new JSONParseError({
			text,
			cause: error
		});
	}
}
async function safeParseJSON({ text, schema }) {
	try {
		const value = secureJsonParse(text);
		if (schema == null) return {
			success: true,
			value,
			rawValue: value
		};
		return await safeValidateTypes({
			value,
			schema
		});
	} catch (error) {
		return {
			success: false,
			error: JSONParseError.isInstance(error) ? error : new JSONParseError({
				text,
				cause: error
			}),
			rawValue: void 0
		};
	}
}
function parseJsonEventStream({ stream, schema }) {
	return stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).pipeThrough(new TransformStream({ async transform({ data }, controller) {
		if (data === "[DONE]") return;
		controller.enqueue(await safeParseJSON({
			text: data,
			schema
		}));
	} }));
}
async function parseProviderOptions({ provider, providerOptions, schema }) {
	if ((providerOptions == null ? void 0 : providerOptions[provider]) == null) return;
	const parsedProviderOptions = await safeValidateTypes({
		value: providerOptions[provider],
		schema
	});
	if (!parsedProviderOptions.success) throw new InvalidArgumentError({
		argument: "providerOptions",
		message: `invalid ${provider} provider options`,
		cause: parsedProviderOptions.error
	});
	return parsedProviderOptions.value;
}
var getOriginalFetch2 = () => globalThis.fetch;
var postJsonToApi = async ({ url, headers, body, failedResponseHandler, successfulResponseHandler, abortSignal, fetch: fetch$1 }) => postToApi({
	url,
	headers: {
		"Content-Type": "application/json",
		...headers
	},
	body: {
		content: JSON.stringify(body),
		values: body
	},
	failedResponseHandler,
	successfulResponseHandler,
	abortSignal,
	fetch: fetch$1
});
var postToApi = async ({ url, headers = {}, body, successfulResponseHandler, failedResponseHandler, abortSignal, fetch: fetch$1 = getOriginalFetch2() }) => {
	try {
		const response = await fetch$1(url, {
			method: "POST",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION}`, getRuntimeEnvironmentUserAgent()),
			body: body.content,
			signal: abortSignal
		});
		const responseHeaders = extractResponseHeaders(response);
		if (!response.ok) {
			let errorInformation;
			try {
				errorInformation = await failedResponseHandler({
					response,
					url,
					requestBodyValues: body.values
				});
			} catch (error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
				throw new APICallError({
					message: "Failed to process error response",
					cause: error,
					statusCode: response.status,
					url,
					responseHeaders,
					requestBodyValues: body.values
				});
			}
			throw errorInformation.value;
		}
		try {
			return await successfulResponseHandler({
				response,
				url,
				requestBodyValues: body.values
			});
		} catch (error) {
			if (error instanceof Error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
			}
			throw new APICallError({
				message: "Failed to process successful response",
				cause: error,
				statusCode: response.status,
				url,
				responseHeaders,
				requestBodyValues: body.values
			});
		}
	} catch (error) {
		throw handleFetchError({
			error,
			url,
			requestBodyValues: body.values
		});
	}
};
var createJsonErrorResponseHandler = ({ errorSchema, errorToMessage, isRetryable }) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await response.text();
	const responseHeaders = extractResponseHeaders(response);
	if (responseBody.trim() === "") return {
		responseHeaders,
		value: new APICallError({
			message: response.statusText,
			url,
			requestBodyValues,
			statusCode: response.status,
			responseHeaders,
			responseBody,
			isRetryable: isRetryable == null ? void 0 : isRetryable(response)
		})
	};
	try {
		const parsedError = await parseJSON({
			text: responseBody,
			schema: errorSchema
		});
		return {
			responseHeaders,
			value: new APICallError({
				message: errorToMessage(parsedError),
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				data: parsedError,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response, parsedError)
			})
		};
	} catch (parseError) {
		return {
			responseHeaders,
			value: new APICallError({
				message: response.statusText,
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response)
			})
		};
	}
};
var createEventSourceResponseHandler = (chunkSchema) => async ({ response }) => {
	const responseHeaders = extractResponseHeaders(response);
	if (response.body == null) throw new EmptyResponseBodyError({});
	return {
		responseHeaders,
		value: parseJsonEventStream({
			stream: response.body,
			schema: chunkSchema
		})
	};
};
var createJsonResponseHandler = (responseSchema) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await response.text();
	const parsedResult = await safeParseJSON({
		text: responseBody,
		schema: responseSchema
	});
	const responseHeaders = extractResponseHeaders(response);
	if (!parsedResult.success) throw new APICallError({
		message: "Invalid JSON response",
		cause: parsedResult.error,
		statusCode: response.status,
		responseHeaders,
		responseBody,
		url,
		requestBodyValues
	});
	return {
		responseHeaders,
		value: parsedResult.value,
		rawValue: parsedResult.rawValue
	};
};
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var schemaSymbol = Symbol.for("vercel.ai.schema");
var { btoa, atob } = globalThis;
function withoutTrailingSlash(url) {
	return url == null ? void 0 : url.replace(/\/$/, "");
}

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/chat-agent-language-model/chat-agent-schema.ts
const chatAgentToolCallSchema = z.object({
	type: z.literal("function"),
	function: z.object({
		name: z.string(),
		arguments: z.string()
	}),
	id: z.string()
});
const chatAgentAssistantMessageSchema = z.object({
	role: z.literal("assistant"),
	content: z.string(),
	id: z.string(),
	name: z.string().optional(),
	tool_calls: z.array(chatAgentToolCallSchema).optional()
});
const chatAgentToolMessageSchema = z.object({
	role: z.literal("tool"),
	name: z.string(),
	content: z.string(),
	tool_call_id: z.string(),
	id: z.string(),
	attachments: z.record(z.string(), z.unknown()).optional()
});
const chatAgentUserMessageSchema = z.object({
	role: z.literal("user"),
	content: z.string(),
	id: z.string()
});
const chatAgentMessageSchema = z.discriminatedUnion("role", [
	chatAgentAssistantMessageSchema,
	chatAgentToolMessageSchema,
	chatAgentUserMessageSchema
]);
const chatAgentChunkSchema = z.object({
	id: z.string(),
	delta: chatAgentMessageSchema
});
const chatAgentResponseSchema = z.object({
	id: z.string(),
	messages: z.array(chatAgentMessageSchema)
});

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/chat-agent-language-model/chat-agent-convert-to-message-parts.ts
const convertChatAgentChunkToMessagePart = (chunk) => {
	const parts = [];
	if (chunk.delta.role === "assistant") {
		if (chunk.delta.content) parts.push({
			type: "text-delta",
			id: chunk.delta.id,
			delta: chunk.delta.content
		});
		chunk.delta.tool_calls?.forEach((toolCall) => {
			parts.push({
				type: "tool-call",
				toolCallId: toolCall.id,
				input: toolCall.function.arguments,
				toolName: toolCall.function.name
			});
		});
	} else if (chunk.delta.role === "tool") parts.push({
		type: "tool-result",
		toolCallId: chunk.delta.tool_call_id,
		result: chunk.delta.content,
		toolName: DATABRICKS_TOOL_CALL_ID
	});
	return parts;
};
const convertChatAgentResponseToMessagePart = (response) => {
	const parts = [];
	for (const message of response.messages) if (message.role === "assistant") {
		parts.push({
			type: "text",
			text: message.content
		});
		for (const part of message.tool_calls ?? []) parts.push({
			type: "tool-call",
			toolCallId: part.id,
			input: part.function.arguments,
			toolName: part.function.name
		});
	} else if (message.role === "tool") parts.push({
		type: "tool-result",
		toolCallId: message.tool_call_id,
		result: message.content,
		toolName: DATABRICKS_TOOL_CALL_ID
	});
	return parts;
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/chat-agent-language-model/chat-agent-convert-to-input.ts
const convertLanguageModelV2PromptToChatAgentResponse = (prompt) => {
	const messages = [];
	let messageIndex = 0;
	for (const msg of prompt) {
		if (msg.role === "system") continue;
		if (msg.role === "user") {
			const text = (msg.content ?? []).filter((part) => part.type === "text").map((part) => part.text).join("\n");
			messages.push({
				role: "user",
				content: text,
				id: `user-${messageIndex++}`
			});
			continue;
		}
		if (msg.role === "assistant") {
			const textContent = (msg.content ?? []).filter((part) => part.type === "text" || part.type === "reasoning").map((part) => part.type === "text" ? part.text : part.text).join("\n");
			const toolCalls = (msg.content ?? []).filter((part) => part.type === "tool-call").map((call) => ({
				type: "function",
				id: call.toolCallId,
				function: {
					name: call.toolName,
					arguments: typeof call.input === "string" ? call.input : JSON.stringify(call.input ?? {})
				}
			}));
			messages.push({
				role: "assistant",
				content: textContent,
				id: `assistant-${messageIndex++}`,
				tool_calls: toolCalls.length > 0 ? toolCalls : void 0
			});
			for (const part of msg.content ?? []) if (part.type === "tool-result") {
				const content = (() => {
					switch (part.output.type) {
						case "text": return part.output.value;
						case "json": return JSON.stringify(part.output.value);
						case "error-text": return part.output.value;
						case "error-json": return JSON.stringify(part.output.value);
						case "content": return part.output.value.map((p) => p.type === "text" ? p.text : "").filter(Boolean).join("\n");
						default: return "";
					}
				})();
				messages.push({
					role: "tool",
					name: part.toolName,
					content,
					tool_call_id: part.toolCallId,
					id: `tool-${messageIndex++}`
				});
			}
			continue;
		}
		if (msg.role === "tool") {
			for (const part of msg.content ?? []) {
				if (part.type !== "tool-result") continue;
				const content = (() => {
					switch (part.output.type) {
						case "text": return part.output.value;
						case "json": return JSON.stringify(part.output.value);
						case "error-text": return part.output.value;
						case "error-json": return JSON.stringify(part.output.value);
						case "content": return part.output.value.map((p) => p.type === "text" ? p.text : "").filter(Boolean).join("\n");
						default: return "";
					}
				})();
				messages.push({
					role: "tool",
					name: part.toolName,
					content,
					tool_call_id: part.toolCallId,
					id: `tool-${messageIndex++}`
				});
			}
			continue;
		}
	}
	return messages;
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/stream-transformers/compose-stream-part-transformers.ts
/**
* Compose an arbitrary number of `DatabricksStreamPartTransformer`s.
*
* The returned function has the exact same signature as a normal transformer,
* but its `out`‑element type is inferred from the **last** transformer you pass
* in.
*
* Runtime behaviour:
*   1️⃣ Call the first transformer with the supplied `parts` and the
*      caller‑provided `last` (usually `null`).
*   2️⃣ Take its `out` and `last` and feed them to the next transformer.
*   3️⃣ …repeat until the last transformer runs.
*   4️⃣ Return the `out`/`last` of that final transformer.
*/
function composeDatabricksStreamPartTransformers(...transformers) {
	return (initialParts, last = null) => {
		let currentParts = initialParts;
		for (const fn of transformers) currentParts = fn(currentParts, last).out;
		return { out: currentParts };
	};
}

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/stream-transformers/databricks-delta-boundary.ts
/**
* Injects start/end deltas for sequential streams.
*/
const applyDeltaBoundaryTransform = (parts, last) => {
	const out = [];
	const lastDeltaType = maybeGetDeltaType(last);
	for (const incoming of parts) {
		const incomingDeltaType = maybeGetDeltaType(incoming);
		const incomingId = getPartId$1(incoming);
		const lastId = getPartId$1(last);
		if (Boolean(isDeltaPart(last) && isDeltaPart(incoming)) && Boolean(lastDeltaType && incomingDeltaType) && Boolean(lastDeltaType === incomingDeltaType) && Boolean(incomingId && lastId && incomingId === lastId)) {
			out.push(incoming);
			continue;
		}
		if (isDeltaPart(last)) out.push({
			type: `${getDeltaType(last)}-end`,
			id: last.id
		});
		if (isDeltaPart(incoming)) {
			out.push({
				type: `${getDeltaType(incoming)}-start`,
				id: incoming.id
			}, incoming);
			continue;
		}
		out.push(incoming);
	}
	return { out };
};
const isDeltaIsh = (part) => part?.type.startsWith("text-") || part?.type.startsWith("reasoning-") || false;
const maybeGetDeltaType = (part) => {
	if (!isDeltaIsh(part)) return null;
	if (part.type.startsWith("text-")) return "text";
	if (part.type.startsWith("reasoning-")) return "reasoning";
	return null;
};
const getDeltaType = (part) => {
	if (part.type.startsWith("text-")) return "text";
	if (part.type.startsWith("reasoning-")) return "reasoning";
	throw new Error(`Unknown delta type: ${part.type}`);
};
const isDeltaPart = (part) => part?.type === "text-delta" || part?.type === "reasoning-delta";
const getPartId$1 = (part) => {
	if (part && "id" in part) return part.id;
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/stream-transformers/databricks-stream-transformer.ts
/**
* Allows stream transformations to be composed together.
*
* Currently only used to automatically inject start/end
* deltas since the APIs does not supply the necessary events.
*/
const getDatabricksLanguageModelTransformStream = () => {
	let lastChunk = null;
	const deltaEndByTypeAndId = /* @__PURE__ */ new Set();
	const transformerStreamParts = composeDatabricksStreamPartTransformers(applyDeltaBoundaryTransform);
	return new TransformStream({
		transform(chunk, controller) {
			const { out } = transformerStreamParts([chunk], lastChunk);
			out.forEach((transformedChunk) => {
				const group = getDeltaGroup(transformedChunk.type);
				const endKey = makeEndKey(getPartId(transformedChunk), group);
				if (endKey && deltaEndByTypeAndId.has(endKey)) return;
				if (transformedChunk.type === "text-end" || transformedChunk.type === "reasoning-end") {
					/**
					* We register when a delta ends.
					* We rely on response.output_item.done chunks to display non streamed data
					* so we need to deduplicate them with their corresponding delta chunks.
					*/
					const endGroup = getDeltaGroup(transformedChunk.type);
					const key = makeEndKey(getPartId(transformedChunk), endGroup);
					if (key) deltaEndByTypeAndId.add(key);
				}
				controller.enqueue(transformedChunk);
			});
			lastChunk = out[out.length - 1] ?? lastChunk;
		},
		flush(controller) {
			if (lastChunk?.type === "text-delta") controller.enqueue({
				type: "text-end",
				id: lastChunk.id
			});
			if (lastChunk?.type === "reasoning-delta") controller.enqueue({
				type: "reasoning-end",
				id: lastChunk.id
			});
		}
	});
};
const getDeltaGroup = (type) => {
	if (type.startsWith("text-")) return "text";
	if (type.startsWith("reasoning-")) return "reasoning";
	return null;
};
const getPartId = (part) => {
	if ("id" in part) return part.id;
};
const makeEndKey = (id, group) => id && group ? `${group}:${id}` : null;

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/chat-agent-language-model/chat-agent-language-model.ts
var DatabricksChatAgentLanguageModel = class {
	specificationVersion = "v2";
	modelId;
	config;
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
	}
	get provider() {
		return this.config.provider;
	}
	supportedUrls = {};
	async doGenerate(options) {
		const { value: response } = await postJsonToApi({
			...this.getArgs({
				config: this.config,
				options,
				stream: false,
				modelId: this.modelId
			}),
			successfulResponseHandler: createJsonResponseHandler(chatAgentResponseSchema),
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: z.any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			})
		});
		return {
			content: convertChatAgentResponseToMessagePart(response),
			finishReason: "stop",
			usage: {
				inputTokens: 0,
				outputTokens: 0,
				totalTokens: 0
			},
			warnings: []
		};
	}
	async doStream(options) {
		const networkArgs = this.getArgs({
			config: this.config,
			options,
			stream: true,
			modelId: this.modelId
		});
		const { responseHeaders, value: response } = await postJsonToApi({
			...networkArgs,
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: z.any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			}),
			successfulResponseHandler: createEventSourceResponseHandler(chatAgentChunkSchema)
		});
		let finishReason = "unknown";
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings: []
					});
				},
				transform(chunk, controller) {
					console.log("[DatabricksChatAgentLanguageModel] transform", chunk);
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = "error";
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const parts = convertChatAgentChunkToMessagePart(chunk.value);
					for (const part of parts) controller.enqueue(part);
				},
				flush(controller) {
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: {
							inputTokens: 0,
							outputTokens: 0,
							totalTokens: 0
						}
					});
				}
			})).pipeThrough(getDatabricksLanguageModelTransformStream()),
			request: { body: networkArgs.body },
			response: { headers: responseHeaders }
		};
	}
	getArgs({ config, options, stream, modelId }) {
		return {
			body: {
				model: modelId,
				stream,
				messages: convertLanguageModelV2PromptToChatAgentResponse(options.prompt)
			},
			url: config.url({ path: "/completions" }),
			headers: combineHeaders(config.headers(), options.headers),
			fetch: config.fetch,
			abortSignal: options.abortSignal
		};
	}
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/responses-agent-language-model/responses-agent-schema.ts
/**
* Response schema
*/
const responsesAgentMessageSchema = z.object({
	type: z.literal("message"),
	role: z.literal("assistant"),
	id: z.string(),
	content: z.array(z.object({
		type: z.literal("output_text"),
		text: z.string(),
		logprobs: z.unknown().nullish(),
		annotations: z.array(z.discriminatedUnion("type", [z.object({
			type: z.literal("url_citation"),
			start_index: z.number(),
			end_index: z.number(),
			url: z.string(),
			title: z.string()
		})]))
	}))
});
const responsesAgentFunctionCallSchema = z.object({
	type: z.literal("function_call"),
	call_id: z.string(),
	name: z.string(),
	arguments: z.string(),
	id: z.string()
});
const responsesAgentReasoningSchema = z.object({
	type: z.literal("reasoning"),
	id: z.string(),
	encrypted_content: z.string().nullish(),
	summary: z.array(z.object({
		type: z.literal("summary_text"),
		text: z.string()
	}))
});
const responsesAgentFunctionCallOutputSchema = z.object({
	type: z.literal("function_call_output"),
	call_id: z.string(),
	output: z.any()
});
const responsesAgentMcpApprovalRequestSchema = z.object({
	type: z.literal("mcp_approval_request"),
	id: z.string(),
	name: z.string(),
	arguments: z.string(),
	server_label: z.string()
});
const responsesAgentMcpApprovalResponseSchema = z.object({
	type: z.literal("mcp_approval_response"),
	id: z.string().optional(),
	approval_request_id: z.string(),
	approve: z.boolean(),
	reason: z.string().nullish()
});
const responsesAgentOutputItem = z.discriminatedUnion("type", [
	responsesAgentMessageSchema,
	responsesAgentFunctionCallSchema,
	responsesAgentReasoningSchema,
	responsesAgentFunctionCallOutputSchema,
	responsesAgentMcpApprovalRequestSchema,
	responsesAgentMcpApprovalResponseSchema
]);
const responsesAgentResponseSchema = z.object({
	id: z.string().optional(),
	created_at: z.number().optional(),
	error: z.object({
		code: z.string(),
		message: z.string()
	}).nullish(),
	model: z.string().optional(),
	output: z.array(responsesAgentOutputItem)
});
/**
* Chunk schema
*/
const textDeltaChunkSchema = z.object({
	type: z.literal("response.output_text.delta"),
	item_id: z.string(),
	delta: z.string(),
	logprobs: z.unknown().nullish()
});
const errorChunkSchema = z.object({
	type: z.literal("error"),
	code: z.string(),
	message: z.string(),
	param: z.string().nullish(),
	sequence_number: z.number()
});
const responseOutputItemDoneSchema = z.object({
	type: z.literal("response.output_item.done"),
	output_index: z.number(),
	item: responsesAgentOutputItem
});
const responseAnnotationAddedSchema = z.object({
	type: z.literal("response.output_text.annotation.added"),
	annotation: z.discriminatedUnion("type", [z.object({
		type: z.literal("url_citation"),
		url: z.string(),
		title: z.string()
	})])
});
const responseReasoningSummaryTextDeltaSchema = z.object({
	type: z.literal("response.reasoning_summary_text.delta"),
	item_id: z.string(),
	summary_index: z.number(),
	delta: z.string()
});
const responseFunctionCallArgumentsDeltaSchema = z.object({
	type: z.literal("response.function_call_arguments.delta"),
	item_id: z.string(),
	delta: z.string(),
	output_index: z.number(),
	sequence_number: z.number()
});
const functionCallOutputChunkSchema = z.object({
	type: z.literal("function_call_output"),
	call_id: z.string(),
	output: z.any()
});
const responsesAgentChunkSchema = z.union([
	textDeltaChunkSchema,
	responseOutputItemDoneSchema,
	responseAnnotationAddedSchema,
	responseReasoningSummaryTextDeltaSchema,
	responseFunctionCallArgumentsDeltaSchema,
	functionCallOutputChunkSchema,
	errorChunkSchema
]);
/**
* We use a loose schema for response validation to handle unknown chunks.
*/
const looseResponseAgentChunkSchema = z.union([responsesAgentChunkSchema, z.object({ type: z.string() }).loose()]);

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/responses-agent-language-model/responses-convert-to-message-parts.ts
const convertResponsesAgentChunkToMessagePart = (chunk) => {
	const parts = [];
	switch (chunk.type) {
		case "response.output_text.delta":
			parts.push({
				type: "text-delta",
				id: chunk.item_id,
				delta: chunk.delta,
				providerMetadata: { databricks: { itemId: chunk.item_id } }
			});
			break;
		case "response.reasoning_summary_text.delta":
			parts.push({
				type: "reasoning-delta",
				id: chunk.item_id,
				delta: chunk.delta,
				providerMetadata: { databricks: { itemId: chunk.item_id } }
			});
			break;
		case "function_call_output":
			parts.push({
				type: "tool-result",
				toolCallId: chunk.call_id,
				result: chunk.output,
				toolName: DATABRICKS_TOOL_CALL_ID
			});
			break;
		case "response.output_item.done":
			if (chunk.item.type === "message") parts.push({
				type: "text-start",
				id: chunk.item.id
			}, {
				type: "text-delta",
				id: chunk.item.id,
				delta: chunk.item.content[0].text,
				providerMetadata: { databricks: { itemId: chunk.item.id } }
			}, {
				type: "text-end",
				id: chunk.item.id
			});
			else if (chunk.item.type === "function_call") parts.push({
				type: "tool-call",
				toolCallId: chunk.item.call_id,
				toolName: DATABRICKS_TOOL_CALL_ID,
				input: chunk.item.arguments,
				providerMetadata: { databricks: {
					toolName: chunk.item.name,
					itemId: chunk.item.id
				} }
			});
			else if (chunk.item.type === "function_call_output") parts.push({
				type: "tool-result",
				toolCallId: chunk.item.call_id,
				result: chunk.item.output,
				toolName: DATABRICKS_TOOL_CALL_ID
			});
			else if (chunk.item.type === "reasoning") parts.push({
				type: "reasoning-start",
				id: chunk.item.id
			}, {
				type: "reasoning-delta",
				id: chunk.item.id,
				delta: chunk.item.summary[0].text,
				providerMetadata: { databricks: { itemId: chunk.item.id } }
			}, {
				type: "reasoning-end",
				id: chunk.item.id
			});
			else if (chunk.item.type === "mcp_approval_request") parts.push({
				type: "tool-call",
				toolCallId: chunk.item.id,
				toolName: DATABRICKS_TOOL_CALL_ID,
				input: chunk.item.arguments,
				providerMetadata: { databricks: {
					type: MCP_APPROVAL_REQUEST_TYPE,
					toolName: chunk.item.name,
					itemId: chunk.item.id,
					serverLabel: chunk.item.server_label
				} }
			});
			else if (chunk.item.type === "mcp_approval_response") parts.push({
				type: "tool-result",
				toolCallId: chunk.item.approval_request_id,
				toolName: DATABRICKS_TOOL_CALL_ID,
				result: createApprovalStatusOutput(chunk.item.approve),
				providerMetadata: { databricks: {
					type: MCP_APPROVAL_RESPONSE_TYPE,
					...chunk.item.id != null && { itemId: chunk.item.id }
				} }
			});
			else chunk.item;
			break;
		case "response.output_text.annotation.added":
			parts.push({
				type: "source",
				url: chunk.annotation.url,
				title: chunk.annotation.title,
				id: crypto.randomUUID(),
				sourceType: "url"
			});
			break;
		case "error":
			parts.push({
				type: "error",
				error: chunk
			});
			break;
		default: break;
	}
	return parts;
};
const convertResponsesAgentResponseToMessagePart = (response) => {
	const parts = [];
	for (const output of response.output) switch (output.type) {
		case "message":
			for (const content of output.content) if (content.type === "output_text") parts.push({
				type: "text",
				text: content.text,
				providerMetadata: { databricks: { itemId: output.id } }
			});
			break;
		case "function_call":
			parts.push({
				type: "tool-call",
				toolCallId: output.call_id,
				toolName: output.name,
				input: output.arguments,
				providerMetadata: { databricks: { itemId: output.id } }
			});
			break;
		case "reasoning":
			for (const summary of output.summary) if (summary.type === "summary_text") parts.push({
				type: "reasoning",
				text: summary.text,
				providerMetadata: { databricks: { itemId: output.id } }
			});
			break;
		case "function_call_output":
			parts.push({
				type: "tool-result",
				result: output.output,
				toolCallId: output.call_id,
				toolName: DATABRICKS_TOOL_CALL_ID
			});
			break;
		case "mcp_approval_request":
			parts.push({
				type: "tool-call",
				toolCallId: output.id,
				toolName: DATABRICKS_TOOL_CALL_ID,
				input: output.arguments,
				providerMetadata: { databricks: {
					type: MCP_APPROVAL_REQUEST_TYPE,
					toolName: output.name,
					itemId: output.id,
					serverLabel: output.server_label
				} }
			});
			break;
		case "mcp_approval_response":
			parts.push({
				type: "tool-result",
				toolCallId: output.approval_request_id,
				toolName: DATABRICKS_TOOL_CALL_ID,
				result: createApprovalStatusOutput(output.approve),
				providerMetadata: { databricks: {
					type: MCP_APPROVAL_RESPONSE_TYPE,
					...output.id != null && { itemId: output.id }
				} }
			});
			break;
		default: break;
	}
	return parts;
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/responses-agent-language-model/responses-convert-to-input.ts
async function convertToResponsesInput({ prompt, systemMessageMode }) {
	const input = [];
	const warnings = [];
	const toolCallResultsByToolCallId = prompt.filter((p) => p.role === "tool").flatMap((p) => p.content).reduce((reduction, toolCallResult) => {
		if (toolCallResult.type === "tool-result") reduction[toolCallResult.toolCallId] = toolCallResult;
		return reduction;
	}, {});
	for (const { role, content } of prompt) switch (role) {
		case "system":
			switch (systemMessageMode) {
				case "system":
					input.push({
						role: "system",
						content
					});
					break;
				case "developer":
					input.push({
						role: "developer",
						content
					});
					break;
				case "remove":
					warnings.push({
						type: "other",
						message: "system messages are removed for this model"
					});
					break;
				default: {
					const _exhaustiveCheck = systemMessageMode;
					throw new Error(`Unsupported system message mode: ${_exhaustiveCheck}`);
				}
			}
			break;
		case "user":
			input.push({
				role: "user",
				content: content.map((part) => {
					switch (part.type) {
						case "text": return {
							type: "input_text",
							text: part.text
						};
						default: throw new UnsupportedFunctionalityError({ functionality: `part ${JSON.stringify(part)}` });
					}
				})
			});
			break;
		case "assistant":
			for (const part of content) {
				const providerOptions = await parseProviderOptions({
					provider: "databricks",
					providerOptions: part.providerOptions,
					schema: ProviderOptionsSchema
				});
				const itemId = providerOptions?.itemId ?? void 0;
				switch (part.type) {
					case "text":
						input.push({
							role: "assistant",
							content: [{
								type: "output_text",
								text: part.text
							}],
							id: itemId
						});
						break;
					case "tool-call": {
						const toolName = providerOptions?.toolName ?? part.toolName;
						if (providerOptions?.type === MCP_APPROVAL_REQUEST_TYPE) {
							const serverLabel = providerOptions?.serverLabel ?? "";
							const argumentsString = JSON.stringify(part.input);
							const id = part.toolCallId;
							input.push({
								type: MCP_APPROVAL_REQUEST_TYPE,
								id,
								name: toolName,
								arguments: argumentsString,
								server_label: serverLabel
							});
							const toolResult = toolCallResultsByToolCallId[part.toolCallId];
							if (toolResult) {
								/**
								* The tool call result is either the approval status or the actual output from the tool call.
								* If it's the approval status, we need to add an approval response part.
								* If it's the tool call output, we don't include the approval response part but we do include the tool call output part.
								*/
								const approvalStatus = extractApprovalStatusFromToolResult(toolResult.output);
								if (approvalStatus !== void 0) input.push({
									type: MCP_APPROVAL_RESPONSE_TYPE,
									id: toolResult.toolCallId,
									approval_request_id: toolResult.toolCallId,
									approve: approvalStatus
								});
								else input.push({
									type: "function_call_output",
									call_id: toolResult.toolCallId,
									output: convertToolResultOutputToString(toolResult.output)
								});
							}
							break;
						}
						input.push({
							type: "function_call",
							call_id: part.toolCallId,
							name: toolName,
							arguments: JSON.stringify(part.input),
							id: itemId
						});
						const toolCallResult = toolCallResultsByToolCallId[part.toolCallId];
						if (toolCallResult) input.push({
							type: "function_call_output",
							call_id: part.toolCallId,
							output: convertToolResultOutputToString(toolCallResult.output)
						});
						break;
					}
					case "tool-result":
						if (providerOptions?.type === MCP_APPROVAL_RESPONSE_TYPE) {
							const approvalRequestId = providerOptions?.approvalRequestId ?? part.toolCallId;
							const approve = providerOptions?.approve ?? false;
							const reason = providerOptions?.reason ?? "";
							input.push({
								type: MCP_APPROVAL_RESPONSE_TYPE,
								id: approvalRequestId,
								approval_request_id: approvalRequestId,
								approve,
								reason
							});
							break;
						}
						input.push({
							type: "function_call_output",
							call_id: part.toolCallId,
							output: convertToolResultOutputToString(part.output)
						});
						break;
					case "reasoning":
						if (!itemId) break;
						input.push({
							type: "reasoning",
							summary: [{
								type: "summary_text",
								text: part.text
							}],
							id: itemId
						});
						break;
				}
			}
			break;
		case "tool": break;
		default: {
			const _exhaustiveCheck = role;
			throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
		}
	}
	return {
		input,
		warnings
	};
}
const ProviderOptionsSchema = z.object({
	itemId: z.string().nullish(),
	toolName: z.string().nullish(),
	type: z.enum(["mcp_approval_request", "mcp_approval_response"]).nullish(),
	serverLabel: z.string().nullish(),
	approvalRequestId: z.string().nullish(),
	approve: z.boolean().nullish(),
	reason: z.string().nullish()
});
const convertToolResultOutputToString = (output) => {
	switch (output.type) {
		case "text":
		case "error-text": return output.value;
		default: return JSON.stringify(output.value);
	}
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/responses-agent-language-model/responses-agent-language-model.ts
var DatabricksResponsesAgentLanguageModel = class {
	specificationVersion = "v2";
	modelId;
	config;
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
	}
	get provider() {
		return this.config.provider;
	}
	supportedUrls = {};
	async doGenerate(options) {
		const { value: response } = await postJsonToApi({
			...await this.getArgs({
				config: this.config,
				options,
				stream: false,
				modelId: this.modelId
			}),
			successfulResponseHandler: createJsonResponseHandler(responsesAgentResponseSchema),
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: z.any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			})
		});
		return {
			content: convertResponsesAgentResponseToMessagePart(response),
			finishReason: "stop",
			usage: {
				inputTokens: 0,
				outputTokens: 0,
				totalTokens: 0
			},
			warnings: []
		};
	}
	async doStream(options) {
		const networkArgs = await this.getArgs({
			config: this.config,
			options,
			stream: true,
			modelId: this.modelId
		});
		const { responseHeaders, value: response } = await postJsonToApi({
			...networkArgs,
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: z.any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			}),
			successfulResponseHandler: createEventSourceResponseHandler(looseResponseAgentChunkSchema),
			abortSignal: options.abortSignal
		});
		let finishReason = "unknown";
		const allParts = [];
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings: []
					});
				},
				transform(chunk, controller) {
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = "error";
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const parts = convertResponsesAgentChunkToMessagePart(chunk.value);
					allParts.push(...parts);
					/**
					* Check if the last chunk was a tool result without a tool call
					* This is a special case for MCP approval requests where the tool result
					* is sent in a separate call after the tool call was approved/denied.
					*/
					if (parts.length === 0) return;
					const part = parts[0];
					if (part.type === "tool-result") {
						const matchingToolCallInParts = parts.find((c) => c.type === "tool-call" && c.toolCallId === part.toolCallId);
						const matchingToolCallInStream = allParts.find((c) => c.type === "tool-call" && c.toolCallId === part.toolCallId);
						if (!matchingToolCallInParts && !matchingToolCallInStream) {
							const toolCallFromPreviousMessages = options.prompt.flatMap((message) => {
								if (typeof message.content === "string") return [];
								return message.content;
							}).find((p) => p.type === "tool-call" && p.toolCallId === part.toolCallId);
							if (!toolCallFromPreviousMessages) throw new Error("No matching tool call found in previous message");
							if (toolCallFromPreviousMessages.type === "tool-call") controller.enqueue({
								...toolCallFromPreviousMessages,
								input: JSON.stringify(toolCallFromPreviousMessages.input)
							});
						}
					}
					for (const part$1 of parts) controller.enqueue(part$1);
				},
				flush(controller) {
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: {
							inputTokens: 0,
							outputTokens: 0,
							totalTokens: 0
						}
					});
				}
			})).pipeThrough(getDatabricksLanguageModelTransformStream()),
			request: { body: networkArgs.body },
			response: { headers: responseHeaders }
		};
	}
	async getArgs({ config, options, stream, modelId }) {
		const { input } = await convertToResponsesInput({
			prompt: options.prompt,
			systemMessageMode: "system"
		});
		return {
			url: config.url({ path: "/responses" }),
			headers: combineHeaders(config.headers(), options.headers),
			body: {
				model: modelId,
				input,
				stream
			},
			fetch: config.fetch
		};
	}
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/fmapi-language-model/fmapi-schema.ts
const reasoningSummarySchema = z.discriminatedUnion("type", [z.object({
	type: z.literal("summary_text"),
	text: z.string(),
	signature: z.string().optional()
}), z.object({
	type: z.literal("summary_encrypted_text"),
	data: z.string()
})]);
const contentItemSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("text"),
		text: z.string(),
		citation: z.unknown().optional()
	}),
	z.object({
		type: z.literal("image"),
		image_url: z.string()
	}),
	z.object({
		type: z.literal("reasoning"),
		summary: z.array(reasoningSummarySchema)
	})
]);
const fmapiChunkSchema = z.object({
	id: z.string(),
	created: z.number(),
	model: z.string(),
	usage: z.object({
		prompt_tokens: z.number(),
		completion_tokens: z.number(),
		total_tokens: z.number()
	}).nullable().optional(),
	object: z.literal("chat.completion.chunk"),
	choices: z.array(z.object({
		index: z.number(),
		delta: z.object({
			role: z.union([
				z.literal("assistant"),
				z.null(),
				z.undefined()
			]).optional(),
			content: z.union([z.string(), z.array(contentItemSchema)]).optional()
		}),
		finish_reason: z.union([z.literal("stop"), z.null()]).optional()
	}))
});
const fmapiResponseSchema = z.object({
	id: z.string(),
	created: z.number(),
	model: z.string(),
	usage: z.object({
		prompt_tokens: z.number(),
		completion_tokens: z.number(),
		total_tokens: z.number()
	}).nullable().optional(),
	choices: z.array(z.object({ message: z.object({
		role: z.union([
			z.literal("assistant"),
			z.literal("user"),
			z.literal("tool")
		]),
		content: z.union([z.string(), z.array(contentItemSchema)]).optional()
	}) }))
});

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/fmapi-language-model/fmapi-tags.ts
const TAGS = {
	LEGACY_CALL_OPEN: "<uc_function_call>",
	LEGACY_CALL_CLOSE: "</uc_function_call>",
	LEGACY_RESULT_OPEN: "<uc_function_result>",
	LEGACY_RESULT_CLOSE: "</uc_function_result>",
	CALL_OPEN: "<tool_call>",
	CALL_CLOSE: "</tool_call>",
	RESULT_OPEN: "<tool_call_result>",
	RESULT_CLOSE: "</tool_call_result>"
};
const tagSplitRegex = new RegExp(`(${escapeRegex(TAGS.LEGACY_CALL_OPEN)}.*?${escapeRegex(TAGS.LEGACY_CALL_CLOSE)}|${escapeRegex(TAGS.LEGACY_RESULT_OPEN)}.*?${escapeRegex(TAGS.LEGACY_RESULT_CLOSE)}|${escapeRegex(TAGS.CALL_OPEN)}.*?${escapeRegex(TAGS.CALL_CLOSE)}|${escapeRegex(TAGS.RESULT_OPEN)}.*?${escapeRegex(TAGS.RESULT_CLOSE)})`, "g");
function parseTaggedToolCall(text) {
	const inner = stripEnclosingTag(text, TAGS.LEGACY_CALL_OPEN, TAGS.LEGACY_CALL_CLOSE) ?? stripEnclosingTag(text, TAGS.CALL_OPEN, TAGS.CALL_CLOSE);
	if (inner == null) return null;
	try {
		const parsed = JSON.parse(inner);
		if (parsed && typeof parsed === "object" && "id" in parsed && "name" in parsed) return {
			id: String(parsed.id),
			name: String(parsed.name),
			arguments: parsed.arguments
		};
	} catch {}
	return null;
}
function parseTaggedToolResult(text) {
	const inner = stripEnclosingTag(text, TAGS.LEGACY_RESULT_OPEN, TAGS.LEGACY_RESULT_CLOSE) ?? stripEnclosingTag(text, TAGS.RESULT_OPEN, TAGS.RESULT_CLOSE);
	if (inner == null) return null;
	try {
		const parsed = JSON.parse(inner);
		if (parsed && typeof parsed === "object" && "id" in parsed) return {
			id: String(parsed.id),
			content: parsed.content
		};
	} catch {}
	return null;
}
function serializeToolCall(value) {
	const payload = JSON.stringify({
		id: value.id,
		name: value.name,
		arguments: value.arguments
	});
	return `${TAGS.CALL_OPEN}${payload}${TAGS.CALL_CLOSE}`;
}
function serializeToolResult(value) {
	const payload = JSON.stringify({
		id: value.id,
		content: value.content
	});
	return `${TAGS.RESULT_OPEN}${payload}${TAGS.RESULT_CLOSE}`;
}
function stripEnclosingTag(text, open, close) {
	const trimmed = text.trim();
	if (trimmed.startsWith(open) && trimmed.endsWith(close)) return trimmed.slice(open.length, trimmed.length - close.length);
	return null;
}
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/fmapi-language-model/fmapi-convert-to-message-parts.ts
const convertFmapiChunkToMessagePart = (chunk) => {
	const parts = [];
	if (chunk.choices.length === 0) return parts;
	const choice = chunk.choices[0];
	if (typeof choice.delta.content === "string") {
		const extracted = extractPartsFromTextCompletion(choice.delta.content);
		for (const part of extracted) if (part.type === "text") parts.push({
			type: "text-delta",
			id: chunk.id,
			delta: part.text
		});
		else parts.push(part);
	} else if (Array.isArray(choice.delta.content)) parts.push(...mapContentItemsToStreamParts(choice.delta.content, chunk.id));
	return parts;
};
const convertFmapiResponseToMessagePart = (response) => {
	const parts = [];
	const choice = response.choices[0];
	if (typeof choice.message.content === "string") {
		const extracted = extractToolPartsFromText(choice.message.content);
		if (extracted) for (const part of extracted) parts.push(part);
		else parts.push({
			type: "text",
			text: choice.message.content
		});
	} else parts.push(...mapContentItemsToProviderContent(choice.message.content ?? []));
	return parts;
};
const extractPartsFromTextCompletion = (text) => {
	const parts = text.split(tagSplitRegex);
	const accumulated = [];
	for (const segment of parts.filter((p) => p !== "")) {
		const toolParts = extractToolPartsFromText(segment);
		if (toolParts) accumulated.push(...toolParts);
		else accumulated.push({
			type: "text",
			text: segment
		});
	}
	return accumulated;
};
const extractToolPartsFromText = (text) => {
	const trimmed = text.trim();
	const call = parseTaggedToolCall(trimmed);
	if (call) return [{
		type: "tool-call",
		input: typeof call.arguments === "string" ? call.arguments : JSON.stringify(call.arguments),
		toolName: call.name,
		toolCallId: call.id,
		providerExecuted: true
	}];
	const result = parseTaggedToolResult(trimmed);
	if (result) return [{
		type: "tool-result",
		result: result.content,
		toolCallId: result.id,
		toolName: DATABRICKS_TOOL_CALL_ID
	}];
	return null;
};
const mapContentItemsToStreamParts = (items, id) => {
	const parts = [];
	for (const item of items) switch (item.type) {
		case "text":
			parts.push({
				type: "text-delta",
				id,
				delta: item.text
			});
			break;
		case "image": break;
		case "reasoning":
			for (const summary of item.summary.filter((s) => s.type === "summary_text")) parts.push({
				type: "reasoning-delta",
				id,
				delta: summary.text
			});
			break;
	}
	return parts;
};
const mapContentItemsToProviderContent = (items) => {
	const parts = [];
	for (const item of items) switch (item.type) {
		case "text":
			parts.push({
				type: "text",
				text: item.text
			});
			break;
		case "image": break;
		case "reasoning":
			for (const summary of item.summary.filter((s) => s.type === "summary_text")) parts.push({
				type: "reasoning",
				text: summary.text
			});
			break;
	}
	return parts;
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/fmapi-language-model/fmapi-convert-to-input.ts
const convertPromptToFmapiMessages = (prompt) => {
	return { messages: prompt.map((message) => {
		const role = message.role === "system" ? "user" : message.role;
		const contentItems = [];
		if (message.role === "system") contentItems.push({
			type: "text",
			text: message.content
		});
		else if (message.role === "user") {
			for (const part of message.content) if (part.type === "text") contentItems.push({
				type: "text",
				text: part.text
			});
			else if (part.type === "file") {
				const file = part;
				if (file.mediaType.startsWith("image/")) {
					const url = toHttpUrlString(file.data);
					if (url) contentItems.push({
						type: "image",
						image_url: url
					});
				}
			}
		} else if (message.role === "assistant") for (const part of message.content) switch (part.type) {
			case "text":
				contentItems.push({
					type: "text",
					text: part.text
				});
				break;
			case "file": {
				const file = part;
				if (file.mediaType.startsWith("image/")) {
					const url = toHttpUrlString(file.data);
					if (url) contentItems.push({
						type: "image",
						image_url: url
					});
				}
				break;
			}
			case "reasoning":
				contentItems.push({
					type: "reasoning",
					summary: [{
						type: "summary_text",
						text: part.text
					}]
				});
				break;
			case "tool-call": {
				const tagged = serializeToolCall({
					id: part.toolCallId,
					name: part.toolName,
					arguments: part.input
				});
				contentItems.push({
					type: "text",
					text: tagged
				});
				break;
			}
			case "tool-result": {
				const tagged = serializeToolResult({
					id: part.toolCallId,
					content: convertToolResultOutputToContentValue(part.output)
				});
				contentItems.push({
					type: "text",
					text: tagged
				});
				break;
			}
		}
		else if (message.role === "tool") {
			for (const part of message.content) if (part.type === "tool-result") {
				const tagged = serializeToolResult({
					id: part.toolCallId,
					content: convertToolResultOutputToContentValue(part.output)
				});
				contentItems.push({
					type: "text",
					text: tagged
				});
			}
		}
		return {
			role,
			content: contentItems.length === 0 ? "" : contentItems
		};
	}) };
};
const toHttpUrlString = (data) => {
	if (data instanceof URL) return data.toString();
	if (typeof data === "string") {
		if (data.startsWith("http://") || data.startsWith("https://")) return data;
	}
	return null;
};
const convertToolResultOutputToContentValue = (output) => {
	switch (output.type) {
		case "text":
		case "error-text": return output.value;
		case "json":
		case "error-json": return output.value;
		case "content": return output.value;
		default: return null;
	}
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/fmapi-language-model/fmapi-language-model.ts
var DatabricksFmapiLanguageModel = class {
	specificationVersion = "v2";
	modelId;
	config;
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
	}
	get provider() {
		return this.config.provider;
	}
	supportedUrls = {};
	async doGenerate(options) {
		const { value: response } = await postJsonToApi({
			...this.getArgs({
				config: this.config,
				options,
				stream: false,
				modelId: this.modelId
			}),
			successfulResponseHandler: createJsonResponseHandler(fmapiResponseSchema),
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: z.any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			})
		});
		return {
			content: convertFmapiResponseToMessagePart(response),
			finishReason: "stop",
			usage: {
				inputTokens: 0,
				outputTokens: 0,
				totalTokens: 0
			},
			warnings: []
		};
	}
	async doStream(options) {
		const networkArgs = this.getArgs({
			config: this.config,
			options,
			stream: true,
			modelId: this.modelId
		});
		const { responseHeaders, value: response } = await postJsonToApi({
			...networkArgs,
			failedResponseHandler: createJsonErrorResponseHandler({
				errorSchema: z.any(),
				errorToMessage: (error) => JSON.stringify(error),
				isRetryable: () => false
			}),
			successfulResponseHandler: createEventSourceResponseHandler(fmapiChunkSchema),
			abortSignal: options.abortSignal
		});
		let finishReason = "unknown";
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings: []
					});
				},
				transform(chunk, controller) {
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = "error";
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const parts = convertFmapiChunkToMessagePart(chunk.value);
					for (const part of parts) controller.enqueue(part);
				},
				flush(controller) {
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: {
							inputTokens: 0,
							outputTokens: 0,
							totalTokens: 0
						}
					});
				}
			})).pipeThrough(getDatabricksLanguageModelTransformStream()),
			request: { body: networkArgs.body },
			response: { headers: responseHeaders }
		};
	}
	getArgs({ config, options, stream, modelId }) {
		return {
			url: config.url({ path: "/chat/completions" }),
			headers: combineHeaders(config.headers(), options.headers),
			body: {
				messages: convertPromptToFmapiMessages(options.prompt).messages,
				stream,
				model: modelId
			},
			fetch: config.fetch
		};
	}
};

//#endregion
//#region ../packages/ai-sdk-providers/src/databricks-provider/index.ts
const createDatabricksProvider = (settings) => {
	const baseUrl = withoutTrailingSlash(settings.baseURL);
	const getHeaders = () => combineHeaders(settings.headers);
	const fetch$1 = settings.fetch;
	const provider = settings.provider ?? "databricks";
	const formatUrl = ({ path }) => settings.formatUrl?.({
		baseUrl,
		path
	}) ?? `${baseUrl}${path}`;
	const createChatAgent = (modelId) => new DatabricksChatAgentLanguageModel(modelId, {
		url: formatUrl,
		headers: getHeaders,
		fetch: fetch$1,
		provider
	});
	const createResponsesAgent = (modelId) => new DatabricksResponsesAgentLanguageModel(modelId, {
		url: formatUrl,
		headers: getHeaders,
		fetch: fetch$1,
		provider
	});
	const createFmapi = (modelId) => new DatabricksFmapiLanguageModel(modelId, {
		url: formatUrl,
		headers: getHeaders,
		fetch: fetch$1,
		provider
	});
	const notImplemented = (name$1) => {
		return () => {
			throw new Error(`${name$1} is not supported yet`);
		};
	};
	return {
		chatAgent: createChatAgent,
		responsesAgent: createResponsesAgent,
		fmapi: createFmapi,
		imageModel: notImplemented("ImageModel"),
		textEmbeddingModel: notImplemented("TextEmbeddingModel"),
		languageModel: notImplemented("LanguageModel")
	};
};

//#endregion
//#region ../packages/ai-sdk-providers/src/providers-server.ts
async function getProviderToken(session) {
	if (process.env.DATABRICKS_TOKEN) {
		console.log("Using PAT token from DATABRICKS_TOKEN env var");
		return process.env.DATABRICKS_TOKEN;
	}
	return getDatabricksTokenForRequest(session);
}
let cachedWorkspaceHostname = null;
async function getWorkspaceHostname() {
	if (cachedWorkspaceHostname) return cachedWorkspaceHostname;
	try {
		if (getAuthMethod() === "cli") {
			await getDatabricksUserIdentity();
			const cliHost = getCachedCliHost();
			if (cliHost) {
				cachedWorkspaceHostname = cliHost;
				return cachedWorkspaceHostname;
			} else throw new Error("CLI authentication succeeded but hostname was not cached");
		} else {
			cachedWorkspaceHostname = getHostUrl();
			return cachedWorkspaceHostname;
		}
	} catch (error) {
		throw new Error(`Unable to determine Databricks workspace hostname: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}
const LOG_SSE_EVENTS = process.env.LOG_SSE_EVENTS === "true";
const databricksFetch = async (input, init) => {
	const url = input.toString();
	if (init?.body) try {
		const requestBody = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
		console.log("Databricks request:", JSON.stringify({
			url,
			method: init.method || "POST",
			body: requestBody
		}));
	} catch (_e) {
		console.log("Databricks request (raw):", {
			url,
			method: init.method || "POST",
			body: init.body
		});
	}
	const response = await fetch(url, init);
	if (LOG_SSE_EVENTS && response.body) {
		const contentType = response.headers.get("content-type") || "";
		if (contentType.includes("text/event-stream") || contentType.includes("application/x-ndjson")) {
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let eventCounter = 0;
			const loggingStream = new ReadableStream({
				async pull(controller) {
					const { done, value } = await reader.read();
					if (done) {
						console.log("[SSE] Stream ended");
						controller.close();
						return;
					}
					const lines = decoder.decode(value, { stream: true }).split("\n").filter((line) => line.trim());
					for (const line of lines) {
						eventCounter++;
						if (line.startsWith("data:")) {
							const data = line.slice(5).trim();
							try {
								const parsed = JSON.parse(data);
								console.log(`[SSE #${eventCounter}]`, JSON.stringify(parsed));
							} catch {
								console.log(`[SSE #${eventCounter}] (raw)`, data);
							}
						} else if (line.trim()) console.log(`[SSE #${eventCounter}] (line)`, line);
					}
					controller.enqueue(value);
				},
				cancel() {
					reader.cancel();
				}
			});
			return new Response(loggingStream, {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers
			});
		}
	}
	return response;
};
let oauthProviderCache = null;
let oauthProviderCacheTime = 0;
const PROVIDER_CACHE_DURATION = 300 * 1e3;
const API_PROXY = process.env.API_PROXY;
async function getOrCreateDatabricksProvider(session) {
	const useCache = !session?.accessToken;
	if (useCache && oauthProviderCache && Date.now() - oauthProviderCacheTime < PROVIDER_CACHE_DURATION) {
		console.log("Using cached OAuth provider");
		return oauthProviderCache;
	}
	console.log("Creating new OAuth provider" + (session?.accessToken ? " (OBO)" : ""));
	await getProviderToken(session);
	const provider = createDatabricksProvider({
		baseURL: `${await getWorkspaceHostname()}/serving-endpoints`,
		formatUrl: ({ baseUrl, path }) => API_PROXY ?? `${baseUrl}${path}`,
		fetch: async (...[input, init]) => {
			const currentToken = await getProviderToken(session);
			const headers = new Headers(init?.headers);
			headers.set("Authorization", `Bearer ${currentToken}`);
			return databricksFetch(input, {
				...init,
				headers
			});
		}
	});
	if (useCache) {
		oauthProviderCache = provider;
		oauthProviderCacheTime = Date.now();
	}
	return provider;
}
const endpointDetailsCache = /* @__PURE__ */ new Map();
const ENDPOINT_DETAILS_CACHE_DURATION = 300 * 1e3;
const getEndpointDetails = async (servingEndpoint, _session) => {
	const cached = endpointDetailsCache.get(servingEndpoint);
	if (cached && Date.now() - cached.timestamp < ENDPOINT_DETAILS_CACHE_DURATION) return cached;
	const currentToken = await getProviderToken(null);
	const hostname = await getWorkspaceHostname();
	const headers = new Headers();
	headers.set("Authorization", `Bearer ${currentToken}`);
	const response = await databricksFetch(`${hostname}/api/2.0/serving-endpoints/${servingEndpoint}`, {
		method: "GET",
		headers
	});
	if (!response.ok) {
		const errorText = await response.text();
		console.warn(`[getEndpointDetails] Failed to get endpoint details: ${response.status} ${errorText}`);
		return {
			task: void 0,
			timestamp: Date.now()
		};
	}
	const returnValue = {
		task: (await response.json()).task,
		timestamp: Date.now()
	};
	endpointDetailsCache.set(servingEndpoint, returnValue);
	return returnValue;
};
var OAuthAwareProvider = class {
	modelCache = /* @__PURE__ */ new Map();
	CACHE_DURATION = 300 * 1e3;
	async languageModel(id, session) {
		const useCache = !session?.accessToken;
		if (useCache) {
			const cached = this.modelCache.get(id);
			if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
				console.log(`Using cached model for ${id}`);
				return cached.model;
			}
		}
		const provider = await getOrCreateDatabricksProvider(session);
		const wrappedModel = wrapLanguageModel({
			model: await (async () => {
				if (API_PROXY) return provider.responsesAgent(id);
				if (id === "title-model" || id === "artifact-model") {
					if (session?.accessToken) {
						console.log(`[${id}] Foundation Model API call - using service principal instead of OBO`);
						return (await getOrCreateDatabricksProvider(null)).fmapi("databricks-meta-llama-3-3-70b-instruct");
					}
					return provider.fmapi("databricks-meta-llama-3-3-70b-instruct");
				}
				if (!process.env.DATABRICKS_SERVING_ENDPOINT) throw new Error("Please set the DATABRICKS_SERVING_ENDPOINT environment variable to the name of an agent serving endpoint");
				const servingEndpoint = process.env.DATABRICKS_SERVING_ENDPOINT;
				const endpointDetails = await getEndpointDetails(servingEndpoint, session);
				console.log(`Creating fresh model for ${id}` + (session?.accessToken ? " (OBO)" : ""));
				switch (endpointDetails.task) {
					case "agent/v2/chat": return provider.chatAgent(servingEndpoint);
					case "agent/v1/responses":
					case "agent/v2/responses": return provider.responsesAgent(servingEndpoint);
					case "llm/v1/chat": return provider.fmapi(servingEndpoint);
					default: return provider.responsesAgent(servingEndpoint);
				}
			})(),
			middleware: [extractReasoningMiddleware({ tagName: "think" })]
		});
		if (useCache) this.modelCache.set(id, {
			model: wrappedModel,
			timestamp: Date.now()
		});
		return wrappedModel;
	}
};
const providerInstance = new OAuthAwareProvider();
function getDatabricksServerProvider() {
	return providerInstance;
}

//#endregion
export { DATABRICKS_TOOL_CALL_ID, DATABRICKS_TOOL_DEFINITION, OAuthAwareProvider, createDatabricksProvider, databricksFetch, getDatabricksServerProvider };