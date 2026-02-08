import { useState } from 'react';
import {
  formatWeekRange,
  getStartOfWeek,
  getEndOfWeek,
  getPreviousWeek,
  getNextWeek,
  isToday,
} from '@/lib/utils/calendarUtils';
import { cn } from '@/lib/utils';
import { useAllActionItems, useBreakpoint } from '@/hooks';
import { WeeklyCalendar } from './WeeklyCalendar';
import { DailyCalendar } from './DailyCalendar';
import { UnscheduledItems } from './UnscheduledItems';
import type { AppDocument } from '@/types/document';

interface CalendarViewProps {
  doc: AppDocument | null | undefined;
  onSelectContext?: (contextId: string) => void;
  onBack?: () => void;
}

export function CalendarView({ doc, onSelectContext, onBack }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const { isMobile } = useBreakpoint();

  const { scheduledItems, unscheduledItems } = useAllActionItems({ doc });

  // Week navigation handlers
  const handlePreviousWeek = () => {
    setCurrentDate(getPreviousWeek(currentDate));
  };

  const handleNextWeek = () => {
    setCurrentDate(getNextWeek(currentDate));
  };

  // Day navigation handlers (for mobile)
  const handlePreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format header text for week view
  const headerText = formatWeekRange(getStartOfWeek(currentDate), getEndOfWeek(currentDate));

  const isTodayDate = isToday(currentDate);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Desktop only (mobile uses DailyCalendar's built-in header) */}
      {!isMobile && (
        <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Back to contexts"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-900">Calendar</h1>
            </div>

            {/* Center: Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousWeek}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                aria-label="Previous week"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Today
              </button>

              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                aria-label="Next week"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <span className="ml-2 text-sm font-medium text-gray-900 min-w-48 text-center">
                {headerText}
              </span>
            </div>

            {/* Right: Empty space for balance */}
            <div className="w-24" />
          </div>
        </div>
      )}

      {/* Mobile header - simplified */}
      {isMobile && (
        <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back button */}
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 -ml-2 text-gray-500 active:text-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Back to contexts"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <h1 className="text-base font-semibold text-gray-900">Calendar</h1>
            </div>

            {/* Right: Today button */}
            <button
              onClick={handleToday}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px]',
                isTodayDate ? 'text-blue-600 bg-blue-50' : 'text-gray-700 active:bg-gray-100'
              )}
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          <DailyCalendar
            currentDate={currentDate}
            scheduledItems={scheduledItems}
            onSelectContext={onSelectContext}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
          />
        ) : (
          <WeeklyCalendar
            currentDate={currentDate}
            scheduledItems={scheduledItems}
            onSelectContext={onSelectContext}
          />
        )}
      </div>

      {/* Unscheduled items section */}
      <UnscheduledItems items={unscheduledItems} onSelectContext={onSelectContext} />
    </div>
  );
}
