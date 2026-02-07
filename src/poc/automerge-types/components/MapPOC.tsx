import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { TwoUserSimulator } from './TwoUserSimulator';
import { useTwoUserSimulation } from '../hooks/useTwoUserSimulation';
import type { POCDocument, NestedMapItem } from '../types/poc-document';

interface MapPOCProps {
  doc: POCDocument;
  changeDoc: (fn: (d: POCDocument) => void) => void;
}

export function MapPOC({ doc, changeDoc }: MapPOCProps) {
  // Simple map form state
  const [simpleKey, setSimpleKey] = useState('');
  const [simpleValue, setSimpleValue] = useState('');

  // Nested map form state
  const [nestedName, setNestedName] = useState('');
  const [nestedCount, setNestedCount] = useState('');
  const [nestedTags, setNestedTags] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCount, setEditCount] = useState('');
  const [editTags, setEditTags] = useState('');

  // Two-user simulation
  const simulation = useTwoUserSimulation<POCDocument>();

  // Simple map handlers
  const handleAddSimpleEntry = () => {
    if (!simpleKey.trim()) return;
    changeDoc((d) => {
      d.simpleMap[simpleKey.trim()] = simpleValue;
    });
    setSimpleKey('');
    setSimpleValue('');
  };

  const handleDeleteSimpleEntry = (key: string) => {
    changeDoc((d) => {
      delete d.simpleMap[key];
    });
  };

  // Nested map handlers
  const handleAddNestedEntry = () => {
    if (!nestedName.trim()) return;
    const id = uuid();
    const tags = nestedTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    changeDoc((d) => {
      d.nestedMap[id] = {
        name: nestedName.trim(),
        count: parseInt(nestedCount, 10) || 0,
        tags,
      };
    });
    setNestedName('');
    setNestedCount('');
    setNestedTags('');
  };

  const handleDeleteNestedEntry = (id: string) => {
    changeDoc((d) => {
      delete d.nestedMap[id];
    });
  };

  const handleStartEdit = (id: string, item: NestedMapItem) => {
    setEditingId(id);
    setEditName(item.name);
    setEditCount(item.count.toString());
    setEditTags(item.tags.join(', '));
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const tags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    changeDoc((d) => {
      d.nestedMap[editingId] = {
        name: editName.trim(),
        count: parseInt(editCount, 10) || 0,
        tags,
      };
    });
    setEditingId(null);
    setEditName('');
    setEditCount('');
    setEditTags('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCount('');
    setEditTags('');
  };

  // Simulation form state
  const [simKeyA, setSimKeyA] = useState('foo');
  const [simValueA, setSimValueA] = useState('value from A');
  const [simKeyB, setSimKeyB] = useState('bar');
  const [simValueB, setSimValueB] = useState('value from B');

  return (
    <div className="space-y-8">
      {/* Simple Map Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Simple Map (Record&lt;string, string&gt;)
        </h3>

        {/* Add/Update Form */}
        <div className="flex gap-2 items-end">
          <Input
            label="Key"
            value={simpleKey}
            onChange={(e) => setSimpleKey(e.target.value)}
            placeholder="Enter key"
            className="flex-1"
          />
          <Input
            label="Value"
            value={simpleValue}
            onChange={(e) => setSimpleValue(e.target.value)}
            placeholder="Enter value"
            className="flex-1"
          />
          <Button onClick={handleAddSimpleEntry} disabled={!simpleKey.trim()}>
            Add/Update
          </Button>
        </div>

        {/* Current entries table */}
        <div className="rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Key</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Value</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(doc.simpleMap).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-center text-gray-500 italic">
                    No entries yet
                  </td>
                </tr>
              ) : (
                Object.entries(doc.simpleMap).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-4 py-2 font-mono text-gray-900">{key}</td>
                    <td className="px-4 py-2 text-gray-700">{value}</td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSimpleEntry(key)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* JSON representation */}
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs font-medium text-gray-500 mb-1">JSON:</div>
          <pre className="text-xs text-gray-700 overflow-auto">
            {JSON.stringify(doc.simpleMap, null, 2)}
          </pre>
        </div>
      </section>

      {/* Nested Map Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Nested Map (Record&lt;string, NestedMapItem&gt;)
        </h3>

        {/* Add Form */}
        <div className="flex gap-2 items-end flex-wrap">
          <Input
            label="Name"
            value={nestedName}
            onChange={(e) => setNestedName(e.target.value)}
            placeholder="Item name"
            className="flex-1 min-w-[150px]"
          />
          <Input
            label="Count"
            type="number"
            value={nestedCount}
            onChange={(e) => setNestedCount(e.target.value)}
            placeholder="0"
            className="w-24"
          />
          <Input
            label="Tags (comma-separated)"
            value={nestedTags}
            onChange={(e) => setNestedTags(e.target.value)}
            placeholder="tag1, tag2"
            className="flex-1 min-w-[200px]"
          />
          <Button onClick={handleAddNestedEntry} disabled={!nestedName.trim()}>
            Add
          </Button>
        </div>

        {/* Current entries list */}
        <div className="space-y-2">
          {Object.entries(doc.nestedMap).length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-gray-500 italic">
              No nested entries yet
            </div>
          ) : (
            Object.entries(doc.nestedMap).map(([id, item]) => (
              <div
                key={id}
                className={cn(
                  'rounded-lg border border-gray-200 p-3',
                  editingId === id && 'border-blue-300 bg-blue-50'
                )}
              >
                {editingId === id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-end flex-wrap">
                      <Input
                        label="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 min-w-[150px]"
                      />
                      <Input
                        label="Count"
                        type="number"
                        value={editCount}
                        onChange={(e) => setEditCount(e.target.value)}
                        className="w-24"
                      />
                      <Input
                        label="Tags"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        className="flex-1 min-w-[200px]"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Count: {item.count}
                        {item.tags.length > 0 && (
                          <span className="ml-2">
                            Tags:{' '}
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs mr-1"
                              >
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-1">ID: {id}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStartEdit(id, item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteNestedEntry(id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* JSON representation */}
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs font-medium text-gray-500 mb-1">JSON:</div>
          <pre className="text-xs text-gray-700 overflow-auto max-h-48">
            {JSON.stringify(doc.nestedMap, null, 2)}
          </pre>
        </div>
      </section>

      {/* Two-User Simulation Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Two-User Merge Simulation</h3>
        <p className="text-sm text-gray-600">
          Demonstrates how Automerge handles concurrent map edits from different users.
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
              <div className="flex gap-2 items-end">
                <Input
                  label="Key"
                  value={simKeyA}
                  onChange={(e) => setSimKeyA(e.target.value)}
                  placeholder="foo"
                  className="flex-1"
                />
                <Input
                  label="Value"
                  value={simValueA}
                  onChange={(e) => setSimValueA(e.target.value)}
                  placeholder="value"
                  className="flex-1"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  simulation.updateUserA((d) => {
                    d.simpleMap[simKeyA] = simValueA;
                  });
                }}
                disabled={!simKeyA.trim()}
              >
                Add Entry
              </Button>
            </div>
          )}
          renderUserBControls={() => (
            <div className="space-y-2">
              <div className="flex gap-2 items-end">
                <Input
                  label="Key"
                  value={simKeyB}
                  onChange={(e) => setSimKeyB(e.target.value)}
                  placeholder="bar"
                  className="flex-1"
                />
                <Input
                  label="Value"
                  value={simValueB}
                  onChange={(e) => setSimValueB(e.target.value)}
                  placeholder="value"
                  className="flex-1"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  simulation.updateUserB((d) => {
                    d.simpleMap[simKeyB] = simValueB;
                  });
                }}
                disabled={!simKeyB.trim()}
              >
                Add Entry
              </Button>
            </div>
          )}
          renderDocState={(docState, label) => (
            <div className="rounded bg-white/50 p-2">
              <div className="text-xs font-medium text-gray-600 mb-1">{label} - simpleMap:</div>
              <pre className="text-xs text-gray-700 overflow-auto">
                {JSON.stringify(docState.simpleMap, null, 2)}
              </pre>
            </div>
          )}
        />

        {/* Explanation of merge behavior */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <div className="font-medium mb-2">How Automerge Merges Maps:</div>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>
              <strong>Different keys:</strong> Both entries are preserved (e.g., User A adds "foo",
              User B adds "bar" = both in merged result)
            </li>
            <li>
              <strong>Same key, different values:</strong> Automerge uses "last writer wins" based
              on actor IDs and timestamps
            </li>
            <li>
              <strong>Nested objects:</strong> Properties are merged recursively, allowing
              concurrent edits to different fields
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
