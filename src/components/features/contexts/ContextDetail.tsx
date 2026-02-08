import { Button } from '@/components/ui/Button';
import { ActionItemList } from '@/components/features/action-items';
import { LinkList } from '@/components/features/links';
import { useActionItems, useLinks } from '@/hooks';
import { cn, formatDate } from '@/lib/utils';
import type { Context, AppDocument } from '@/types';

interface ContextDetailProps {
  context: Context;
  isStalled: boolean;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onBack?: () => void;
}

export function ContextDetail({
  context,
  isStalled,
  doc,
  changeDoc,
  onToggleStatus,
  onDelete,
  onBack,
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
    <div className="h-full flex flex-col w-full">
      {/* Mobile back header */}
      {onBack && (
        <div className="md:hidden flex items-center gap-2 p-4 border-b border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-lg font-semibold text-gray-900 truncate">{context.name}</span>
        </div>
      )}

      {/* Header */}
      <div className={cn('p-4 md:p-6 border-b border-gray-200', onBack && 'hidden md:block')}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h2
                className="text-lg md:text-xl font-semibold text-gray-900 truncate"
                style={context.color ? { color: context.color } : undefined}
              >
                {context.name}
              </h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                  context.status === 'completed'
                    ? 'bg-gray-100 text-gray-600'
                    : isStalled
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    context.status === 'completed'
                      ? 'bg-gray-400'
                      : isStalled
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  )}
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

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleStatus}
              className="min-h-[44px] md:min-h-0 text-sm"
            >
              Mark as {context.status === 'ongoing' ? 'Completed' : 'Ongoing'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] md:min-h-0"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
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
