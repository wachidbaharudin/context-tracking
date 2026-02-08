import { cn } from '@/lib/utils';
import { getContextColor } from '@/lib/utils/getContextColor';
import type { ActionItemWithContext } from '@/hooks/useAllActionItems';

interface ActionItemCardProps {
  itemWithContext: ActionItemWithContext;
  onClick?: (event: React.MouseEvent) => void;
  /** When true, uses smaller sizing for week view cells */
  compact?: boolean;
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

export function ActionItemCard({ itemWithContext, onClick, compact = true }: ActionItemCardProps) {
  const { item, context } = itemWithContext;
  const contextColor = getContextColor(context);
  const isCompleted = item.status === 'completed';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-md bg-white border border-gray-200 shadow-sm',
        'hover:shadow-md hover:border-gray-300 active:bg-gray-50 transition-all',
        'cursor-pointer overflow-hidden',
        isCompleted && 'opacity-60',
        // Touch-friendly sizing - minimum 44px on mobile when not compact
        !compact && 'min-h-[44px]'
      )}
      style={{ borderLeftColor: contextColor, borderLeftWidth: compact ? '3px' : '4px' }}
    >
      <div className={cn('p-1.5', !compact && 'p-2 md:p-3')}>
        {/* Top row: Status icon, title, priority */}
        <div className={cn('flex items-start', compact ? 'gap-1.5' : 'gap-2 md:gap-3')}>
          {/* Status icon */}
          <span
            className={cn(
              'flex-shrink-0 mt-0.5',
              compact ? 'text-xs' : 'text-sm md:text-base',
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
              'font-medium text-gray-900 flex-1 min-w-0',
              compact ? 'text-xs truncate' : 'text-sm md:text-base',
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
                'font-medium rounded flex-shrink-0 leading-none',
                compact ? 'text-[10px] px-1 py-0.5' : 'text-xs px-1.5 py-1',
                priorityColors[item.priority]
              )}
            >
              {compact
                ? item.priority.charAt(0).toUpperCase()
                : item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </span>
          )}
        </div>

        {/* Bottom row: Context name */}
        <div
          className={cn(
            'flex items-center mt-0.5',
            compact ? 'gap-1 ml-4' : 'gap-2 ml-5 md:ml-6 mt-1'
          )}
        >
          <span
            className={cn('rounded-full flex-shrink-0', compact ? 'w-1.5 h-1.5' : 'w-2 h-2')}
            style={{ backgroundColor: contextColor }}
          />
          <span
            className={cn('text-gray-500 truncate', compact ? 'text-[10px]' : 'text-xs md:text-sm')}
          >
            {context.name}
          </span>
        </div>
      </div>
    </div>
  );
}
