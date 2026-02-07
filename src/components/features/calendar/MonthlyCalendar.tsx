import { getMonthCalendarDays, toDateKey, isToday, isInMonth } from '@/lib/utils/calendarUtils';
import { CalendarDay } from './CalendarDay';
import type { ActionItemWithContext } from '@/hooks/useAllActionItems';

interface MonthlyCalendarProps {
  currentDate: Date;
  scheduledItems: Map<string, ActionItemWithContext[]>;
  onSelectContext?: (contextId: string) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthlyCalendar({
  currentDate,
  scheduledItems,
  onSelectContext,
}: MonthlyCalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthCalendarDays(year, month);

  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
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
              isCurrentMonth={isInMonth(date, year, month)}
              variant="monthly"
              onSelectContext={onSelectContext}
            />
          );
        })}
      </div>
    </div>
  );
}
