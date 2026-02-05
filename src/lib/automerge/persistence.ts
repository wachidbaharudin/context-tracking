import type { AppDocument } from '@/types';

type ChangeCallback = (doc: AppDocument) => void;
const changeListeners: Set<ChangeCallback> = new Set();

export function subscribeToChanges(callback: ChangeCallback): () => void {
  changeListeners.add(callback);
  return () => {
    changeListeners.delete(callback);
  };
}

export function notifyChange(doc: AppDocument): void {
  changeListeners.forEach((callback) => callback(doc));
}

// Debounce utility for save operations
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}
