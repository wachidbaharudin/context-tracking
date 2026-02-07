import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getContextColor } from '@/lib/utils/getContextColor';
import type { ActionItemWithContext } from '@/hooks/useAllActionItems';

interface UnscheduledItemsProps {
  items: ActionItemWithContext[];
  onSelectContext?: (contextId: string) => void;
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

export function UnscheduledItems({ items, onSelectContext }: UnscheduledItemsProps) {
  // Default to collapsed if more than 5 items
  const [isExpanded, setIsExpanded] = useState(items.length <= 5);

  // Group items by context
  const groupedByContext = useMemo(() => {
    const groups = new Map<
      string,
      { context: ActionItemWithContext['context']; items: ActionItemWithContext[] }
    >();

    items.forEach((itemWithContext) => {
      const contextId = itemWithContext.context.id;
      if (!groups.has(contextId)) {
        groups.set(contextId, {
          context: itemWithContext.context,
          items: [],
        });
      }
      groups.get(contextId)!.items.push(itemWithContext);
    });

    return Array.from(groups.values());
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">Unscheduled ({items.length})</span>
        <svg
          className={cn('w-4 h-4 text-gray-500 transition-transform', isExpanded && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {groupedByContext.map(({ context, items: contextItems }) => {
            const contextColor = getContextColor(context);

            return (
              <div key={context.id}>
                {/* Context header */}
                <div
                  className={cn(
                    'flex items-center gap-2 mb-2',
                    onSelectContext && 'cursor-pointer hover:opacity-80'
                  )}
                  onClick={() => onSelectContext?.(context.id)}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: contextColor }}
                  />
                  <span className="text-sm font-medium text-gray-900">{context.name}</span>
                  <span className="text-xs text-gray-500">({contextItems.length})</span>
                </div>

                {/* Items list */}
                <div className="space-y-1 ml-5">
                  {contextItems.map((itemWithContext) => {
                    const { item } = itemWithContext;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-2 py-1',
                          onSelectContext && 'cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1'
                        )}
                        onClick={() => onSelectContext?.(context.id)}
                      >
                        {/* Status icon */}
                        <span
                          className={cn(
                            'text-sm flex-shrink-0',
                            item.status === 'completed' && 'text-green-600',
                            item.status === 'ongoing' && 'text-blue-600',
                            item.status === 'pending' && 'text-gray-400'
                          )}
                        >
                          {statusIcons[item.status]}
                        </span>

                        {/* Title */}
                        <span
                          className={cn(
                            'text-sm text-gray-700 flex-1 truncate',
                            item.status === 'completed' && 'line-through text-gray-500'
                          )}
                        >
                          {item.title}
                        </span>

                        {/* Priority badge */}
                        {item.priority && (
                          <span
                            className={cn(
                              'text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0',
                              priorityColors[item.priority]
                            )}
                          >
                            {item.priority}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
