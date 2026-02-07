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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Action Items</h3>
        <span className="text-xs text-gray-500">
          {pendingItems.length} pending, {completedItems.length} done
        </span>
      </div>

      <div className="space-y-2">
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
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Show {completedItems.length} completed item{completedItems.length > 1 ? 's' : ''}
            </summary>
            <div className="mt-2 space-y-2">
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
