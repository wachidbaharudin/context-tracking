import { ContextCard } from './ContextCard';
import { Button } from '@/components/ui/Button';
import { SidebarNavItem } from '@/components/layout';
import type { Context } from '@/types';

interface ContextListProps {
  ongoingContexts: Context[];
  completedContexts: Context[];
  stalledContextIds: Set<string>;
  selectedContextId: string | null;
  onSelectContext: (id: string) => void;
  onCreateContext: () => void;
  onCalendarClick?: () => void;
  isCalendarActive?: boolean;
}

export function ContextList({
  ongoingContexts,
  completedContexts,
  stalledContextIds,
  selectedContextId,
  onSelectContext,
  onCreateContext,
  onCalendarClick,
  isCalendarActive,
}: ContextListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Action buttons section - consistent spacing */}
      <div className="p-3 space-y-1">
        <Button onClick={onCreateContext} className="w-full" size="sm">
          + New Context
        </Button>

        {/* Calendar navigation button - using SidebarNavItem for consistency */}
        {onCalendarClick && (
          <SidebarNavItem
            isActive={isCalendarActive}
            onClick={onCalendarClick}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
          >
            Calendar
          </SidebarNavItem>
        )}
      </div>

      {/* Scrollable context list - removed layout-level padding/width concerns */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {ongoingContexts.length > 0 && (
          <div className="mb-4">
            {/* Section label - improved contrast (gray-500 instead of gray-400) */}
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider px-3 mb-1.5">
              Ongoing
            </h3>
            <div className="space-y-0.5">
              {ongoingContexts.map((context) => (
                <ContextCard
                  key={context.id}
                  context={context}
                  isActive={context.id === selectedContextId && !isCalendarActive}
                  isStalled={stalledContextIds.has(context.id)}
                  onClick={() => onSelectContext(context.id)}
                />
              ))}
            </div>
          </div>
        )}

        {completedContexts.length > 0 && (
          <div>
            {/* Section label - improved contrast */}
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider px-3 mb-1.5">
              Completed
            </h3>
            <div className="space-y-0.5">
              {completedContexts.map((context) => (
                <ContextCard
                  key={context.id}
                  context={context}
                  isActive={context.id === selectedContextId && !isCalendarActive}
                  isStalled={false}
                  onClick={() => onSelectContext(context.id)}
                />
              ))}
            </div>
          </div>
        )}

        {ongoingContexts.length === 0 && completedContexts.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No contexts yet. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
}
