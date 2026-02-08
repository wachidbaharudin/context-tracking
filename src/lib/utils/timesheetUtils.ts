import type { TimesheetEntry } from '@/types';

/**
 * Calculate duration between start and end time in hours (decimal)
 * @param startTime - ISO datetime string
 * @param endTime - ISO datetime string
 * @returns Duration in hours as decimal (e.g., 4.5 for 4h 30m)
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
}

/**
 * Get total hours from all timesheet entries
 * @param entries - Array of timesheet entries
 * @returns Total hours as decimal
 */
export function getTotalHours(entries: TimesheetEntry[]): number {
  return entries.reduce((total, entry) => {
    return total + calculateDuration(entry.startTime, entry.endTime);
  }, 0);
}

/**
 * Get start of ISO week (Monday) for a given date
 */
function getStartOfISOWeek(date: Date): Date {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Adjust when day is Sunday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get end of ISO week (Sunday) for a given date
 */
function getEndOfISOWeek(date: Date): Date {
  const monday = getStartOfISOWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Get total hours from current ISO week (Monday to Sunday)
 * @param entries - Array of timesheet entries
 * @returns Total hours for current week as decimal
 */
export function getWeeklyHours(entries: TimesheetEntry[]): number {
  const now = new Date();
  const weekStart = getStartOfISOWeek(now);
  const weekEnd = getEndOfISOWeek(now);

  const weeklyEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });

  return getTotalHours(weeklyEntries);
}

/**
 * Get total hours from current month
 * @param entries - Array of timesheet entries
 * @returns Total hours for current month as decimal
 */
export function getMonthlyHours(entries: TimesheetEntry[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthlyEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= monthStart && entryDate <= monthEnd;
  });

  return getTotalHours(monthlyEntries);
}

/**
 * Format duration in hours to readable string
 * @param hours - Duration in hours as decimal
 * @returns Formatted string (e.g., "4.5h")
 */
export function formatDuration(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format date to "Feb 7, 2026" format
 */
function formatDate(date: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Format time to "10:00 AM" format
 */
function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Format time range to readable string
 * @param startTime - ISO datetime string
 * @param endTime - ISO datetime string
 * @returns Formatted time range (e.g., "Feb 7, 2026 10:00 AM - 2:30 PM" or "Feb 6, 2026 9:00 AM - Feb 7, 2026 1:00 AM")
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isSameDay(start, end)) {
    // Same day: "Feb 7, 2026 10:00 AM - 2:30 PM"
    return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
  } else {
    // Different days: "Feb 6, 2026 9:00 AM - Feb 7, 2026 1:00 AM"
    return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
  }
}
