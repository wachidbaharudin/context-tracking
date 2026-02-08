import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { TimesheetEntry, AppDocument } from '@/types';

interface UseTimesheetProps {
  contextId: string;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

interface UseTimesheetResult {
  timesheetEnabled: boolean;
  timesheetEntries: TimesheetEntry[];
  toggleTimesheet: () => void;
  activeTimerStart: string | null;
  startTimer: () => void;
  stopTimer: () => string;
  updateEntry: (
    entryId: string,
    updates: Partial<Omit<TimesheetEntry, 'id' | 'createdAt'>>
  ) => void;
  deleteEntry: (entryId: string) => void;
}

export function useTimesheet({ contextId, doc, changeDoc }: UseTimesheetProps): UseTimesheetResult {
  const timesheetEnabled = doc?.contexts[contextId]?.timesheetEnabled ?? false;
  const timesheetEntries = doc?.contexts[contextId]?.timesheetEntries ?? [];
  const activeTimerStart = doc?.contexts[contextId]?.activeTimerStart ?? null;

  const toggleTimesheet = useCallback(() => {
    changeDoc((d) => {
      if (d.contexts[contextId]) {
        const isEnabled = d.contexts[contextId].timesheetEnabled ?? false;
        d.contexts[contextId].timesheetEnabled = !isEnabled;

        // Lazily initialize timesheetEntries array when first enabled
        if (!isEnabled && !d.contexts[contextId].timesheetEntries) {
          d.contexts[contextId].timesheetEntries = [];
        }

        d.contexts[contextId].updatedAt = new Date().toISOString();
      }
    });
  }, [contextId, changeDoc]);

  const startTimer = useCallback(() => {
    changeDoc((d) => {
      if (d.contexts[contextId]) {
        d.contexts[contextId].activeTimerStart = new Date().toISOString();
        d.contexts[contextId].updatedAt = new Date().toISOString();
      }
    });
  }, [contextId, changeDoc]);

  const stopTimer = useCallback((): string => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const start = doc?.contexts[contextId]?.activeTimerStart;

    if (!start) {
      throw new Error('No active timer to stop');
    }

    changeDoc((d) => {
      if (d.contexts[contextId]) {
        if (!d.contexts[contextId].timesheetEntries) {
          d.contexts[contextId].timesheetEntries = [];
        }

        d.contexts[contextId].timesheetEntries!.push({
          id,
          startTime: start,
          endTime: now,
          createdAt: now,
          updatedAt: now,
        });

        // Clear the active timer
        delete d.contexts[contextId].activeTimerStart;
        d.contexts[contextId].updatedAt = now;
      }
    });

    return id;
  }, [contextId, changeDoc, doc]);

  const updateEntry = useCallback(
    (entryId: string, updates: Partial<Omit<TimesheetEntry, 'id' | 'createdAt'>>) => {
      changeDoc((d) => {
        if (d.contexts[contextId]?.timesheetEntries) {
          const entryIndex = d.contexts[contextId].timesheetEntries!.findIndex(
            (entry) => entry.id === entryId
          );
          if (entryIndex !== -1) {
            Object.assign(d.contexts[contextId].timesheetEntries![entryIndex], updates);
            d.contexts[contextId].timesheetEntries![entryIndex].updatedAt =
              new Date().toISOString();
            d.contexts[contextId].updatedAt = new Date().toISOString();
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  const deleteEntry = useCallback(
    (entryId: string) => {
      changeDoc((d) => {
        if (d.contexts[contextId]?.timesheetEntries) {
          const entryIndex = d.contexts[contextId].timesheetEntries!.findIndex(
            (entry) => entry.id === entryId
          );
          if (entryIndex !== -1) {
            d.contexts[contextId].timesheetEntries!.splice(entryIndex, 1);
            d.contexts[contextId].updatedAt = new Date().toISOString();
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  return {
    timesheetEnabled,
    timesheetEntries,
    toggleTimesheet,
    activeTimerStart,
    startTimer,
    stopTimer,
    updateEntry,
    deleteEntry,
  };
}
