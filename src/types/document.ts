import type { Context } from './context';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid';
}

export interface AppDocument {
  contexts: Record<string, Context>;
  settings: UserSettings;
}
