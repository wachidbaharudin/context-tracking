import { useMemo } from 'react';
import type { AppDocument } from '@/types/document';
import type { ActionItem } from '@/types';

export interface ActionItemWithContext {
  item: ActionItem;
  context: { id: string; name: string; color?: string };
}

interface UseAllActionItemsProps {
  doc: AppDocument | null | undefined;
}

interface UseAllActionItemsReturn {
  /** Map of ISO date string (YYYY-MM-DD) to action items on that date */
  scheduledItems: Map<string, ActionItemWithContext[]>;
  /** Action items without a due date */
  unscheduledItems: ActionItemWithContext[];
  /** All action items with context info */
  allItems: ActionItemWithContext[];
}

export function useAllActionItems({ doc }: UseAllActionItemsProps): UseAllActionItemsReturn {
  return useMemo(() => {
    const scheduledItems = new Map<string, ActionItemWithContext[]>();
    const unscheduledItems: ActionItemWithContext[] = [];
    const allItems: ActionItemWithContext[] = [];

    if (!doc?.contexts) {
      return { scheduledItems, unscheduledItems, allItems };
    }

    // Iterate over all contexts
    Object.values(doc.contexts).forEach((context) => {
      const contextInfo = {
        id: context.id,
        name: context.name,
        color: context.color,
      };

      // Iterate over action items in each context
      (context.actionItems ?? []).forEach((item) => {
        const itemWithContext: ActionItemWithContext = {
          item,
          context: contextInfo,
        };

        allItems.push(itemWithContext);

        if (item.dueDate) {
          // Normalize date to YYYY-MM-DD format
          const dateKey = item.dueDate.split('T')[0];
          const existing = scheduledItems.get(dateKey) ?? [];
          existing.push(itemWithContext);
          scheduledItems.set(dateKey, existing);
        } else {
          unscheduledItems.push(itemWithContext);
        }
      });
    });

    // Sort items within each date by priority (high > medium > low) and status
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { pending: 0, ongoing: 1, completed: 2 };

    const sortItems = (a: ActionItemWithContext, b: ActionItemWithContext) => {
      // First by status (pending/ongoing before completed)
      const statusDiff = statusOrder[a.item.status] - statusOrder[b.item.status];
      if (statusDiff !== 0) return statusDiff;

      // Then by priority
      const aPriority = a.item.priority ?? 'low';
      const bPriority = b.item.priority ?? 'low';
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    };

    scheduledItems.forEach((items) => {
      items.sort(sortItems);
    });

    unscheduledItems.sort(sortItems);

    return { scheduledItems, unscheduledItems, allItems };
  }, [doc]);
}
