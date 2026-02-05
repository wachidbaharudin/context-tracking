export const CONTEXT_STATUS = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
} as const;

export const ACTION_ITEM_STATUS = {
  PENDING: 'pending',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
} as const;

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const STALLED_DAYS_THRESHOLD = 7;
