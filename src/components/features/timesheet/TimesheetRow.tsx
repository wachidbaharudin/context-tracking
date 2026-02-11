import { useState } from 'react';
import { Button } from '@/components/ui/Button';
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setDescriptionValue(entry.description || '');
      setIsEditingDescription(false);
    }
  };

  const handleSave = () => {
    const trimmedDescription = descriptionValue.trim();
    onUpdate({ description: trimmedDescription || undefined });
    setIsEditingDescription(false);
  };

  const handleCancel = () => {
    setDescriptionValue(entry.description || '');
    setIsEditingDescription(false);
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 p-4 rounded-lg border border-gray-200 bg-white transition-all group',
        'min-h-[44px]',
        'hover:border-gray-300 hover:shadow-sm'
      )}
    >
      {/* First line: time range, duration badge, and delete button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900">
            {formatTimeRange(entry.startTime, entry.endTime)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Duration badge */}
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md">
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
          <textarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What did you work on? (Shift+Enter for new line)"
            autoFocus
            rows={3}
            className={cn(
              'flex flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3',
              'text-base placeholder:text-gray-400 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'md:rounded-md md:px-3 md:py-2 md:text-sm'
            )}
          />
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      ) : entry.description ? (
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm text-gray-600 leading-relaxed">{entry.description}</p>
          <button
            onClick={() => setIsEditingDescription(true)}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Edit
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditingDescription(true)}
          className="text-xs text-gray-400 hover:text-blue-600 text-left"
        >
          + Add description
        </button>
      )}
    </div>
  );
}
