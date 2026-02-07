import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { TwoUserSimulator } from './TwoUserSimulator';
import { useTwoUserSimulation } from '../hooks/useTwoUserSimulation';
import type { POCDocument } from '../types/poc-document';

interface TextPOCProps {
  doc: POCDocument;
  changeDoc: (fn: (d: POCDocument) => void) => void;
}

/**
 * TextPOC - Demonstrates collaborative text editing with Automerge
 *
 * Note: This POC uses a simple string type which results in last-write-wins behavior.
 * In a real Automerge implementation, you would use Automerge.Text which provides
 * character-level CRDT operations allowing concurrent edits to merge properly.
 */
export function TextPOC({ doc, changeDoc }: TextPOCProps) {
  const [appendText, setAppendText] = useState('');
  const [prependText, setPrependText] = useState('');
  const [userAInput, setUserAInput] = useState('Hello');
  const [userBInput, setUserBInput] = useState('World');

  const simulation = useTwoUserSimulation<POCDocument>();

  const handleTextChange = (value: string) => {
    changeDoc((d) => {
      d.plainText = value;
    });
  };

  const handleAppend = () => {
    if (!appendText.trim()) return;
    changeDoc((d) => {
      d.plainText = d.plainText + appendText;
    });
    setAppendText('');
  };

  const handlePrepend = () => {
    if (!prependText.trim()) return;
    changeDoc((d) => {
      d.plainText = prependText + d.plainText;
    });
    setPrependText('');
  };

  const handleClear = () => {
    changeDoc((d) => {
      d.plainText = '';
    });
  };

  return (
    <div className="space-y-6">
      {/* Educational Note */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h4 className="font-medium text-amber-800 mb-2">About Text in Automerge</h4>
        <p className="text-sm text-amber-700">
          This POC uses a simple string type, which means concurrent edits result in{' '}
          <strong>last-write-wins</strong> behavior for the entire string. In a real Automerge
          implementation, you would use{' '}
          <code className="bg-amber-100 px-1 rounded">Automerge.Text</code> which provides{' '}
          <strong>character-level CRDT operations</strong>. This allows concurrent edits at
          different positions to merge properly (e.g., User A types at the beginning while User B
          types at the end).
        </p>
      </div>

      {/* Text Editor Section */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Text Editor</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plain Text</label>
            <textarea
              value={doc.plainText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={cn(
                'w-full min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'resize-y'
              )}
              placeholder="Type your text here..."
            />
          </div>
          <div className="text-sm text-gray-500">
            Character count: <span className="font-medium">{doc.plainText.length}</span>
          </div>
        </div>
      </div>

      {/* Text Operations Section */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Text Operations</h3>
        <div className="space-y-4">
          {/* Append */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Text to append"
                value={appendText}
                onChange={(e) => setAppendText(e.target.value)}
                placeholder="Enter text..."
              />
            </div>
            <Button onClick={handleAppend} disabled={!appendText.trim()}>
              Append
            </Button>
          </div>

          {/* Prepend */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Text to prepend"
                value={prependText}
                onChange={(e) => setPrependText(e.target.value)}
                placeholder="Enter text..."
              />
            </div>
            <Button onClick={handlePrepend} disabled={!prependText.trim()}>
              Prepend
            </Button>
          </div>

          {/* Clear */}
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handleClear}>
              Clear Text
            </Button>
          </div>

          {/* Current Value Display */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-xs font-medium text-gray-500 mb-1">Current text value:</div>
            <div className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">
              {doc.plainText || <span className="text-gray-400 italic">(empty)</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Two-User Simulation Section */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Two-User Simulation</h3>
        <p className="text-sm text-gray-600 mb-4">
          Simulate two users making concurrent text changes. With string type (this POC), the merge
          will show last-write-wins behavior. Try having User A append "Hello" and User B append
          "World" to see the result.
        </p>

        <TwoUserSimulator<POCDocument>
          isSimulating={simulation.state.isSimulating}
          userADoc={simulation.state.userA?.doc ?? null}
          userBDoc={simulation.state.userB?.doc ?? null}
          mergedDoc={simulation.state.mergedDoc}
          mergeComplete={simulation.state.mergeComplete}
          onStartSimulation={() => simulation.startSimulation(doc)}
          onMerge={simulation.merge}
          onReset={simulation.reset}
          renderUserAControls={() => (
            <div className="space-y-2">
              <Input
                value={userAInput}
                onChange={(e) => setUserAInput(e.target.value)}
                placeholder="Text to append..."
              />
              <Button
                size="sm"
                onClick={() => {
                  simulation.updateUserA((d) => {
                    d.plainText = d.plainText + userAInput;
                  });
                }}
                disabled={!userAInput.trim()}
              >
                Append "{userAInput}"
              </Button>
            </div>
          )}
          renderUserBControls={() => (
            <div className="space-y-2">
              <Input
                value={userBInput}
                onChange={(e) => setUserBInput(e.target.value)}
                placeholder="Text to append..."
              />
              <Button
                size="sm"
                onClick={() => {
                  simulation.updateUserB((d) => {
                    d.plainText = d.plainText + userBInput;
                  });
                }}
                disabled={!userBInput.trim()}
              >
                Append "{userBInput}"
              </Button>
            </div>
          )}
          renderDocState={(simDoc) => (
            <div className="text-sm font-mono bg-white p-2 rounded border whitespace-pre-wrap break-words">
              {simDoc.plainText || <span className="text-gray-400 italic">(empty)</span>}
            </div>
          )}
        />
      </div>
    </div>
  );
}
