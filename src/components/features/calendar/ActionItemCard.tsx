import { cn } from '@/lib/utils';
import { getContextColor } from '@/lib/utils/getContextColor';
import type { ActionItemWithContext } from '@/hooks/useAllActionItems';

interface ActionItemCardProps {
  itemWithContext: ActionItemWithContext;
  onClick?: (event: React.MouseEvent) => void;
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

export function ActionItemCard({ itemWithContext, onClick }: ActionItemCardProps) {
  const { item, context } = itemWithContext;
  const contextColor = getContextColor(context);
  const isCompleted = item.status === 'completed';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-md bg-white border border-gray-200 shadow-sm',
        'hover:shadow-md hover:border-gray-300 transition-all',
        'cursor-pointer overflow-hidden',
        isCompleted && 'opacity-60'
      )}
      style={{ borderLeftColor: contextColor, borderLeftWidth: '3px' }}
    >
      <div className="p-1.5">
        {/* Top row: Status icon, title, priority */}
        <div className="flex items-start gap-1.5">
          {/* Status icon */}
          <span
            className={cn(
              'text-xs flex-shrink-0 mt-0.5',
              item.status === 'completed' && 'text-green-600',
              item.status === 'ongoing' && 'text-blue-600',
              item.status === 'pending' && 'text-gray-400'
            )}
          >
            {statusIcons[item.status]}
          </span>

          {/* Title */}
          <p
            className={cn(
              'text-xs font-medium text-gray-900 flex-1 min-w-0 truncate',
              isCompleted && 'line-through text-gray-500'
            )}
            title={item.title}
          >
            {item.title}
          </p>

          {/* Priority badge */}
          {item.priority && (
            <span
              className={cn(
                'text-[10px] font-medium px-1 py-0.5 rounded flex-shrink-0 leading-none',
                priorityColors[item.priority]
              )}
            >
              {item.priority.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Bottom row: Context name */}
        <div className="flex items-center gap-1 mt-0.5 ml-4">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: contextColor }}
          />
          <span className="text-[10px] text-gray-500 truncate">{context.name}</span>
        </div>
      </div>
    </div>
  );
}
