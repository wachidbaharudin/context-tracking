import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ActionItemCard } from './ActionItemCard';
import { ActionItemPopover } from './ActionItemPopover';
import type { ActionItemWithContext } from '@/hooks/useAllActionItems';

interface CalendarDayProps {
  date: Date;
  items: ActionItemWithContext[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onSelectContext?: (contextId: string) => void;
}

export function CalendarDay({
  date,
  items,
  isToday,
  isCurrentMonth,
  onSelectContext,
}: CalendarDayProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [selectedItems, setSelectedItems] = useState<ActionItemWithContext[]>([]);
  const cellRef = useRef<HTMLDivElement>(null);

  const handleCardClick = useCallback(
    (itemWithContext: ActionItemWithContext, event: React.MouseEvent) => {
      event.stopPropagation();
      const target = event.currentTarget as HTMLElement;
      setAnchorRect(target.getBoundingClientRect());
      setSelectedItems([itemWithContext]);
      setIsPopoverOpen(true);
    },
    []
  );

  const handleClose = useCallback(() => {
    setIsPopoverOpen(false);
    setSelectedItems([]);
  }, []);

  return (
    <>
      <div
        ref={cellRef}
        className={cn(
          'relative border-b border-r border-gray-200 flex flex-col',
          'transition-colors min-h-0 h-full',
          isCurrentMonth ? 'bg-white' : 'bg-gray-50',
          !isCurrentMonth && 'text-gray-400'
        )}
      >
        {/* Date number */}
        <div className="flex-shrink-0 p-2 pb-1">
          <div
            className={cn(
              'text-sm font-medium inline-flex items-center justify-center',
              isToday && 'bg-blue-600 text-white w-6 h-6 rounded-full'
            )}
          >
            {date.getDate()}
          </div>
        </div>

        {/* Action item cards - scrollable container */}
        {items.length > 0 && (
          <div className="flex-1 overflow-y-auto px-1.5 pb-1.5 space-y-1 min-h-0">
            {items.map((itemWithContext) => (
              <ActionItemCard
                key={itemWithContext.item.id}
                itemWithContext={itemWithContext}
                onClick={(e: React.MouseEvent) => handleCardClick(itemWithContext, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Popover for showing action item details */}
      <ActionItemPopover
        items={selectedItems}
        isOpen={isPopoverOpen}
        onClose={handleClose}
        anchorRect={anchorRect}
        onSelectContext={onSelectContext}
      />
    </>
  );
}
