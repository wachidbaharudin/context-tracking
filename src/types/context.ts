export type ContextStatus = 'ongoing' | 'completed';
export type ActionItemStatus = 'pending' | 'ongoing' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface ActionItem {
  id: string;
  title: string;
  status: ActionItemStatus;
  priority?: Priority;
  dueDate?: string;
  notes?: string;
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

export interface Context {
  id: string;
  name: string;
  description?: string;
  status: ContextStatus;
  color?: string;
  actionItems: ActionItem[];
  links: Link[];
  createdAt: string;
  updatedAt: string;
}
