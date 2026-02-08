import { ActionItemRow } from './ActionItemRow';
import { AddActionItem } from './AddActionItem';
import type { ActionItem, Priority } from '@/types';

interface ActionItemListProps {
  items: ActionItem[];
  onAdd: (title: string, priority?: Priority, dueDate?: string) => void;
  onToggleStatus: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<Omit<ActionItem, 'id' | 'createdAt'>>) => void;
  onAddChecklistItem: (itemId: string, text: string) => void;
  onToggleChecklistItem: (itemId: string, checklistItemId: string) => void;
  onDeleteChecklistItem: (itemId: string, checklistItemId: string) => void;
  onUpdateChecklistItem: (itemId: string, checklistItemId: string, text: string) => void;
}

export function ActionItemList({
  items,
  onAdd,
  onToggleStatus,
  onDelete,
  onUpdate,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  onUpdateChecklistItem,
}: ActionItemListProps) {
  const pendingItems = items.filter((item) => item.status !== 'completed');
  const completedItems = items.filter((item) => item.status === 'completed');

  return (
    <div className="w-full space-y-4 px-2 py-3 md:space-y-4 md:px-0 md:py-0">
      {/* Section header - Level 2 hierarchy */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
        {/* Counter - Level 6, subtle metadata */}
        <span className="text-[11px] text-gray-400">
          {pendingItems.length} pending · {completedItems.length} done
        </span>
      </div>

      <div className="space-y-3 md:space-y-2">
        {pendingItems.map((item) => (
          <ActionItemRow
            key={item.id}
            item={item}
            onToggleStatus={() => onToggleStatus(item.id)}
            onDelete={() => onDelete(item.id)}
            onUpdate={(updates) => onUpdate(item.id, updates)}
            onAddChecklistItem={(text) => onAddChecklistItem(item.id, text)}
            onToggleChecklistItem={(checklistItemId) =>
              onToggleChecklistItem(item.id, checklistItemId)
            }
            onDeleteChecklistItem={(checklistItemId) =>
              onDeleteChecklistItem(item.id, checklistItemId)
            }
            onUpdateChecklistItem={(checklistItemId, text) =>
              onUpdateChecklistItem(item.id, checklistItemId, text)
            }
          />
        ))}

        <AddActionItem onAdd={onAdd} />

        {completedItems.length > 0 && (
          <details className="mt-6">
            <summary className="min-h-[44px] flex items-center text-[11px] text-gray-400 cursor-pointer hover:text-gray-500 md:min-h-0">
              {completedItems.length} completed item{completedItems.length > 1 ? 's' : ''}
            </summary>
            <div className="mt-3 space-y-3 md:mt-2 md:space-y-2">
              {completedItems.map((item) => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  onToggleStatus={() => onToggleStatus(item.id)}
                  onDelete={() => onDelete(item.id)}
                  onUpdate={(updates) => onUpdate(item.id, updates)}
                  onAddChecklistItem={(text) => onAddChecklistItem(item.id, text)}
                  onToggleChecklistItem={(checklistItemId) =>
                    onToggleChecklistItem(item.id, checklistItemId)
                  }
                  onDeleteChecklistItem={(checklistItemId) =>
                    onDeleteChecklistItem(item.id, checklistItemId)
                  }
                  onUpdateChecklistItem={(checklistItemId, text) =>
                    onUpdateChecklistItem(item.id, checklistItemId, text)
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
