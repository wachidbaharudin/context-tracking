import { useState, useCallback } from 'react';
import * as Automerge from '@automerge/automerge';

export interface SimulatedUser<T> {
  id: 'A' | 'B';
  label: string;
  doc: T;
}

export interface TwoUserSimulationState<T> {
  isSimulating: boolean;
  userA: SimulatedUser<T> | null;
  userB: SimulatedUser<T> | null;
  mergedDoc: T | null;
  mergeComplete: boolean;
}

export interface UseTwoUserSimulationResult<T> {
  state: TwoUserSimulationState<T>;
  startSimulation: (currentDoc: T) => void;
  updateUserA: (changeFn: (doc: T) => void) => void;
  updateUserB: (changeFn: (doc: T) => void) => void;
  merge: () => void;
  reset: () => void;
}

/**
 * Hook to simulate two users making concurrent edits and merging
 * Uses Automerge.clone() to create independent copies and Automerge.merge() to combine
 */
export function useTwoUserSimulation<T>(): UseTwoUserSimulationResult<T> {
  const [state, setState] = useState<TwoUserSimulationState<T>>({
    isSimulating: false,
    userA: null,
    userB: null,
    mergedDoc: null,
    mergeComplete: false,
  });

  const startSimulation = useCallback((currentDoc: T) => {
    // Create two independent clones of the document
    // Each clone will have its own actor ID for tracking changes
    const docA = Automerge.clone(currentDoc as Automerge.Doc<T>);
    const docB = Automerge.clone(currentDoc as Automerge.Doc<T>);

    setState({
      isSimulating: true,
      userA: { id: 'A', label: 'User A', doc: docA },
      userB: { id: 'B', label: 'User B', doc: docB },
      mergedDoc: null,
      mergeComplete: false,
    });
  }, []);

  const updateUserA = useCallback((changeFn: (doc: T) => void) => {
    setState((prev) => {
      if (!prev.userA) return prev;

      const newDoc = Automerge.change(prev.userA.doc as Automerge.Doc<T>, changeFn);
      return {
        ...prev,
        userA: { ...prev.userA, doc: newDoc },
      };
    });
  }, []);

  const updateUserB = useCallback((changeFn: (doc: T) => void) => {
    setState((prev) => {
      if (!prev.userB) return prev;

      const newDoc = Automerge.change(prev.userB.doc as Automerge.Doc<T>, changeFn);
      return {
        ...prev,
        userB: { ...prev.userB, doc: newDoc },
      };
    });
  }, []);

  const merge = useCallback(() => {
    setState((prev) => {
      if (!prev.userA || !prev.userB) return prev;

      // Merge both documents - Automerge handles conflicts automatically
      const merged = Automerge.merge(
        Automerge.clone(prev.userA.doc as Automerge.Doc<T>),
        prev.userB.doc as Automerge.Doc<T>
      );

      return {
        ...prev,
        mergedDoc: merged,
        mergeComplete: true,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      isSimulating: false,
      userA: null,
      userB: null,
      mergedDoc: null,
      mergeComplete: false,
    });
  }, []);

  return {
    state,
    startSimulation,
    updateUserA,
    updateUserB,
    merge,
    reset,
  };
}
