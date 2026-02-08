import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ children, footer, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'w-64 flex-shrink-0 flex flex-col',
        // Refined background - intentional off-white instead of barely-visible gray-50/50
        'bg-gray-50',
        // Use subtle shadow instead of harsh border-r for separation (Refactoring UI principle)
        'shadow-[1px_0_3px_rgba(0,0,0,0.05)]',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        {/* Sidebar heading - Level 2 hierarchy, subtle but clear */}
        <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Contexts</h2>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Footer section - pushed to bottom with mt-auto handled by flex parent */}
      {footer && <div className="border-t border-gray-100 p-3">{footer}</div>}
    </aside>
  );
}
