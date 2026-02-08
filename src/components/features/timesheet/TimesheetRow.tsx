import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { calculateDuration, formatDuration, formatTimeRange } from '@/lib/utils/timesheetUtils';
import type { TimesheetEntry } from '@/types';

interface TimesheetRowProps {
  entry: TimesheetEntry;
  onDelete: () => void;
  onUpdate: (updates: Partial<Omit<TimesheetEntry, 'id' | 'createdAt'>>) => void;
}

export function TimesheetRow({ entry, onDelete, onUpdate }: TimesheetRowProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(entry.description || '');
  const duration = calculateDuration(entry.startTime, entry.endTime);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3 rounded-md border border-gray-100 bg-white transition-colors group',
        'min-h-[44px]',
        'hover:border-gray-200'
      )}
    >
      {/* First line: time range, duration badge, and delete button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-700">
            {formatTimeRange(entry.startTime, entry.endTime)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Duration badge */}
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            {formatDuration(duration)}
          </span>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className={cn(
              'text-gray-300 hover:text-red-500',
              'min-w-[44px] min-h-[44px]',
              'md:min-w-0 md:min-h-0 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity'
            )}
            aria-label="Delete timesheet entry"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Second line: description (editable) */}
      {isEditingDescription ? (
        <div className="flex gap-2">
          <Input
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            placeholder="What did you work on?"
            autoFocus
            className="flex-1 text-[11px]"
          />
          <Button
            size="sm"
            onClick={() => {
              onUpdate({ description: descriptionValue.trim() || undefined });
              setIsEditingDescription(false);
            }}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDescriptionValue(entry.description || '');
              setIsEditingDescription(false);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : entry.description ? (
        <div className="flex items-start gap-2">
          <p className="flex-1 text-[11px] text-gray-500">{entry.description}</p>
          <button
            onClick={() => setIsEditingDescription(true)}
            className="text-[11px] text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Edit
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditingDescription(true)}
          className="text-[11px] text-gray-400 hover:text-gray-600 text-left"
        >
          + Add description
        </button>
      )}
    </div>
  );
}
