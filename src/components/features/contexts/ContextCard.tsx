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
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
        'active:bg-gray-200',
        isActive && 'bg-blue-50 border-l-2 border-blue-500',
        !isActive && 'border-l-2 border-transparent'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2.5 h-2.5 md:w-2 md:h-2 rounded-full flex-shrink-0',
            context.status === 'completed' && 'bg-gray-400',
            context.status === 'ongoing' && !isStalled && 'bg-green-500',
            context.status === 'ongoing' && isStalled && 'bg-amber-500'
          )}
          aria-label={
            context.status === 'completed' ? 'Completed' : isStalled ? 'Stalled' : 'Ongoing'
          }
        />
        <span
          className={cn(
            'text-base md:text-sm font-medium truncate',
            context.status === 'completed' && 'text-gray-500'
          )}
          style={context.color ? { color: context.color } : undefined}
        >
          {context.name}
        </span>
      </div>
      {context.description && (
        <p className="text-sm md:text-xs text-gray-500 truncate mt-1 md:mt-0.5 ml-4">
          {context.description}
        </p>
      )}
    </button>
  );
}
