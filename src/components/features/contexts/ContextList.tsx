import { ContextCard } from './ContextCard';
import { Button } from '@/components/ui/Button';
import type { Context } from '@/types';

interface ContextListProps {
  ongoingContexts: Context[];
  completedContexts: Context[];
  stalledContextIds: Set<string>;
  selectedContextId: string | null;
  onSelectContext: (id: string) => void;
  onCreateContext: () => void;
}

export function ContextList({
  ongoingContexts,
  completedContexts,
  stalledContextIds,
  selectedContextId,
  onSelectContext,
  onCreateContext,
}: ContextListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Contexts</h1>
      </div>

      <div className="p-2">
        <Button onClick={onCreateContext} className="w-full" size="sm">
          + New Context
        </Button>
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
                  isActive={context.id === selectedContextId}
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
                  isActive={context.id === selectedContextId}
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
