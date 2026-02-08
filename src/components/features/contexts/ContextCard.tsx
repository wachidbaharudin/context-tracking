import { cn } from '@/lib/utils';
import type { Context } from '@/types';

interface ContextCardProps {
  context: Context;
  isActive: boolean;
  isStalled: boolean;
  onClick: () => void;
}

export function ContextCard({ context, isActive, isStalled, onClick }: ContextCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-3 md:py-2 rounded-md transition-colors min-h-[48px]',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        'active:bg-gray-200',
        // Clear active state with left accent border
        isActive && 'bg-blue-50 border-l-3 border-blue-500',
        !isActive && 'border-l-3 border-transparent hover:bg-gray-50'
      )}
    >
      <div className="flex items-center gap-2">
        {/* Status indicator - small, subtle */}
        <span
          className={cn(
            'w-2 h-2 md:w-1.5 md:h-1.5 rounded-full flex-shrink-0',
            context.status === 'completed' && 'bg-gray-300',
            context.status === 'ongoing' && !isStalled && 'bg-green-400',
            context.status === 'ongoing' && isStalled && 'bg-amber-400'
          )}
          aria-label={
            context.status === 'completed' ? 'Completed' : isStalled ? 'Stalled' : 'Ongoing'
          }
        />
        {/* Context name - Level 3 hierarchy */}
        <span
          className={cn(
            'text-base md:text-sm font-medium truncate',
            context.status === 'completed' ? 'text-gray-400' : 'text-gray-900'
          )}
          style={
            context.color && context.status !== 'completed' ? { color: context.color } : undefined
          }
        >
          {context.name}
        </span>
      </div>
      {/* Description - Level 5/6, pushed back */}
      {context.description && (
        <p className="text-[11px] md:text-[11px] text-gray-400 truncate mt-1 md:mt-0.5 ml-4">
          {context.description}
        </p>
      )}
    </button>
  );
}
