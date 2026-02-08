import { Button } from '@/components/ui/Button';
import { ActionItemList } from '@/components/features/action-items';
import { LinkList } from '@/components/features/links';
import { TimesheetList } from '@/components/features/timesheet';
import { useActionItems, useLinks, useTimesheet } from '@/hooks';
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
    updateActionItem,
    toggleActionItemStatus,
    deleteActionItem,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    updateChecklistItem,
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

  const {
    timesheetEnabled,
    timesheetEntries,
    activeTimerStart,
    toggleTimesheet,
    startTimer,
    stopTimer,
    updateEntry,
    deleteEntry,
  } = useTimesheet({
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
      <div className={cn('p-4 md:p-6 border-b border-gray-100', onBack && 'hidden md:block')}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Context name - Level 1 hierarchy, the focal point */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h2
                className="text-xl md:text-2xl font-bold text-gray-900 truncate"
                style={context.color ? { color: context.color } : undefined}
              >
                {context.name}
              </h2>
              {/* Status badge - subtle, de-emphasized */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0',
                  context.status === 'completed'
                    ? 'bg-gray-50 text-gray-500'
                    : isStalled
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-green-50 text-green-600'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    context.status === 'completed'
                      ? 'bg-gray-400'
                      : isStalled
                        ? 'bg-amber-400'
                        : 'bg-green-400'
                  )}
                />
                {context.status === 'completed' ? 'Completed' : isStalled ? 'Stalled' : 'Ongoing'}
              </span>
            </div>
            {/* Description - Level 4 hierarchy, secondary content */}
            {context.description && (
              <p className="mt-2 text-base text-gray-600">{context.description}</p>
            )}
            {/* Metadata - Level 5/6 hierarchy, pushed to background */}
            <p className="mt-3 text-[11px] text-gray-400">
              Created {formatDate(context.createdAt)} · Updated {formatDate(context.updatedAt)}
            </p>
          </div>

          {/* Actions - grouped and de-emphasized */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleStatus}
              className="min-h-[44px] md:min-h-0 text-sm text-gray-600"
            >
              Mark as {context.status === 'ongoing' ? 'Completed' : 'Ongoing'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 min-h-[44px] md:min-h-0"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content - increased spacing between major sections */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 md:space-y-12">
        <ActionItemList
          items={actionItems}
          onAdd={addActionItem}
          onToggleStatus={toggleActionItemStatus}
          onDelete={deleteActionItem}
          onUpdate={updateActionItem}
          onAddChecklistItem={addChecklistItem}
          onToggleChecklistItem={toggleChecklistItem}
          onDeleteChecklistItem={deleteChecklistItem}
          onUpdateChecklistItem={updateChecklistItem}
        />

        <LinkList links={links} onAdd={addLink} onDelete={deleteLink} />

        {/* Timesheet Section */}
        {timesheetEnabled ? (
          <TimesheetList
            entries={timesheetEntries}
            activeTimerStart={activeTimerStart}
            onStart={startTimer}
            onStop={stopTimer}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />
        ) : (
          <div className="w-full px-2 py-3 md:px-0 md:py-0">
            <button
              onClick={toggleTimesheet}
              className="w-full flex items-center gap-3 p-4 text-left border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="text-sm font-medium text-gray-600">Enable timesheet tracking</div>
                <div className="text-[11px] text-gray-400">Track time spent on this context</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
