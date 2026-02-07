export type CalendarViewMode = 'monthly' | 'weekly';

export interface CalendarNavigationState {
  viewMode: CalendarViewMode;
  currentDate: Date;
}
