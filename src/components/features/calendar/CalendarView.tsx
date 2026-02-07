import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  formatMonthYear,
  formatWeekRange,
  getStartOfWeek,
  getEndOfWeek,
  getPreviousMonth,
  getNextMonth,
  getPreviousWeek,
  getNextWeek,
} from '@/lib/utils/calendarUtils';
import { useAllActionItems } from '@/hooks';
import { MonthlyCalendar } from './MonthlyCalendar';
import { WeeklyCalendar } from './WeeklyCalendar';
import { UnscheduledItems } from './UnscheduledItems';
import type { CalendarViewMode } from './types';
import type { AppDocument } from '@/types/document';

interface CalendarViewProps {
  doc: AppDocument | null | undefined;
  onSelectContext?: (contextId: string) => void;
  onBack?: () => void;
}

export function CalendarView({ doc, onSelectContext, onBack }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const { scheduledItems, unscheduledItems } = useAllActionItems({ doc });

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(getPreviousMonth(currentDate));
    } else {
      setCurrentDate(getPreviousWeek(currentDate));
    }
  };

  const handleNext = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(getNextMonth(currentDate));
    } else {
      setCurrentDate(getNextWeek(currentDate));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format header text based on view mode
  const headerText =
    viewMode === 'monthly'
      ? formatMonthYear(currentDate)
      : formatWeekRange(getStartOfWeek(currentDate), getEndOfWeek(currentDate));

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
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
              onClick={handlePrevious}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              aria-label="Previous"
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
              onClick={handleNext}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              aria-label="Next"
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

          {/* Right: View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                viewMode === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                viewMode === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'monthly' ? (
          <MonthlyCalendar
            currentDate={currentDate}
            scheduledItems={scheduledItems}
            onSelectContext={onSelectContext}
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
