import { cn } from '@/lib/utils';

export type MobileTab = 'contexts' | 'calendar';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onNewContext: () => void;
}

export function MobileNav({ activeTab, onTabChange, onNewContext }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {/* Contexts Tab */}
        <button
          onClick={() => onTabChange('contexts')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors',
            activeTab === 'contexts' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          )}
          aria-label="Contexts"
          aria-current={activeTab === 'contexts' ? 'page' : undefined}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={activeTab === 'contexts' ? 2.5 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span className="text-xs mt-1 font-medium">Contexts</span>
        </button>

        {/* New Context Button */}
        <button
          onClick={onNewContext}
          className="flex items-center justify-center w-14 h-14 -mt-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
          aria-label="Create new context"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Calendar Tab */}
        <button
          onClick={() => onTabChange('calendar')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors',
            activeTab === 'calendar' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          )}
          aria-label="Calendar"
          aria-current={activeTab === 'calendar' ? 'page' : undefined}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={activeTab === 'calendar' ? 2.5 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs mt-1 font-medium">Calendar</span>
        </button>
      </div>
    </nav>
  );
}
