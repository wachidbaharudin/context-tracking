import type { AppDocument, Context } from '@/types';

/**
 * Creates a mock AppDocument with optional initial contexts
 */
export function createMockDocument(contexts: Record<string, Context> = {}): AppDocument {
  return {
    contexts,
    settings: {
      theme: 'light',
      defaultView: 'list',
      autoLockMinutes: 15,
    },
  };
}

/**
 * Creates a mock context with default values
 */
export function createMockContext(overrides: Partial<Context> = {}): Context {
  const now = new Date().toISOString();
  return {
    id: 'test-context-id',
    name: 'Test Context',
    status: 'ongoing',
    actionItems: [],
    links: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a mock changeDoc function that executes the callback on the provided document
 * and tracks calls for assertions
 */
export function createMockChangeDoc(doc: AppDocument) {
  const calls: Array<(doc: AppDocument) => void> = [];

  const changeDoc = (changeFn: (doc: AppDocument) => void) => {
    calls.push(changeFn);
    changeFn(doc);
  };

  return {
    changeDoc,
    calls,
  };
}

/**
 * Creates a stalled date (more than 7 days ago)
 */
export function createStalledDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 10);
  return date.toISOString();
}

/**
 * Creates a recent date (less than 7 days ago)
 */
export function createRecentDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString();
}
