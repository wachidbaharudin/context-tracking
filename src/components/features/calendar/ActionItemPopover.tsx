import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getContextColor } from '@/lib/utils/getContextColor';
import { useBreakpoint } from '@/hooks';
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
  const { isMobile } = useBreakpoint();

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

  if (!isOpen || items.length === 0) {
    return null;
  }

  // Mobile: bottom sheet style
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

        {/* Bottom sheet */}
        <div
          ref={popoverRef}
          className={cn(
            'fixed left-0 right-0 bottom-0 z-50',
            'bg-white rounded-t-2xl shadow-2xl',
            'max-h-[70vh] overflow-y-auto',
            'animate-in slide-in-from-bottom duration-200'
          )}
        >
          {/* Handle bar */}
          <div className="sticky top-0 bg-white pt-3 pb-2 px-4 border-b border-gray-100">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
          </div>

          <div className="p-4 space-y-2">
            {items.map((itemWithContext) => {
              const { item, context } = itemWithContext;
              const contextColor = getContextColor(context);

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors',
                    'border border-gray-100',
                    onSelectContext && 'cursor-pointer'
                  )}
                  style={{ borderLeftColor: contextColor, borderLeftWidth: '4px' }}
                  onClick={() => onSelectContext?.(context.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <span
                      className={cn(
                        'text-lg flex-shrink-0 mt-0.5',
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
                          'text-base font-medium text-gray-900',
                          item.status === 'completed' && 'line-through text-gray-500'
                        )}
                      >
                        {item.title}
                      </p>

                      {/* Context indicator */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: contextColor }}
                        />
                        <span className="text-sm text-gray-500">{context.name}</span>
                      </div>
                    </div>

                    {/* Priority badge */}
                    {item.priority && (
                      <span
                        className={cn(
                          'text-sm font-medium px-2.5 py-1 rounded-lg flex-shrink-0',
                          priorityColors[item.priority]
                        )}
                      >
                        {item.priority}
                      </span>
                    )}
                  </div>

                  {/* Go to context button */}
                  {onSelectContext && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        className="w-full py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100 transition-colors min-h-[44px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectContext(context.id);
                        }}
                      >
                        Go to Context
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Close button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
            <button
              onClick={onClose}
              className="w-full py-3 text-base font-medium text-gray-700 bg-gray-100 rounded-xl active:bg-gray-200 transition-colors min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  // Desktop: positioned popover
  // Calculate position - prefer below and to the right of anchor
  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchorRect ? anchorRect.bottom + 4 : 0,
    left: anchorRect ? anchorRect.left : 0,
    zIndex: 50,
  };

  // Adjust if would go off screen
  if (typeof window !== 'undefined' && anchorRect) {
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
