import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ActionItem, ActionItemStatus, Priority, AppDocument } from '@/types';

interface UseActionItemsProps {
  contextId: string;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

interface UseActionItemsResult {
  actionItems: ActionItem[];
  addActionItem: (title: string, priority?: Priority, dueDate?: string) => string;
  updateActionItem: (
    itemId: string,
    updates: Partial<Omit<ActionItem, 'id' | 'createdAt'>>
  ) => void;
  deleteActionItem: (itemId: string) => void;
  toggleActionItemStatus: (itemId: string) => void;
  addChecklistItem: (actionItemId: string, text: string) => string;
  toggleChecklistItem: (actionItemId: string, checklistItemId: string) => void;
  deleteChecklistItem: (actionItemId: string, checklistItemId: string) => void;
  updateChecklistItem: (actionItemId: string, checklistItemId: string, text: string) => void;
}

export function useActionItems({
  contextId,
  doc,
  changeDoc,
}: UseActionItemsProps): UseActionItemsResult {
  const actionItems = doc?.contexts[contextId]?.actionItems ?? [];

  const addActionItem = useCallback(
    (title: string, priority?: Priority, dueDate?: string): string => {
      const id = uuidv4();
      const now = new Date().toISOString();

      changeDoc((d) => {
        if (d.contexts[contextId]) {
          d.contexts[contextId].actionItems.push({
            id,
            title,
            status: 'pending',
            priority,
            dueDate,
            createdAt: now,
            updatedAt: now,
          });
          d.contexts[contextId].updatedAt = now;
        }
      });

      return id;
    },
    [contextId, changeDoc]
  );

  const updateActionItem = useCallback(
    (itemId: string, updates: Partial<Omit<ActionItem, 'id' | 'createdAt'>>) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const itemIndex = d.contexts[contextId].actionItems.findIndex(
            (item) => item.id === itemId
          );
          if (itemIndex !== -1) {
            const now = new Date().toISOString();
            Object.assign(d.contexts[contextId].actionItems[itemIndex], {
              ...updates,
              updatedAt: now,
            });
            d.contexts[contextId].updatedAt = now;
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  const deleteActionItem = useCallback(
    (itemId: string) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const itemIndex = d.contexts[contextId].actionItems.findIndex(
            (item) => item.id === itemId
          );
          if (itemIndex !== -1) {
            d.contexts[contextId].actionItems.splice(itemIndex, 1);
            d.contexts[contextId].updatedAt = new Date().toISOString();
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  const toggleActionItemStatus = useCallback(
    (itemId: string) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const item = d.contexts[contextId].actionItems.find((i) => i.id === itemId);
          if (item) {
            const statusOrder: ActionItemStatus[] = ['pending', 'ongoing', 'completed'];
            const currentIndex = statusOrder.indexOf(item.status);
            const nextIndex = (currentIndex + 1) % statusOrder.length;
            item.status = statusOrder[nextIndex];
            item.updatedAt = new Date().toISOString();
            d.contexts[contextId].updatedAt = new Date().toISOString();
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  const addChecklistItem = useCallback(
    (actionItemId: string, text: string): string => {
      const id = uuidv4();
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const item = d.contexts[contextId].actionItems.find((i) => i.id === actionItemId);
          if (item) {
            if (!item.checklist) {
              item.checklist = [];
            }
            item.checklist.push({ id, text, done: false });
            item.updatedAt = new Date().toISOString();
            d.contexts[contextId].updatedAt = new Date().toISOString();
          }
        }
      });
      return id;
    },
    [contextId, changeDoc]
  );

  const toggleChecklistItem = useCallback(
    (actionItemId: string, checklistItemId: string) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const item = d.contexts[contextId].actionItems.find((i) => i.id === actionItemId);
          if (item?.checklist) {
            const checklistItem = item.checklist.find((c) => c.id === checklistItemId);
            if (checklistItem) {
              checklistItem.done = !checklistItem.done;
              item.updatedAt = new Date().toISOString();
              d.contexts[contextId].updatedAt = new Date().toISOString();
            }
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  const deleteChecklistItem = useCallback(
    (actionItemId: string, checklistItemId: string) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const item = d.contexts[contextId].actionItems.find((i) => i.id === actionItemId);
          if (item?.checklist) {
            const index = item.checklist.findIndex((c) => c.id === checklistItemId);
            if (index !== -1) {
              item.checklist.splice(index, 1);
              item.updatedAt = new Date().toISOString();
              d.contexts[contextId].updatedAt = new Date().toISOString();
            }
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  const updateChecklistItem = useCallback(
    (actionItemId: string, checklistItemId: string, text: string) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const item = d.contexts[contextId].actionItems.find((i) => i.id === actionItemId);
          if (item?.checklist) {
            const checklistItem = item.checklist.find((c) => c.id === checklistItemId);
            if (checklistItem) {
              checklistItem.text = text;
              item.updatedAt = new Date().toISOString();
              d.contexts[contextId].updatedAt = new Date().toISOString();
            }
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  return {
    actionItems,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    toggleActionItemStatus,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    updateChecklistItem,
  };
}
