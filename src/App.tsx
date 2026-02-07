import { useState } from 'react';
import { useAutomerge, useContexts, useOnlineStatus } from '@/hooks';
import { ContextList, ContextDetail, CreateContextModal } from '@/components/features/contexts';
import { POCDashboard } from '@/poc';

function App() {
  const { doc, isLoading, error, changeDoc } = useAutomerge();
  const isOnline = useOnlineStatus();
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showPOC, setShowPOC] = useState(false);

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
  };

  const handleDeleteContext = (id: string) => {
    if (confirm('Are you sure you want to delete this context?')) {
      deleteContext(id);
      if (selectedContextId === id) {
        setSelectedContextId(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
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
        </div>
      </div>
    );
  }

  // Show POC Dashboard when toggled
  if (showPOC) {
    return <POCDashboard onBack={() => setShowPOC(false)} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Online/Offline indicator */}
      {!isOnline && (
        <div className="bg-amber-100 text-amber-800 text-sm px-4 py-2 text-center">
          You are currently offline. Changes will be saved locally.
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 bg-gray-50 flex-shrink-0 flex flex-col">
          <ContextList
            ongoingContexts={ongoingContexts}
            completedContexts={completedContexts}
            stalledContextIds={stalledContextIds}
            selectedContextId={selectedContextId}
            onSelectContext={setSelectedContextId}
            onCreateContext={() => setIsCreateModalOpen(true)}
          />
          {/* POC Link */}
          <div className="mt-auto p-3 border-t border-gray-200">
            <button
              onClick={() => setShowPOC(true)}
              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Automerge POC
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-white">
          {selectedContext ? (
            <ContextDetail
              context={selectedContext}
              isStalled={stalledContextIds.has(selectedContext.id)}
              doc={doc}
              changeDoc={changeDoc}
              onToggleStatus={() => toggleContextStatus(selectedContext.id)}
              onDelete={() => handleDeleteContext(selectedContext.id)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No context selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a context from the sidebar or create a new one.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Context Modal */}
      <CreateContextModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateContext={handleCreateContext}
      />
    </div>
  );
}

export default App;
