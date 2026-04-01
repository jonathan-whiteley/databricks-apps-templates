import { ShieldAlertIcon } from 'lucide-react';

interface MessageOAuthErrorProps {
  error: string;
}

export function MessageOAuthError({ error }: MessageOAuthErrorProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <ShieldAlertIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-col gap-2">
        <h4 className="font-medium text-amber-800 text-sm dark:text-amber-200">
          Authentication Required
        </h4>
        <p className="text-amber-700 text-xs dark:text-amber-300">
          This application needs permission to query data on your behalf. Please
          grant access through your Databricks workspace to continue.
        </p>
        <details className="mt-1">
          <summary className="cursor-pointer text-amber-600 text-xs dark:text-amber-400">
            Error details
          </summary>
          <pre className="mt-1 max-h-24 overflow-auto rounded bg-amber-100 p-2 font-mono text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {error}
          </pre>
        </details>
      </div>
    </div>
  );
}
