import type { TimesheetEntry } from '@/types';
import {
  formatDuration,
  getTotalHours,
  getWeeklyHours,
  getMonthlyHours,
} from '@/lib/utils/timesheetUtils';

interface TimesheetSummaryProps {
  entries: TimesheetEntry[];
}

export function TimesheetSummary({ entries }: TimesheetSummaryProps) {
  const totalHours = getTotalHours(entries);
  const weeklyHours = getWeeklyHours(entries);
  const monthlyHours = getMonthlyHours(entries);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex flex-wrap gap-6 sm:gap-8">
        {/* Total Hours */}
        <div className="flex-1 min-w-[100px]">
          <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Total</div>
          <div className="text-lg font-semibold text-gray-900">{formatDuration(totalHours)}</div>
        </div>

        {/* This Week */}
        <div className="flex-1 min-w-[100px]">
          <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">This Week</div>
          <div className="text-lg font-semibold text-gray-900">{formatDuration(weeklyHours)}</div>
        </div>

        {/* This Month */}
        <div className="flex-1 min-w-[100px]">
          <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">This Month</div>
          <div className="text-lg font-semibold text-gray-900">{formatDuration(monthlyHours)}</div>
        </div>
      </div>
    </div>
  );
}
