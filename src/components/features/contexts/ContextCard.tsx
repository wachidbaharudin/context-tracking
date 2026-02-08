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
        'w-full text-left px-3 py-2 rounded-lg transition-all duration-150',
        // Focus state - accessible and clear
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        // Active state - refined: subtle background, colored text, bolder font, thin left accent
        isActive && [
          'bg-blue-50 text-blue-700 font-semibold',
          'border-l-2 border-blue-500 rounded-l-none pl-2.5',
        ],
        // Inactive state - more visible hover (gray-100 instead of gray-50)
        !isActive && [
          'text-gray-900 hover:bg-gray-100',
          'border-l-2 border-transparent pl-2.5', // Maintain alignment
        ]
      )}
    >
      <div className="flex items-center gap-2.5">
        {/* Status indicator - reduced visual weight, smaller and more subtle */}
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            // Tightened color palette with opacity for subtlety
            context.status === 'completed' && 'bg-gray-300',
            context.status === 'ongoing' && !isStalled && 'bg-green-500 opacity-80',
            context.status === 'ongoing' && isStalled && 'bg-amber-500 opacity-80'
          )}
          aria-label={
            context.status === 'completed' ? 'Completed' : isStalled ? 'Stalled' : 'Ongoing'
          }
        />
        {/* Context name - Level 3 hierarchy (14px, medium weight) */}
        <span
          className={cn(
            'text-sm font-medium truncate',
            // Simplified color logic - only dim completed items
            context.status === 'completed' && 'text-gray-400',
            // Active state already handles text color at button level
            !isActive && context.status !== 'completed' && 'text-gray-900'
          )}
          style={
            // Custom colors only for non-completed, non-active items
            context.color && context.status !== 'completed' && !isActive
              ? { color: context.color }
              : undefined
          }
        >
          {context.name}
        </span>
      </div>
      {/* Description - Level 5/6 hierarchy (11px, gray-500 for better readability) */}
      {context.description && (
        <p className="text-[11px] text-gray-500 truncate mt-0.5 ml-4">{context.description}</p>
      )}
    </button>
  );
}
