import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getContextColor } from '@/lib/utils/getContextColor';
import { ActionItemPopover } from './ActionItemPopover';
import type { ActionItemWithContext } from '@/hooks/useAllActionItems';

interface CalendarDayProps {
  date: Date;
  items: ActionItemWithContext[];
  isToday: boolean;
  isCurrentMonth: boolean;
  variant: 'monthly' | 'weekly';
  onSelectContext?: (contextId: string) => void;
}

const MAX_VISIBLE_DOTS = 4;

export function CalendarDay({
  date,
  items,
  isToday,
  isCurrentMonth,
  variant,
  onSelectContext,
}: CalendarDayProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (items.length === 0) return;

    if (cellRef.current) {
      setAnchorRect(cellRef.current.getBoundingClientRect());
    }
    setIsPopoverOpen(true);
  }, [items.length]);

  const handleClose = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  const visibleItems = items.slice(0, MAX_VISIBLE_DOTS);
  const remainingCount = items.length - MAX_VISIBLE_DOTS;

  const isMonthly = variant === 'monthly';

  return (
    <>
      <div
        ref={cellRef}
        onClick={handleClick}
        className={cn(
          'relative border-b border-r border-gray-200',
          'transition-colors',
          isMonthly ? 'min-h-20 p-1' : 'min-h-32 p-2',
          isCurrentMonth ? 'bg-white' : 'bg-gray-50',
          items.length > 0 && 'cursor-pointer hover:bg-gray-50',
          !isCurrentMonth && 'text-gray-400'
        )}
      >
        {/* Date number */}
        <div
          className={cn(
            'text-sm font-medium',
            isMonthly ? 'mb-1' : 'mb-2',
            isToday &&
              'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
          )}
        >
          {date.getDate()}
        </div>

        {/* Action item dots */}
        {items.length > 0 && (
          <div className={cn('flex flex-wrap gap-1', isMonthly ? 'gap-0.5' : 'gap-1')}>
            {visibleItems.map((itemWithContext) => {
              const color = getContextColor(itemWithContext.context);
              const isCompleted = itemWithContext.item.status === 'completed';

              return (
                <div
                  key={itemWithContext.item.id}
                  className={cn(
                    'rounded-full flex-shrink-0',
                    isMonthly ? 'w-2 h-2' : 'w-2.5 h-2.5',
                    isCompleted && 'opacity-50'
                  )}
                  style={{ backgroundColor: color }}
                  title={itemWithContext.item.title}
                />
              );
            })}

            {/* +N more indicator */}
            {remainingCount > 0 && (
              <span className="text-xs text-gray-500 font-medium">+{remainingCount}</span>
            )}
          </div>
        )}
      </div>

      {/* Popover for showing action items */}
      <ActionItemPopover
        items={items}
        isOpen={isPopoverOpen}
        onClose={handleClose}
        anchorRect={anchorRect}
        onSelectContext={onSelectContext}
      />
    </>
  );
}
