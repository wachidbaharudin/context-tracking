import type { Context } from './context';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid';
  /** Auto-lock timeout in minutes. 0 = disabled. Default: 15 */
  autoLockMinutes: number;
}

export interface AppDocument {
  contexts: Record<string, Context>;
  settings: UserSettings;
}
