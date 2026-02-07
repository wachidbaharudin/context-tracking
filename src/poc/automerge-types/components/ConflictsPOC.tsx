import { useState } from 'react';
import * as Automerge from '@automerge/automerge';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { useTwoUserSimulation } from '../hooks/useTwoUserSimulation';
import { TwoUserSimulator } from './TwoUserSimulator';
import type { POCDocument } from '../types/poc-document';

interface ConflictsPOCProps {
  doc: POCDocument;
  changeDoc: (fn: (d: POCDocument) => void) => void;
}

interface ConflictInfo {
  field: string;
  winningValue: string | number;
  conflicts: Record<string, string | number>;
}

/**
 * Detects conflicts in the merged document's conflictDemo field
 */
function detectConflicts(doc: POCDocument): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  // Check for title conflicts
  const titleConflicts = Automerge.getConflicts(doc.conflictDemo, 'title');
  if (titleConflicts) {
    conflicts.push({
      field: 'title',
      winningValue: doc.conflictDemo.title,
      conflicts: titleConflicts as Record<string, string>,
    });
  }

  // Check for priority conflicts
  const priorityConflicts = Automerge.getConflicts(doc.conflictDemo, 'priority');
  if (priorityConflicts) {
    conflicts.push({
      field: 'priority',
      winningValue: doc.conflictDemo.priority,
      conflicts: priorityConflicts as Record<string, number>,
    });
  }

  return conflicts;
}

export function ConflictsPOC({ doc, changeDoc }: ConflictsPOCProps) {
  const [titleInput, setTitleInput] = useState(doc.conflictDemo.title);
  const [priorityInput, setPriorityInput] = useState(doc.conflictDemo.priority);

  const simulation = useTwoUserSimulation<POCDocument>();
  const { state, startSimulation, updateUserA, updateUserB, merge, reset } = simulation;

  // Detect conflicts in the merged document
  const mergedConflicts = state.mergedDoc ? detectConflicts(state.mergedDoc) : [];

  const handleUpdate = () => {
    changeDoc((d) => {
      d.conflictDemo.title = titleInput;
      d.conflictDemo.priority = priorityInput;
    });
  };

  const handleStartSimulation = () => {
    startSimulation(doc);
  };

  const handleUserAChange = () => {
    updateUserA((d) => {
      d.conflictDemo.title = 'Title from A';
      d.conflictDemo.priority = 1;
    });
  };

  const handleUserBChange = () => {
    updateUserB((d) => {
      d.conflictDemo.title = 'Title from B';
      d.conflictDemo.priority = 5;
    });
  };

  const handleResolveConflict = (field: 'title' | 'priority', value: string | number) => {
    changeDoc((d) => {
      if (field === 'title') {
        d.conflictDemo.title = value as string;
      } else {
        d.conflictDemo.priority = value as number;
      }
    });
    // Reset simulation after resolving
    reset();
  };

  const renderDocState = (docState: POCDocument) => (
    <div className="space-y-1 text-sm">
      <div>
        <span className="text-gray-500">Title:</span>{' '}
        <span className="font-mono">{docState.conflictDemo.title}</span>
      </div>
      <div>
        <span className="text-gray-500">Priority:</span>{' '}
        <span className="font-mono">{docState.conflictDemo.priority}</span>
      </div>
    </div>
  );

  const renderUserAControls = () => (
    <Button size="sm" onClick={handleUserAChange} className="w-full">
      Set title="Title from A", priority=1
    </Button>
  );

  const renderUserBControls = () => (
    <Button size="sm" onClick={handleUserBChange} className="w-full">
      Set title="Title from B", priority=5
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Educational Header */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-semibold text-amber-800 mb-2">About Conflicts in Automerge</h3>
        <div className="text-sm text-amber-700 space-y-2">
          <p>
            When two users concurrently modify the same field, Automerge uses{' '}
            <strong>Last Writer Wins (LWW)</strong> to automatically pick a winner. However, "last"
            doesn't mean wall clock time - it's based on the <strong>operation ID</strong>, which is
            deterministically ordered.
          </p>
          <p>
            The "losing" values aren't lost! You can access them via{' '}
            <code className="bg-amber-100 px-1 rounded">Automerge.getConflicts()</code> and let
            users manually resolve conflicts if needed.
          </p>
        </div>
      </div>

      {/* Current State Display */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Current State</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500 mb-1">Title</div>
            <div className="font-mono text-lg">{doc.conflictDemo.title}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500 mb-1">Priority</div>
            <div className="font-mono text-lg">{doc.conflictDemo.priority}</div>
          </div>
        </div>

        {/* Update Form */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Enter title"
            />
          </div>
          <div className="w-32">
            <Input
              label="Priority"
              type="number"
              value={priorityInput}
              onChange={(e) => setPriorityInput(Number(e.target.value))}
              min={1}
              max={10}
            />
          </div>
          <Button onClick={handleUpdate}>Update</Button>
        </div>
      </div>

      {/* Two-User Simulation */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Conflict Simulation</h3>
        <TwoUserSimulator<POCDocument>
          isSimulating={state.isSimulating}
          userADoc={state.userA?.doc ?? null}
          userBDoc={state.userB?.doc ?? null}
          mergedDoc={state.mergedDoc}
          mergeComplete={state.mergeComplete}
          onStartSimulation={handleStartSimulation}
          onMerge={merge}
          onReset={reset}
          renderUserAControls={renderUserAControls}
          renderUserBControls={renderUserBControls}
          renderDocState={renderDocState}
        />
      </div>

      {/* Conflict Detection Panel */}
      {state.mergeComplete && mergedConflicts.length > 0 && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Conflicts Detected!
          </h3>
          <p className="text-sm text-red-700 mb-4">
            The following fields have conflicting values from concurrent edits. Automerge
            automatically picked a winner, but you can see all values below.
          </p>

          <div className="space-y-4">
            {mergedConflicts.map((conflict) => (
              <div key={conflict.field} className="bg-white rounded-lg border border-red-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">
                    Field: <code className="bg-gray-100 px-1 rounded">{conflict.field}</code>
                  </span>
                  <span className="text-sm text-green-600 font-medium">
                    Winner: {String(conflict.winningValue)}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-medium mb-1">All conflicting values:</div>
                  <div className="space-y-1">
                    {Object.entries(conflict.conflicts).map(([opId, value]) => (
                      <div
                        key={opId}
                        className={cn(
                          'flex justify-between items-center px-2 py-1 rounded',
                          value === conflict.winningValue
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        <span className="font-mono text-xs truncate max-w-[200px]">{opId}</span>
                        <span className="font-medium">
                          {String(value)}
                          {value === conflict.winningValue && ' (winner)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {Object.entries(conflict.conflicts).map(([opId, value]) => (
                    <Button
                      key={opId}
                      size="sm"
                      variant={value === conflict.winningValue ? 'secondary' : 'primary'}
                      onClick={() =>
                        handleResolveConflict(conflict.field as 'title' | 'priority', value)
                      }
                    >
                      Use "{String(value)}"
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Conflicts Message */}
      {state.mergeComplete && mergedConflicts.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-800 mb-2">No Conflicts</h3>
          <p className="text-sm text-green-700">
            The merge completed without any conflicts. This can happen if:
          </p>
          <ul className="text-sm text-green-700 list-disc list-inside mt-2">
            <li>Users edited different fields</li>
            <li>Only one user made changes</li>
            <li>The conflict was already resolved</li>
          </ul>
        </div>
      )}

      {/* Technical Details */}
      <details className="rounded-lg border border-gray-200 p-4">
        <summary className="font-semibold text-gray-800 cursor-pointer">
          Technical Details: How LWW Works
        </summary>
        <div className="mt-3 text-sm text-gray-600 space-y-2">
          <p>
            <strong>Operation IDs:</strong> Each change in Automerge gets a unique operation ID that
            includes the actor ID (unique per client) and a sequence number. When merging, Automerge
            compares these IDs lexicographically.
          </p>
          <p>
            <strong>Deterministic Winner:</strong> The winner is always the same regardless of merge
            order. If User A and User B both edit the same field, merging A→B or B→A produces the
            same result.
          </p>
          <p>
            <strong>getConflicts():</strong> Returns an object mapping operation IDs to their
            values. If there's no conflict, it returns <code>undefined</code>.
          </p>
          <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs">
            {`// Example usage:
import * as Automerge from '@automerge/automerge';

const conflicts = Automerge.getConflicts(doc.conflictDemo, 'title');
// Returns: { '1@abc123': 'Title from A', '2@def456': 'Title from B' }
// or undefined if no conflict`}
          </pre>
        </div>
      </details>
    </div>
  );
}
