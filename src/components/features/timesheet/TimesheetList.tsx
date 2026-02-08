import { TimesheetRow } from './TimesheetRow';
import { TimesheetTimer } from './TimesheetTimer';
import { TimesheetSummary } from './TimesheetSummary';
import type { TimesheetEntry } from '@/types';

interface TimesheetListProps {
  entries: TimesheetEntry[];
  activeTimerStart: string | null;
  onStart: () => void;
  onStop: () => void;
  onUpdate: (entryId: string, updates: Partial<Omit<TimesheetEntry, 'id' | 'createdAt'>>) => void;
  onDelete: (entryId: string) => void;
}

export function TimesheetList({
  entries,
  activeTimerStart,
  onStart,
  onStop,
  onUpdate,
  onDelete,
}: TimesheetListProps) {
  // Sort entries by startTime descending (most recent first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="w-full space-y-4 px-2 py-3 md:space-y-4 md:px-0 md:py-0">
      {/* Section header - Level 2 hierarchy */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-lg font-semibold text-gray-900">Timesheet</h3>
        {/* Counter - Level 6, subtle metadata */}
        <span className="text-[11px] text-gray-400">
          {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Summary at the top */}
      <TimesheetSummary entries={entries} />

      <TimesheetTimer activeTimerStart={activeTimerStart} onStart={onStart} onStop={onStop} />

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
    </div>
  );
}
