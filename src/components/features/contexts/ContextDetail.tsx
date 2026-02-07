import { Button } from '@/components/ui/Button';
import { ActionItemList } from '@/components/features/action-items';
import { LinkList } from '@/components/features/links';
import { useActionItems, useLinks } from '@/hooks';
import { formatDate } from '@/lib/utils';
import type { Context, AppDocument } from '@/types';

interface ContextDetailProps {
  context: Context;
  isStalled: boolean;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function ContextDetail({
  context,
  isStalled,
  doc,
  changeDoc,
  onToggleStatus,
  onDelete,
}: ContextDetailProps) {
  const {
    actionItems,
    addActionItem,
    toggleActionItemStatus,
    deleteActionItem,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
  } = useActionItems({
    contextId: context.id,
    doc,
    changeDoc,
  });

  const { links, addLink, deleteLink } = useLinks({
    contextId: context.id,
    doc,
    changeDoc,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2
                className="text-xl font-semibold text-gray-900"
                style={context.color ? { color: context.color } : undefined}
              >
                {context.name}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  context.status === 'completed'
                    ? 'bg-gray-100 text-gray-600'
                    : isStalled
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    context.status === 'completed'
                      ? 'bg-gray-400'
                      : isStalled
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  }`}
                />
                {context.status === 'completed' ? 'Completed' : isStalled ? 'Stalled' : 'Ongoing'}
              </span>
            </div>
            {context.description && (
              <p className="mt-1 text-sm text-gray-600">{context.description}</p>
            )}
            <p className="mt-2 text-xs text-gray-400">
              Created {formatDate(context.createdAt)} · Updated {formatDate(context.updatedAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onToggleStatus}>
              Mark as {context.status === 'ongoing' ? 'Completed' : 'Ongoing'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <ActionItemList
          items={actionItems}
          onAdd={addActionItem}
          onToggleStatus={toggleActionItemStatus}
          onDelete={deleteActionItem}
          onAddChecklistItem={addChecklistItem}
          onToggleChecklistItem={toggleChecklistItem}
          onDeleteChecklistItem={deleteChecklistItem}
        />

        <LinkList links={links} onAdd={addLink} onDelete={deleteLink} />
      </div>
    </div>
  );
}
