/**
 * Get all days to display in a monthly calendar grid.
 * Returns 42 days (6 weeks) including padding days from prev/next months.
 */
export function getMonthCalendarDays(year: number, month: number): Date[] {
  const days: Date[] = [];

  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Day of week for first day (0 = Sunday, 6 = Saturday)
  const startDayOfWeek = firstDay.getDay();

  // Start from the Sunday of the week containing the first day
  const startDate = new Date(year, month, 1 - startDayOfWeek);

  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }

  return days;
}

/**
 * Get all days in a week containing the given date.
 * Week starts on Sunday.
 */
export function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const startOfWeek = getStartOfWeek(date);

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * Format date to ISO string (YYYY-MM-DD) for Map keys.
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date is today.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if date is in the given month.
 */
export function isInMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

/**
 * Get start of week (Sunday) for a given date.
 */
export function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of week (Saturday) for a given date.
 */
export function getEndOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day));
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Format month/year for display (e.g., "February 2026").
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format week range for display (e.g., "Feb 2 - Feb 8, 2026").
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Navigate to previous month.
 */
export function getPreviousMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - 1);
  return result;
}

/**
 * Navigate to next month.
 */
export function getNextMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  return result;
}

/**
 * Navigate to previous week.
 */
export function getPreviousWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 7);
  return result;
}

/**
 * Navigate to next week.
 */
export function getNextWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 7);
  return result;
}
