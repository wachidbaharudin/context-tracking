import { useState } from 'react';
import { TimesheetRow } from './TimesheetRow';
import { TimesheetTimer } from './TimesheetTimer';
import { TimesheetSummary } from './TimesheetSummary';
import { GenerateInvoiceModal } from '@/components/features/invoice';
import { Button } from '@/components/ui';
import type { TimesheetEntry, AppDocument } from '@/types';

interface TimesheetListProps {
  contextId: string;
  contextName: string;
  entries: TimesheetEntry[];
  activeTimerStart: string | null;
  activeTimerDescription?: string | null;
  onStart: (description?: string) => void;
  onStop: () => void;
  onUpdate: (entryId: string, updates: Partial<Omit<TimesheetEntry, 'id' | 'createdAt'>>) => void;
  onDelete: (entryId: string) => void;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

export function TimesheetList({
  contextId,
  contextName,
  entries,
  activeTimerStart,
  activeTimerDescription,
  onStart,
  onStop,
  onUpdate,
  onDelete,
  doc,
  changeDoc,
}: TimesheetListProps) {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Sort entries by startTime descending (most recent first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="w-full space-y-4 px-2 py-3 md:space-y-4 md:px-0 md:py-0">
      {/* Section header - Level 2 hierarchy */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Timesheet</h3>
          {/* Counter - Level 6, subtle metadata */}
          <span className="text-[11px] text-gray-400">
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>
        {entries.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="text-sm"
          >
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Summary at the top */}
      <TimesheetSummary entries={entries} />

      <TimesheetTimer
        activeTimerStart={activeTimerStart}
        activeTimerDescription={activeTimerDescription}
        onStart={onStart}
        onStop={onStop}
      />

      <div className="space-y-2 md:space-y-3">
        {sortedEntries.map((entry) => (
          <TimesheetRow
            key={entry.id}
            entry={entry}
            onDelete={() => onDelete(entry.id)}
            onUpdate={(updates) => onUpdate(entry.id, updates)}
          />
        ))}
      </div>

      <GenerateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        contextId={contextId}
        contextName={contextName}
        doc={doc}
        changeDoc={changeDoc}
      />
    </div>
  );
}
