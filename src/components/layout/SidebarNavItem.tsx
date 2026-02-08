import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function SidebarNavItem({
  isActive = false,
  icon,
  children,
  className,
  ...props
}: SidebarNavItemProps) {
  return (
    <button
      {...props}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        // Focus state - keep existing accessible focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        // Active state - refined approach: subtle background, colored text, slightly bolder
        isActive && [
          'bg-blue-50 text-blue-700 font-semibold',
          // Optional: thin left accent for active items (more refined than border-l-3)
          'border-l-2 border-blue-500 rounded-l-none pl-2.5',
        ],
        // Inactive state - more visible hover than the original hover:bg-gray-50
        !isActive && [
          'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
          'border-l-2 border-transparent pl-2.5', // Keep alignment consistent
        ],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate text-left">{children}</span>
    </button>
  );
}
