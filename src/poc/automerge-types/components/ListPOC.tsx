import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import type { POCDocument, TodoItem } from '../types/poc-document';
import { useTwoUserSimulation } from '../hooks/useTwoUserSimulation';
import { TwoUserSimulator } from './TwoUserSimulator';

type InsertPosition = 'beginning' | 'end' | 'at-index';

interface ListPOCProps {
  doc: POCDocument;
  changeDoc: (fn: (d: POCDocument) => void) => void;
}

export function ListPOC({ doc, changeDoc }: ListPOCProps) {
  const [newItemText, setNewItemText] = useState('');
  const [insertPosition, setInsertPosition] = useState<InsertPosition>('end');
  const [insertIndex, setInsertIndex] = useState(0);

  const simulation = useTwoUserSimulation<POCDocument>();

  const createTodoItem = (text: string): TodoItem => ({
    id: uuid(),
    text,
    done: false,
    createdAt: new Date().toISOString(),
  });

  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    const item = createTodoItem(newItemText.trim());

    changeDoc((d) => {
      switch (insertPosition) {
        case 'beginning':
          d.todoList.unshift(item);
          break;
        case 'end':
          d.todoList.push(item);
          break;
        case 'at-index': {
          const idx = Math.max(0, Math.min(insertIndex, d.todoList.length));
          d.todoList.splice(idx, 0, item);
          break;
        }
      }
    });

    setNewItemText('');
  };

  const handleToggleDone = (itemId: string) => {
    changeDoc((d) => {
      const item = d.todoList.find((i) => i.id === itemId);
      if (item) {
        item.done = !item.done;
      }
    });
  };

  const handleDeleteItem = (itemId: string) => {
    changeDoc((d) => {
      const index = d.todoList.findIndex((i) => i.id === itemId);
      if (index !== -1) {
        d.todoList.splice(index, 1);
      }
    });
  };

  const renderTodoItem = (item: TodoItem, onToggle: () => void, onDelete: () => void) => (
    <div
      key={item.id}
      className={cn(
        'flex items-center gap-3 rounded-md border p-3',
        item.done ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
      )}
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={onToggle}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', item.done && 'line-through text-gray-500')}>
          {item.text}
        </p>
        <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
      </div>
      <Button variant="danger" size="sm" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );

  const renderTodoList = (
    items: TodoItem[],
    onToggle: (id: string) => void,
    onDelete: (id: string) => void
  ) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No items in list</p>
      ) : (
        items.map((item) =>
          renderTodoItem(
            item,
            () => onToggle(item.id),
            () => onDelete(item.id)
          )
        )
      )}
    </div>
  );

  const renderDocState = (d: POCDocument) => (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">Length: {d.todoList.length} items</div>
      <div className="max-h-40 overflow-auto">
        {d.todoList.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Empty list</p>
        ) : (
          <ul className="space-y-1">
            {d.todoList.map((item, idx) => (
              <li
                key={item.id}
                className={cn(
                  'text-xs p-1 rounded',
                  item.done ? 'bg-gray-100 line-through text-gray-500' : 'bg-white'
                )}
              >
                {idx}. {item.text} {item.done ? '(done)' : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Show JSON</summary>
        <pre className="mt-1 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs">
          {JSON.stringify(d.todoList, null, 2)}
        </pre>
      </details>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">List POC</h3>
        <p className="text-sm text-gray-500">
          Demonstrates Automerge list operations with todo items
        </p>
      </div>

      {/* Add Item Form */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-700">Add New Item</h4>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              placeholder="Enter todo text..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Position</label>
            <select
              value={insertPosition}
              onChange={(e) => setInsertPosition(e.target.value as InsertPosition)}
              className="h-10 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginning">Beginning</option>
              <option value="end">End</option>
              <option value="at-index">At Index</option>
            </select>
          </div>
          {insertPosition === 'at-index' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Index</label>
              <input
                type="number"
                min={0}
                max={doc.todoList.length}
                value={insertIndex}
                onChange={(e) => setInsertIndex(parseInt(e.target.value) || 0)}
                className="h-10 w-20 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <Button onClick={handleAddItem} disabled={!newItemText.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Current Todo List */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-700">Todo List</h4>
          <span className="text-xs text-gray-500">
            {doc.todoList.filter((i) => !i.done).length} pending,{' '}
            {doc.todoList.filter((i) => i.done).length} done
          </span>
        </div>
        {renderTodoList(doc.todoList, handleToggleDone, handleDeleteItem)}
      </div>

      {/* JSON Display */}
      <details className="rounded-lg border border-gray-200 p-4">
        <summary className="cursor-pointer font-medium text-gray-700">
          Document State (JSON)
        </summary>
        <pre className="mt-3 max-h-48 overflow-auto rounded bg-gray-50 p-3 text-xs">
          {JSON.stringify(doc.todoList, null, 2)}
        </pre>
      </details>

      {/* Two-User Simulation */}
      <div className="rounded-lg border border-gray-200 p-4">
        <TwoUserSimulator<POCDocument>
          isSimulating={simulation.state.isSimulating}
          userADoc={simulation.state.userA?.doc ?? null}
          userBDoc={simulation.state.userB?.doc ?? null}
          mergedDoc={simulation.state.mergedDoc}
          mergeComplete={simulation.state.mergeComplete}
          onStartSimulation={() => simulation.startSimulation(doc)}
          onMerge={simulation.merge}
          onReset={simulation.reset}
          renderUserAControls={(userDoc) => (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">User A adds item at beginning</p>
              <Button
                size="sm"
                onClick={() => {
                  simulation.updateUserA((d) => {
                    d.todoList.unshift(createTodoItem('User A item (beginning)'));
                  });
                }}
              >
                Add at Beginning
              </Button>
              {userDoc.todoList.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-2">Or delete first item</p>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      simulation.updateUserA((d) => {
                        if (d.todoList.length > 0) {
                          d.todoList.splice(0, 1);
                        }
                      });
                    }}
                  >
                    Delete First
                  </Button>
                </>
              )}
            </div>
          )}
          renderUserBControls={(userDoc) => (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">User B adds item at end</p>
              <Button
                size="sm"
                onClick={() => {
                  simulation.updateUserB((d) => {
                    d.todoList.push(createTodoItem('User B item (end)'));
                  });
                }}
              >
                Add at End
              </Button>
              {userDoc.todoList.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-2">Or toggle first item done</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      simulation.updateUserB((d) => {
                        if (d.todoList.length > 0) {
                          d.todoList[0].done = !d.todoList[0].done;
                        }
                      });
                    }}
                  >
                    Toggle First Done
                  </Button>
                </>
              )}
            </div>
          )}
          renderDocState={renderDocState}
        />
      </div>

      {/* Demonstration Notes */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <h4 className="font-medium mb-2">Two-User Simulation Demonstrations:</h4>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>
            <strong>Concurrent inserts:</strong> User A inserts at beginning, User B inserts at end.
            After merge, both items appear in their respective positions.
          </li>
          <li>
            <strong>Delete vs Update conflict:</strong> If User A deletes an item while User B
            toggles the same item, the update wins - the item remains but with the toggled state.
          </li>
        </ul>
      </div>
    </div>
  );
}
