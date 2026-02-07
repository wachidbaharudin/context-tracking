import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { usePOCDocument } from './hooks';
import { MapPOC, ListPOC, TextPOC, RichTextPOC, ConflictsPOC } from './components';

type POCTab = 'map' | 'list' | 'text' | 'richtext' | 'conflicts';

interface TabConfig {
  id: POCTab;
  label: string;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'map', label: 'Map', description: 'Key-value pairs and nested objects' },
  { id: 'list', label: 'List', description: 'Ordered arrays with insert/delete' },
  { id: 'text', label: 'Text', description: 'Collaborative plain text' },
  { id: 'richtext', label: 'Rich Text', description: 'Formatted text with marks' },
  { id: 'conflicts', label: 'Conflicts', description: 'Conflict detection demo' },
];

interface POCDashboardProps {
  onBack: () => void;
}

export function POCDashboard({ onBack }: POCDashboardProps) {
  const [activeTab, setActiveTab] = useState<POCTab>('map');
  const { doc, isLoading, error, changeDoc, resetDocument } = usePOCDocument();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading POC Document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading POC document</p>
          <p className="mt-1 text-sm text-gray-600">{error.message}</p>
          <Button onClick={resetDocument} className="mt-4">
            Reset Document
          </Button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (!doc) return null;

    switch (activeTab) {
      case 'map':
        return <MapPOC doc={doc} changeDoc={changeDoc} />;
      case 'list':
        return <ListPOC doc={doc} changeDoc={changeDoc} />;
      case 'text':
        return <TextPOC doc={doc} changeDoc={changeDoc} />;
      case 'richtext':
        return <RichTextPOC doc={doc} changeDoc={changeDoc} />;
      case 'conflicts':
        return <ConflictsPOC doc={doc} changeDoc={changeDoc} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Automerge Data Types POC</h1>
            <p className="text-sm text-gray-500 mt-1">
              Explore different Automerge data types and their merge behavior
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={resetDocument}>
              Reset Document
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back to App
            </Button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="border-b border-gray-200 bg-gray-50 px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab description */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-2">
        <p className="text-sm text-blue-700">{TABS.find((t) => t.id === activeTab)?.description}</p>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">{renderTabContent()}</main>

      {/* Footer with raw document state */}
      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-3">
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
            View raw POC document state
          </summary>
          <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-auto max-h-48 text-xs">
            {JSON.stringify(doc, null, 2)}
          </pre>
        </details>
      </footer>
    </div>
  );
}
