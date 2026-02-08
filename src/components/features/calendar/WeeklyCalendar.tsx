import { getWeekDays, toDateKey, isToday } from '@/lib/utils/calendarUtils';
import { cn } from '@/lib/utils';
import { CalendarDay } from './CalendarDay';
import type { ActionItemWithContext } from '@/hooks/useAllActionItems';

interface WeeklyCalendarProps {
  currentDate: Date;
  scheduledItems: Map<string, ActionItemWithContext[]>;
  onSelectContext?: (contextId: string) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeeklyCalendar({
  currentDate,
  scheduledItems,
  onSelectContext,
}: WeeklyCalendarProps) {
  const days = getWeekDays(currentDate);

  return (
    <div className={cn('flex flex-col h-full', 'hidden md:flex')}>
      {/* Weekday headers with dates */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {days.map((date, index) => (
          <div
            key={toDateKey(date)}
            className="py-2 text-center border-r border-gray-200 last:border-r-0"
          >
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {WEEKDAY_LABELS[index]}
            </div>
            <div className="text-xs lg:text-sm font-medium text-gray-700 mt-0.5">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid - single row with taller cells */}
      <div className="grid grid-cols-7 flex-1 border-l border-t border-gray-200">
        {days.map((date) => {
          const dateKey = toDateKey(date);
          const items = scheduledItems.get(dateKey) ?? [];

          return (
            <CalendarDay
              key={dateKey}
              date={date}
              items={items}
              isToday={isToday(date)}
              isCurrentMonth={true}
              onSelectContext={onSelectContext}
            />
          );
        })}
      </div>
    </div>
  );
}
