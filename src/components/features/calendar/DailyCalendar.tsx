import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toDateKey, isToday } from '@/lib/utils/calendarUtils';
import { getContextColor } from '@/lib/utils/getContextColor';
import { ActionItemPopover } from './ActionItemPopover';
import type { ActionItemWithContext } from '@/hooks';

interface DailyCalendarProps {
  currentDate: Date;
  scheduledItems: Map<string, ActionItemWithContext[]>;
  onSelectContext?: (contextId: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

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

export function DailyCalendar({
  currentDate,
  scheduledItems,
  onSelectContext,
  onPreviousDay,
  onNextDay,
}: DailyCalendarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [selectedItems, setSelectedItems] = useState<ActionItemWithContext[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const dateKey = toDateKey(currentDate);
  const items = scheduledItems.get(dateKey) ?? [];
  const isTodayDate = isToday(currentDate);

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

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      const threshold = 50; // minimum swipe distance

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          // Swiped left - go to next day
          onNextDay();
        } else {
          // Swiped right - go to previous day
          onPreviousDay();
        }
      }

      touchStartX.current = null;
    },
    [onNextDay, onPreviousDay]
  );

  // Format the date for display
  const dayName = WEEKDAY_LABELS[currentDate.getDay()];
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div
        ref={containerRef}
        className="flex flex-col h-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Day header with navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={onPreviousDay}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Previous day"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="text-center flex-1">
            <div
              className={cn(
                'text-lg font-semibold',
                isTodayDate ? 'text-blue-600' : 'text-gray-900'
              )}
            >
              {dayName}
            </div>
            <div className="text-sm text-gray-500">{formattedDate}</div>
            {isTodayDate && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                Today
              </span>
            )}
          </div>

          <button
            onClick={onNextDay}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Next day"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Swipe hint */}
        <div className="text-center text-xs text-gray-400 py-2 bg-gray-50">
          Swipe left or right to change day
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium">No items scheduled</p>
              <p className="text-xs mt-1">Nothing planned for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((itemWithContext) => {
                const { item, context } = itemWithContext;
                const contextColor = getContextColor(context);
                const isCompleted = item.status === 'completed';

                return (
                  <div
                    key={item.id}
                    onClick={(e) => handleCardClick(itemWithContext, e)}
                    className={cn(
                      'rounded-lg bg-white border border-gray-200 shadow-sm',
                      'active:bg-gray-50 transition-all',
                      'cursor-pointer overflow-hidden min-h-[44px]',
                      isCompleted && 'opacity-60'
                    )}
                    style={{ borderLeftColor: contextColor, borderLeftWidth: '4px' }}
                  >
                    <div className="p-3">
                      {/* Top row: Status icon, title, priority */}
                      <div className="flex items-start gap-3">
                        {/* Status icon */}
                        <span
                          className={cn(
                            'text-base flex-shrink-0 mt-0.5',
                            item.status === 'completed' && 'text-green-600',
                            item.status === 'ongoing' && 'text-blue-600',
                            item.status === 'pending' && 'text-gray-400'
                          )}
                        >
                          {statusIcons[item.status]}
                        </span>

                        {/* Title and description */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-medium text-gray-900',
                              isCompleted && 'line-through text-gray-500'
                            )}
                          >
                            {item.title}
                          </p>

                          {/* Context indicator */}
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: contextColor }}
                            />
                            <span className="text-xs text-gray-500">{context.name}</span>
                          </div>
                        </div>

                        {/* Priority badge */}
                        {item.priority && (
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-1 rounded flex-shrink-0',
                              priorityColors[item.priority]
                            )}
                          >
                            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
