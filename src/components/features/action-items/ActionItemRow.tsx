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
        'p-3 rounded-md border border-gray-200 bg-white',
        'hover:border-gray-300 transition-colors',
        item.status === 'completed' && 'opacity-60'
      )}
    >
      {/* Main action item header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleStatus}
          className={cn(
            'text-lg flex-shrink-0 w-6 h-6 flex items-center justify-center rounded mt-0.5',
            'hover:bg-gray-100 transition-colors',
            item.status === 'completed' && 'text-green-600',
            item.status === 'ongoing' && 'text-blue-600',
            item.status === 'pending' && 'text-gray-400'
          )}
          aria-label={`Status: ${item.status}. Click to change.`}
        >
          {statusIcons[item.status]}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium text-gray-900 whitespace-pre-wrap',
              item.status === 'completed' && 'line-through text-gray-500'
            )}
          >
            {item.title}
          </p>
          {(item.dueDate || item.notes) && (
            <div className="flex items-center gap-2 mt-0.5">
              {item.dueDate && (
                <span className="text-xs text-gray-500">
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </span>
              )}
              {item.notes && <span className="text-xs text-gray-400 truncate">{item.notes}</span>}
            </div>
          )}
        </div>

        {item.priority && (
          <span
            className={cn('text-xs font-medium px-2 py-0.5 rounded', priorityColors[item.priority])}
          >
            {item.priority}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="flex-shrink-0 text-gray-400 hover:text-red-600"
          aria-label="Delete action item"
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

      {/* Checklist section */}
      <div className="ml-9 mt-2">
        {checklist.length > 0 && (
          <div className="space-y-1">
            {checklist.map((checklistItem) => (
              <div key={checklistItem.id} className="flex items-center gap-2 group py-0.5">
                <button
                  onClick={() => onToggleChecklistItem(checklistItem.id)}
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                    'transition-colors',
                    checklistItem.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  aria-label={checklistItem.done ? 'Mark as not done' : 'Mark as done'}
                >
                  {checklistItem.done && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span
                  className={cn(
                    'text-sm flex-1',
                    checklistItem.done && 'line-through text-gray-400'
                  )}
                >
                  {checklistItem.text}
                </span>
                <button
                  onClick={() => onDeleteChecklistItem(checklistItem.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5"
                  aria-label="Delete checklist item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
          <div className="flex items-center gap-2 mt-1">
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
              className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddChecklistItem}
              disabled={!newChecklistText.trim()}
              className="text-xs px-2 py-1 h-auto"
            >
              Add
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingChecklist(true)}
            className="text-xs text-gray-400 hover:text-gray-600 mt-1 flex items-center gap-1"
          >
            <span>+</span>
            <span>Add checklist item</span>
          </button>
        )}
      </div>
    </div>
  );
}
