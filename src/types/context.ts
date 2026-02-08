export type ContextStatus = 'ongoing' | 'completed';
export type ActionItemStatus = 'pending' | 'ongoing' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  status: ActionItemStatus;
  priority?: Priority;
  dueDate?: string;
  notes?: string;
  checklist?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  addedAt: string;
}

export interface TimesheetEntry {
  id: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSettings {
  clientName?: string;
  clientEmail?: string;
  hourlyRate?: number;
  currency?: string; // Default 'USD'
  yourName?: string;
  yourEmail?: string;
}

export interface Context {
  id: string;
  name: string;
  description?: string;
  status: ContextStatus;
  color?: string;
  actionItems: ActionItem[];
  links: Link[];
  timesheetEnabled?: boolean;
  timesheetEntries?: TimesheetEntry[];
  activeTimerStart?: string; // ISO datetime when timer was started, undefined when no timer running
  activeTimerDescription?: string; // Description for active timer
  invoiceSettings?: InvoiceSettings;
  createdAt: string;
  updatedAt: string;
}
