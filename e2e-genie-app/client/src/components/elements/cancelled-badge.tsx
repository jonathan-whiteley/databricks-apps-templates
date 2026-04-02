import { AlertTriangleIcon } from 'lucide-react';

export function CancelledBadge() {
  return (
    <div className='mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'>
      <AlertTriangleIcon className="size-3" />
      <span>Response cancelled</span>
    </div>
  );
}
