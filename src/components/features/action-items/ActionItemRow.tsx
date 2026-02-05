import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { ActionItem } from '@/types';

interface ActionItemRowProps {
  item: ActionItem;
  onToggleStatus: () => void;
  onDelete: () => void;
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

export function ActionItemRow({ item, onToggleStatus, onDelete }: ActionItemRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-md border border-gray-200 bg-white',
        'hover:border-gray-300 transition-colors',
        item.status === 'completed' && 'opacity-60'
      )}
    >
      <button
        onClick={onToggleStatus}
        className={cn(
          'text-lg flex-shrink-0 w-6 h-6 flex items-center justify-center rounded',
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
            'text-sm font-medium text-gray-900',
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
  );
}
