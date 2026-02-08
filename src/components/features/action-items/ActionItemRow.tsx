import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { ActionItem } from '@/types';

interface ActionItemRowProps {
  item: ActionItem;
  onToggleStatus: () => void;
  onDelete: () => void;
  onAddChecklistItem: (text: string) => void;
  onToggleChecklistItem: (checklistItemId: string) => void;
  onDeleteChecklistItem: (checklistItemId: string) => void;
}

const statusIcons: Record<string, string> = {
  pending: '○',
  ongoing: '◐',
  completed: '●',
};

const priorityColors: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-gray-600 bg-gray-50',
};

export function ActionItemRow({
  item,
  onToggleStatus,
  onDelete,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
}: ActionItemRowProps) {
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    onAddChecklistItem(newChecklistText.trim());
    setNewChecklistText('');
  };

  const handleChecklistKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChecklistItem();
    }
    if (e.key === 'Escape') {
      setIsAddingChecklist(false);
      setNewChecklistText('');
    }
  };

  const checklist = item.checklist ?? [];

  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-gray-200 bg-white md:p-3 md:rounded-md',
        'active:bg-gray-50 md:hover:border-gray-300 transition-colors',
        item.status === 'completed' && 'opacity-60'
      )}
    >
      {/* Main action item header */}
      <div className="flex items-start gap-3">
        {/* Touch-friendly status toggle button */}
        <button
          onClick={onToggleStatus}
          className={cn(
            'text-xl flex-shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-lg',
            'active:bg-gray-100 md:hover:bg-gray-100 transition-colors',
            'md:text-lg md:w-6 md:h-6 md:min-w-0 md:min-h-0 md:rounded md:mt-0.5',
            item.status === 'completed' && 'text-green-600',
            item.status === 'ongoing' && 'text-blue-600',
            item.status === 'pending' && 'text-gray-400'
          )}
          aria-label={`Status: ${item.status}. Click to change.`}
        >
          {statusIcons[item.status]}
        </button>

        <div className="flex-1 min-w-0 py-2 md:py-0">
          <div className="flex flex-col gap-1 md:flex-row md:items-start md:gap-2">
            <p
              className={cn(
                'text-base font-medium text-gray-900 whitespace-pre-wrap md:text-sm',
                item.status === 'completed' && 'line-through text-gray-500'
              )}
            >
              {item.title}
            </p>
            {item.priority && (
              <span
                className={cn(
                  'self-start text-xs font-medium px-2 py-1 rounded md:py-0.5',
                  priorityColors[item.priority]
                )}
              >
                {item.priority}
              </span>
            )}
          </div>
          {(item.dueDate || item.notes) && (
            <div className="flex flex-col gap-1 mt-1 md:flex-row md:items-center md:gap-2 md:mt-0.5">
              {item.dueDate && (
                <span className="text-sm text-gray-500 md:text-xs">
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </span>
              )}
              {item.notes && (
                <span className="text-sm text-gray-400 md:text-xs md:truncate">{item.notes}</span>
              )}
            </div>
          )}
        </div>

        {/* Touch-friendly delete button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="flex-shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 text-gray-400 active:text-red-600 md:hover:text-red-600 md:w-auto md:h-auto md:min-w-0 md:min-h-0"
          aria-label="Delete action item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="md:w-4 md:h-4"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </Button>
      </div>

      {/* Checklist section */}
      <div className="ml-14 mt-3 md:ml-9 md:mt-2">
        {checklist.length > 0 && (
          <div className="space-y-2 md:space-y-1">
            {checklist.map((checklistItem) => (
              <div
                key={checklistItem.id}
                className="flex items-center gap-3 group py-1 md:gap-2 md:py-0.5"
              >
                {/* Touch-friendly checklist toggle */}
                <button
                  onClick={() => onToggleChecklistItem(checklistItem.id)}
                  className={cn(
                    'min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border-2 flex items-center justify-center flex-shrink-0',
                    'transition-colors active:scale-95',
                    'md:w-4 md:h-4 md:min-w-0 md:min-h-0 md:rounded md:border',
                    checklistItem.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 active:border-gray-400 md:hover:border-gray-400'
                  )}
                  aria-label={checklistItem.done ? 'Mark as not done' : 'Mark as done'}
                >
                  {checklistItem.done && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="md:w-[10px] md:h-[10px]"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span
                  className={cn(
                    'text-base flex-1 md:text-sm',
                    checklistItem.done && 'line-through text-gray-400'
                  )}
                >
                  {checklistItem.text}
                </span>
                {/* Touch-friendly delete checklist item button */}
                <button
                  onClick={() => onDeleteChecklistItem(checklistItem.id)}
                  className={cn(
                    'min-w-[44px] min-h-[44px] flex items-center justify-center',
                    'text-gray-400 active:text-red-500 transition-colors',
                    'md:min-w-0 md:min-h-0 md:opacity-0 md:group-hover:opacity-100 md:p-0.5 md:hover:text-red-500'
                  )}
                  aria-label="Delete checklist item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="md:w-3 md:h-3"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add checklist item */}
        {isAddingChecklist ? (
          <div className="flex flex-col gap-2 mt-2 md:flex-row md:items-center md:mt-1">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={handleChecklistKeyDown}
              onBlur={() => {
                if (!newChecklistText.trim()) {
                  setIsAddingChecklist(false);
                }
              }}
              placeholder="Add checklist item..."
              autoFocus
              className="flex-1 text-base min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 md:text-sm md:min-h-0 md:px-2 md:py-1 md:rounded md:focus:ring-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddChecklistItem}
              disabled={!newChecklistText.trim()}
              className="min-h-[44px] text-base px-4 py-2 md:min-h-0 md:text-xs md:px-2 md:py-1 md:h-auto"
            >
              Add
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingChecklist(true)}
            className="min-h-[44px] text-sm text-gray-400 active:text-gray-600 mt-2 flex items-center gap-2 md:min-h-0 md:text-xs md:gap-1 md:mt-1 md:hover:text-gray-600"
          >
            <span className="text-lg md:text-base">+</span>
            <span>Add checklist item</span>
          </button>
        )}
      </div>
    </div>
  );
}
