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
  activeTimerDescription: string | null;
  startTimer: (description?: string) => void;
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
  const activeTimerDescription = doc?.contexts[contextId]?.activeTimerDescription ?? null;

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

  const startTimer = useCallback(
    (description?: string) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          d.contexts[contextId].activeTimerStart = new Date().toISOString();
          d.contexts[contextId].activeTimerDescription = description?.trim() || undefined;
          d.contexts[contextId].updatedAt = new Date().toISOString();
        }
      });
    },
    [contextId, changeDoc]
  );

  const stopTimer = useCallback((): string => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const start = doc?.contexts[contextId]?.activeTimerStart;
    const description = doc?.contexts[contextId]?.activeTimerDescription;

    if (!start) {
      throw new Error('No active timer to stop');
    }

    changeDoc((d) => {
      if (d.contexts[contextId]) {
        if (!d.contexts[contextId].timesheetEntries) {
          d.contexts[contextId].timesheetEntries = [];
        }

        const entry: TimesheetEntry = {
          id,
          startTime: start,
          endTime: now,
          createdAt: now,
          updatedAt: now,
        };

        // Only add description if it exists
        if (description) {
          entry.description = description;
        }

        d.contexts[contextId].timesheetEntries!.push(entry);

        // Clear the active timer and description
        delete d.contexts[contextId].activeTimerStart;
        delete d.contexts[contextId].activeTimerDescription;
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
            const entry = d.contexts[contextId].timesheetEntries![entryIndex];

            if ('description' in updates) {
              if (updates.description) {
                entry.description = updates.description;
              } else {
                delete entry.description;
              }
            }
            if (updates.startTime) entry.startTime = updates.startTime;
            if (updates.endTime) entry.endTime = updates.endTime;

            entry.updatedAt = new Date().toISOString();
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
    activeTimerDescription,
    startTimer,
    stopTimer,
    updateEntry,
    deleteEntry,
  };
}
