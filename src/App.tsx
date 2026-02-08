import { useState, useCallback } from 'react';
import { useAutomerge, useContexts, useOnlineStatus, useBreakpoint, useAutoLock } from '@/hooks';
import { ContextList, ContextDetail, CreateContextModal } from '@/components/features/contexts';
import { CalendarView } from '@/components/features/calendar';
import { MobileNav, type MobileTab } from '@/components/ui';
import { Sidebar, SidebarNavItem } from '@/components/layout';
import { POCDashboard } from '@/poc';
import { PassphraseScreen, type PassphraseMode } from '@/components/features/auth/PassphraseScreen';
import {
  isFirstTimeSetup,
  isUnlocked,
  initializeEncryption,
  unlock,
  lock,
  hasExistingUnencryptedData,
} from '@/lib/security/key-manager';
import { initializeRepo, resetRepo } from '@/lib/automerge';
import { migrateToEncrypted } from '@/lib/security/migration';

type AppState = 'passphrase' | 'unlocked';
type ViewMode = 'contexts' | 'calendar';

// Mobile view states for List -> Detail navigation flow
type MobileContextView = 'list' | 'detail';

function App() {
  // Determine initial app state
  const [appState, setAppState] = useState<AppState>(isUnlocked() ? 'unlocked' : 'passphrase');
  const [passphraseError, setPassphraseError] = useState<string | null>(null);

  const needsMigration = hasExistingUnencryptedData();
  const passphraseMode: PassphraseMode = isFirstTimeSetup() || needsMigration ? 'setup' : 'unlock';

  const handlePassphraseSubmit = useCallback(
    async (passphrase: string) => {
      setPassphraseError(null);

      try {
        if (passphraseMode === 'setup') {
          // Derives key in worker, stores salt + sentinel
          await initializeEncryption(passphrase);

          if (needsMigration) {
            // Migrate existing unencrypted data (worker already has key)
            const migratedRepo = await migrateToEncrypted();
            if (migratedRepo) {
              // The migration created a new repo already; reset so initializeRepo creates fresh
              resetRepo();
            }
          }
        } else {
          // Derives key in worker, verifies against sentinel
          await unlock(passphrase);
        }

        // Initialize the encrypted repo (adapter uses worker for crypto)
        initializeRepo();
        setAppState('unlocked');
      } catch (err) {
        setPassphraseError(err instanceof Error ? err.message : 'An error occurred');
        throw err; // Re-throw so PassphraseScreen knows submission failed
      }
    },
    [passphraseMode, needsMigration]
  );

  // Show passphrase screen if not unlocked
  if (appState === 'passphrase') {
    return (
      <PassphraseScreen
        mode={passphraseMode}
        onSubmit={handlePassphraseSubmit}
        error={passphraseError}
        isMigrating={needsMigration}
      />
    );
  }

  // Once unlocked, render the main app
  return (
    <MainApp
      onLock={async () => {
        await lock();
        resetRepo();
        setAppState('passphrase');
      }}
    />
  );
}

/**
 * Main application component — rendered only after passphrase unlock.
 */
function MainApp({ onLock }: { onLock: () => void | Promise<void> }) {
  const { doc, isLoading, error, changeDoc } = useAutomerge();
  const isOnline = useOnlineStatus();
  const { isMobile } = useBreakpoint();

  // Auto-lock after inactivity (uses settings from the document, defaults to 15 min)
  const autoLockMinutes = doc?.settings?.autoLockMinutes ?? 15;
  useAutoLock({
    timeoutMinutes: autoLockMinutes,
    onLock,
    enabled: !isLoading && !error,
  });

  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showPOC, setShowPOC] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('contexts');

  // Mobile-specific: track if we're viewing the list or a detail
  const [mobileContextView, setMobileContextView] = useState<MobileContextView>('list');

  const {
    ongoingContexts,
    completedContexts,
    stalledContextIds,
    getContext,
    createContext,
    toggleContextStatus,
    deleteContext,
  } = useContexts({ doc, changeDoc });

  const selectedContext = selectedContextId ? getContext(selectedContextId) : null;

  const handleCreateContext = (name: string, description?: string, color?: string) => {
    const newId = createContext(name, description, color);
    setSelectedContextId(newId);
    setViewMode('contexts');
    setMobileContextView('detail');
  };

  const handleDeleteContext = (id: string) => {
    if (confirm('Are you sure you want to delete this context?')) {
      deleteContext(id);
      if (selectedContextId === id) {
        setSelectedContextId(null);
        setMobileContextView('list');
      }
    }
  };

  const handleSelectContext = (contextId: string) => {
    setSelectedContextId(contextId);
    setViewMode('contexts');
    setMobileContextView('detail');
  };

  const handleCalendarClick = () => {
    setViewMode('calendar');
  };

  // Mobile navigation handlers
  const handleMobileTabChange = (tab: MobileTab) => {
    if (tab === 'contexts') {
      setViewMode('contexts');
      if (!selectedContextId) {
        setMobileContextView('list');
      }
    } else if (tab === 'calendar') {
      setViewMode('calendar');
    }
  };

  const handleMobileBack = () => {
    setMobileContextView('list');
    setSelectedContextId(null);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Decrypting data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading data</p>
          <p className="mt-1 text-sm text-gray-600">{error.message}</p>
          <button
            onClick={onLock}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Lock and try again
          </button>
        </div>
      </div>
    );
  }

  // Show POC Dashboard when toggled
  if (showPOC) {
    return <POCDashboard onBack={() => setShowPOC(false)} />;
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        {!isOnline && (
          <div className="bg-amber-100 text-amber-800 text-sm px-4 py-2 text-center">
            You are currently offline. Changes will be saved locally.
          </div>
        )}

        <main className="flex-1 overflow-hidden pb-16">
          {viewMode === 'calendar' ? (
            <CalendarView doc={doc} onSelectContext={handleSelectContext} />
          ) : mobileContextView === 'detail' && selectedContext ? (
            <ContextDetail
              context={selectedContext}
              isStalled={stalledContextIds.has(selectedContext.id)}
              doc={doc}
              changeDoc={changeDoc}
              onToggleStatus={() => toggleContextStatus(selectedContext.id)}
              onDelete={() => handleDeleteContext(selectedContext.id)}
              onBack={handleMobileBack}
            />
          ) : (
            <div className="h-full bg-gray-50 overflow-y-auto">
              <ContextList
                ongoingContexts={ongoingContexts}
                completedContexts={completedContexts}
                stalledContextIds={stalledContextIds}
                selectedContextId={selectedContextId}
                onSelectContext={handleSelectContext}
                onCreateContext={() => setIsCreateModalOpen(true)}
                onCalendarClick={handleCalendarClick}
                isCalendarActive={false}
              />
            </div>
          )}
        </main>

        <MobileNav
          activeTab={viewMode === 'calendar' ? 'calendar' : 'contexts'}
          onTabChange={handleMobileTabChange}
          onNewContext={() => setIsCreateModalOpen(true)}
        />

        <CreateContextModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateContext={handleCreateContext}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-full flex flex-col">
      {!isOnline && (
        <div className="bg-amber-100 text-amber-800 text-sm px-4 py-2 text-center">
          You are currently offline. Changes will be saved locally.
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          footer={
            <div className="space-y-1">
              <SidebarNavItem onClick={() => setShowPOC(true)}>Automerge POC</SidebarNavItem>
              <SidebarNavItem onClick={onLock}>
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Lock App
                </span>
              </SidebarNavItem>
            </div>
          }
        >
          <ContextList
            ongoingContexts={ongoingContexts}
            completedContexts={completedContexts}
            stalledContextIds={stalledContextIds}
            selectedContextId={selectedContextId}
            onSelectContext={handleSelectContext}
            onCreateContext={() => setIsCreateModalOpen(true)}
            onCalendarClick={handleCalendarClick}
            isCalendarActive={viewMode === 'calendar'}
          />
        </Sidebar>

        <main className="flex-1 overflow-hidden bg-white">
          {viewMode === 'calendar' ? (
            <CalendarView doc={doc} onSelectContext={handleSelectContext} />
          ) : selectedContext ? (
            <ContextDetail
              context={selectedContext}
              isStalled={stalledContextIds.has(selectedContext.id)}
              doc={doc}
              changeDoc={changeDoc}
              onToggleStatus={() => toggleContextStatus(selectedContext.id)}
              onDelete={() => handleDeleteContext(selectedContext.id)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-500">No context selected</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Select a context from the sidebar or create a new one.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateContextModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateContext={handleCreateContext}
      />
    </div>
  );
}

export default App;
