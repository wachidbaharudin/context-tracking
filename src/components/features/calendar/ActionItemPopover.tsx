import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getContextColor } from '@/lib/utils/getContextColor';
import type { ActionItemWithContext } from '@/hooks/useAllActionItems';

interface ActionItemPopoverProps {
  items: ActionItemWithContext[];
  isOpen: boolean;
  onClose: () => void;
  /** Anchor element position for positioning */
  anchorRect: DOMRect | null;
  /** Optional: callback when clicking an item to navigate to its context */
  onSelectContext?: (contextId: string) => void;
}

const statusIcons: Record<string, string> = {
  pending: '○',
  ongoing: '◐',
  completed: '●',
};

const priorityColors: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-gray-600 bg-gray-50',
};

export function ActionItemPopover({
  items,
  isOpen,
  onClose,
  anchorRect,
  onSelectContext,
}: ActionItemPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect || items.length === 0) {
    return null;
  }

  // Calculate position - prefer below and to the right of anchor
  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchorRect.bottom + 4,
    left: anchorRect.left,
    zIndex: 50,
  };

  // Adjust if would go off screen
  if (typeof window !== 'undefined') {
    if (anchorRect.left + 280 > window.innerWidth) {
      style.left = window.innerWidth - 290;
    }
    if (anchorRect.bottom + 200 > window.innerHeight) {
      style.top = anchorRect.top - 4;
      style.transform = 'translateY(-100%)';
    }
  }

  return (
    <div
      ref={popoverRef}
      style={style}
      className={cn(
        'w-72 max-h-64 overflow-y-auto',
        'bg-white rounded-lg shadow-lg border border-gray-200',
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
    >
      <div className="p-2 space-y-1">
        {items.map((itemWithContext) => {
          const { item, context } = itemWithContext;
          const contextColor = getContextColor(context);

          return (
            <div
              key={item.id}
              className={cn(
                'p-2 rounded-md hover:bg-gray-50 transition-colors',
                onSelectContext && 'cursor-pointer'
              )}
              onClick={() => onSelectContext?.(context.id)}
            >
              <div className="flex items-start gap-2">
                {/* Status icon */}
                <span
                  className={cn(
                    'text-sm flex-shrink-0 mt-0.5',
                    item.status === 'completed' && 'text-green-600',
                    item.status === 'ongoing' && 'text-blue-600',
                    item.status === 'pending' && 'text-gray-400'
                  )}
                >
                  {statusIcons[item.status]}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium text-gray-900 truncate',
                      item.status === 'completed' && 'line-through text-gray-500'
                    )}
                  >
                    {item.title}
                  </p>

                  {/* Context indicator */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: contextColor }}
                    />
                    <span className="text-xs text-gray-500 truncate">{context.name}</span>
                  </div>
                </div>

                {/* Priority badge */}
                {item.priority && (
                  <span
                    className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0',
                      priorityColors[item.priority]
                    )}
                  >
                    {item.priority}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
