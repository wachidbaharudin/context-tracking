import { ActionItemRow } from './ActionItemRow';
import { AddActionItem } from './AddActionItem';
import type { ActionItem, Priority } from '@/types';

interface ActionItemListProps {
  items: ActionItem[];
  onAdd: (title: string, priority?: Priority, dueDate?: string) => void;
  onToggleStatus: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onAddChecklistItem: (itemId: string, text: string) => void;
  onToggleChecklistItem: (itemId: string, checklistItemId: string) => void;
  onDeleteChecklistItem: (itemId: string, checklistItemId: string) => void;
}

export function ActionItemList({
  items,
  onAdd,
  onToggleStatus,
  onDelete,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
}: ActionItemListProps) {
  const pendingItems = items.filter((item) => item.status !== 'completed');
  const completedItems = items.filter((item) => item.status === 'completed');

  return (
    <div className="w-full space-y-4 px-2 py-3 md:space-y-3 md:px-0 md:py-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900 md:text-sm">Action Items</h3>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {pendingItems.length} pending, {completedItems.length} done
        </span>
      </div>

      <div className="space-y-3 md:space-y-2">
        {pendingItems.map((item) => (
          <ActionItemRow
            key={item.id}
            item={item}
            onToggleStatus={() => onToggleStatus(item.id)}
            onDelete={() => onDelete(item.id)}
            onAddChecklistItem={(text) => onAddChecklistItem(item.id, text)}
            onToggleChecklistItem={(checklistItemId) =>
              onToggleChecklistItem(item.id, checklistItemId)
            }
            onDeleteChecklistItem={(checklistItemId) =>
              onDeleteChecklistItem(item.id, checklistItemId)
            }
          />
        ))}

        <AddActionItem onAdd={onAdd} />

        {completedItems.length > 0 && (
          <details className="mt-4">
            <summary className="min-h-[44px] flex items-center text-sm text-gray-500 cursor-pointer hover:text-gray-700 md:min-h-0 md:text-xs">
              Show {completedItems.length} completed item{completedItems.length > 1 ? 's' : ''}
            </summary>
            <div className="mt-3 space-y-3 md:mt-2 md:space-y-2">
              {completedItems.map((item) => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  onToggleStatus={() => onToggleStatus(item.id)}
                  onDelete={() => onDelete(item.id)}
                  onAddChecklistItem={(text) => onAddChecklistItem(item.id, text)}
                  onToggleChecklistItem={(checklistItemId) =>
                    onToggleChecklistItem(item.id, checklistItemId)
                  }
                  onDeleteChecklistItem={(checklistItemId) =>
                    onDeleteChecklistItem(item.id, checklistItemId)
                  }
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
