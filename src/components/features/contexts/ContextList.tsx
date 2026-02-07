import { ContextCard } from './ContextCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
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
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Contexts</h1>
      </div>

      <div className="p-2 space-y-1">
        <Button onClick={onCreateContext} className="w-full" size="sm">
          + New Context
        </Button>

        {/* Calendar navigation button */}
        {onCalendarClick && (
          <button
            onClick={onCalendarClick}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isCalendarActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Calendar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {ongoingContexts.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1">
              Ongoing
            </h2>
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
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1">
              Completed
            </h2>
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
