import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Context for managing tab state
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs');
  }
  return context;
}

// Root Tabs component
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('flex flex-col h-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// TabsList - container for tab triggers
interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'flex items-center border-b border-gray-200 overflow-x-auto scrollbar-hide',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

// TabsTrigger - individual tab button
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = selectedValue === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        'relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'min-h-[44px] md:min-h-0',
        isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700',
        className
      )}
    >
      {children}
      {/* Active indicator - bottom border */}
      {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
    </button>
  );
}

// TabsContent - content panel for each tab
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext();

  if (selectedValue !== value) {
    return null;
  }

  return (
    <div role="tabpanel" className={cn('flex-1 overflow-y-auto p-4 md:p-6', className)}>
      {children}
    </div>
  );
}
