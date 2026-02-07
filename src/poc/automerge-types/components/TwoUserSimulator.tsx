import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface UserPanelProps {
  userId: 'A' | 'B';
  label: string;
  children: ReactNode;
  className?: string;
}

function UserPanel({ userId, label, children, className }: UserPanelProps) {
  const colors = {
    A: 'border-blue-300 bg-blue-50',
    B: 'border-green-300 bg-green-50',
  };

  return (
    <div className={cn('rounded-lg border-2 p-6', colors[userId], className)}>
      <div className="mb-4 font-semibold text-sm">
        {label} ({userId === 'A' ? 'Blue' : 'Green'})
      </div>
      {children}
    </div>
  );
}

interface TwoUserSimulatorProps<T> {
  isSimulating: boolean;
  userADoc: T | null;
  userBDoc: T | null;
  mergedDoc: T | null;
  mergeComplete: boolean;
  onStartSimulation: () => void;
  onMerge: () => void;
  onReset: () => void;
  renderUserAControls: (doc: T) => ReactNode;
  renderUserBControls: (doc: T) => ReactNode;
  renderDocState: (doc: T, label: string) => ReactNode;
}

/**
 * Reusable component for simulating two users making concurrent edits
 */
export function TwoUserSimulator<T>({
  isSimulating,
  userADoc,
  userBDoc,
  mergedDoc,
  mergeComplete,
  onStartSimulation,
  onMerge,
  onReset,
  renderUserAControls,
  renderUserBControls,
  renderDocState,
}: TwoUserSimulatorProps<T>) {
  if (!isSimulating) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <h4 className="mb-3 font-medium text-gray-700">Two-User Simulation</h4>
        <p className="mb-5 text-sm text-gray-500">
          Fork the current document into two copies, make changes as different users, then merge to
          see how Automerge handles concurrent edits.
        </p>
        <Button onClick={onStartSimulation}>Start Simulation</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-700">Two-User Simulation</h4>
        <Button variant="secondary" size="sm" onClick={onReset}>
          Reset Simulation
        </Button>
      </div>

      {/* User panels side by side */}
      <div className="grid grid-cols-2 gap-6">
        {userADoc && (
          <UserPanel userId="A" label="User A">
            <div className="space-y-4">
              <div className="text-xs text-gray-600">Make changes as User A:</div>
              {renderUserAControls(userADoc)}
              <div className="mt-4 border-t pt-4">
                <div className="text-xs font-medium text-gray-500 mb-2">User A's state:</div>
                {renderDocState(userADoc, 'User A')}
              </div>
            </div>
          </UserPanel>
        )}

        {userBDoc && (
          <UserPanel userId="B" label="User B">
            <div className="space-y-4">
              <div className="text-xs text-gray-600">Make changes as User B:</div>
              {renderUserBControls(userBDoc)}
              <div className="mt-4 border-t pt-4">
                <div className="text-xs font-medium text-gray-500 mb-2">User B's state:</div>
                {renderDocState(userBDoc, 'User B')}
              </div>
            </div>
          </UserPanel>
        )}
      </div>

      {/* Merge button */}
      {!mergeComplete && (
        <div className="flex justify-center py-2">
          <Button onClick={onMerge} className="px-8">
            Merge Changes
          </Button>
        </div>
      )}

      {/* Merged result */}
      {mergeComplete && mergedDoc && (
        <div className="rounded-lg border-2 border-purple-300 bg-purple-50 p-6">
          <div className="mb-3 font-semibold text-sm text-purple-700">Merged Result</div>
          {renderDocState(mergedDoc, 'Merged')}
        </div>
      )}
    </div>
  );
}
