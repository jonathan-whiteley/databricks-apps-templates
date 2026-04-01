import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface CollapsibleTableProps {
  children: ReactNode;
  previewRows?: number;
  collapseThreshold?: number;
  maxExpandedHeight?: number;
}

export function CollapsibleTable({
  children,
  previewRows = 5,
  collapseThreshold = 10,
  maxExpandedHeight = 400,
}: CollapsibleTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tableInfo, setTableInfo] = useState<{
    rowCount: number;
    hasTable: boolean;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const table = containerRef.current.querySelector('table');
    if (!table) {
      setTableInfo({ rowCount: 0, hasTable: false });
      return;
    }

    const tbody = table.querySelector('tbody');
    const rows = tbody
      ? tbody.querySelectorAll('tr')
      : table.querySelectorAll('tr');
    setTableInfo({ rowCount: rows.length, hasTable: true });
  }, [children]);

  const shouldCollapse =
    tableInfo?.hasTable && tableInfo.rowCount > collapseThreshold;

  useEffect(() => {
    if (!containerRef.current || !shouldCollapse) return;

    const table = containerRef.current.querySelector('table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = tbody
      ? tbody.querySelectorAll('tr')
      : table.querySelectorAll('tr');

    rows.forEach((row, index) => {
      if (isExpanded) {
        (row as HTMLElement).style.display = '';
      } else {
        (row as HTMLElement).style.display =
          index < previewRows ? '' : 'none';
      }
    });
  }, [isExpanded, shouldCollapse, previewRows]);

  if (!shouldCollapse) {
    return <div ref={containerRef}>{children}</div>;
  }

  return (
    <div>
      <div
        ref={containerRef}
        className={
          isExpanded
            ? 'overflow-y-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-muted'
            : 'relative'
        }
        style={isExpanded ? { maxHeight: maxExpandedHeight } : undefined}
      >
        {children}
        {!isExpanded && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/50 to-transparent" />
        )}
      </div>
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="size-3" />
              Collapse to {previewRows} rows
            </>
          ) : (
            <>
              <ChevronDownIcon className="size-3" />
              Show all {tableInfo?.rowCount} rows
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
