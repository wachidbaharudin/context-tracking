import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContexts } from './useContexts';
import {
  createMockDocument,
  createMockContext,
  createMockChangeDoc,
  createStalledDate,
  createRecentDate,
} from '@/test/helpers/mockAutomerge';
import type { AppDocument } from '@/types';

// Mock uuid to return predictable IDs
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123'),
}));

describe('useContexts', () => {
  let mockDoc: AppDocument;
  let mockChangeDoc: ReturnType<typeof createMockChangeDoc>;

  beforeEach(() => {
    mockDoc = createMockDocument();
    mockChangeDoc = createMockChangeDoc(mockDoc);
    vi.clearAllMocks();
  });

  // ==========================================
  // CREATE CONTEXT TESTS
  // ==========================================
  describe('createContext', () => {
    it('creates a context with required name only', () => {
      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      let newId: string;
      act(() => {
        newId = result.current.createContext('My New Context');
      });

      expect(newId!).toBe('mock-uuid-123');
      expect(mockDoc.contexts['mock-uuid-123']).toBeDefined();
      expect(mockDoc.contexts['mock-uuid-123'].name).toBe('My New Context');
      expect(mockDoc.contexts['mock-uuid-123'].status).toBe('ongoing');
      expect(mockDoc.contexts['mock-uuid-123'].actionItems).toEqual([]);
      expect(mockDoc.contexts['mock-uuid-123'].links).toEqual([]);
    });

    it('creates a context with all optional fields', () => {
      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.createContext('Full Context', 'A detailed description', '#FF5733');
      });

      const context = mockDoc.contexts['mock-uuid-123'];
      expect(context.name).toBe('Full Context');
      expect(context.description).toBe('A detailed description');
      expect(context.color).toBe('#FF5733');
    });

    it('returns the new context id', () => {
      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      let newId: string;
      act(() => {
        newId = result.current.createContext('Test');
      });

      expect(newId!).toBe('mock-uuid-123');
    });

    it('sets initial status to ongoing', () => {
      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.createContext('Test');
      });

      expect(mockDoc.contexts['mock-uuid-123'].status).toBe('ongoing');
    });

    it('initializes empty actionItems and links arrays', () => {
      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.createContext('Test');
      });

      expect(mockDoc.contexts['mock-uuid-123'].actionItems).toEqual([]);
      expect(mockDoc.contexts['mock-uuid-123'].links).toEqual([]);
    });

    it('sets createdAt and updatedAt timestamps', () => {
      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      const before = new Date().toISOString();
      act(() => {
        result.current.createContext('Test');
      });
      const after = new Date().toISOString();

      const context = mockDoc.contexts['mock-uuid-123'];
      expect(context.createdAt >= before).toBe(true);
      expect(context.createdAt <= after).toBe(true);
      expect(context.updatedAt).toBe(context.createdAt);
    });
  });

  // ==========================================
  // UPDATE CONTEXT TESTS
  // ==========================================
  describe('updateContext', () => {
    it('updates context name', () => {
      const existingContext = createMockContext({ id: 'ctx-1', name: 'Original' });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.updateContext('ctx-1', { name: 'Updated Name' });
      });

      expect(mockDoc.contexts['ctx-1'].name).toBe('Updated Name');
    });

    it('updates context description', () => {
      const existingContext = createMockContext({ id: 'ctx-1', description: 'Old description' });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.updateContext('ctx-1', { description: 'New description' });
      });

      expect(mockDoc.contexts['ctx-1'].description).toBe('New description');
    });

    it('updates context color', () => {
      const existingContext = createMockContext({ id: 'ctx-1', color: '#000000' });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.updateContext('ctx-1', { color: '#FFFFFF' });
      });

      expect(mockDoc.contexts['ctx-1'].color).toBe('#FFFFFF');
    });

    it('updates context status', () => {
      const existingContext = createMockContext({ id: 'ctx-1', status: 'ongoing' });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.updateContext('ctx-1', { status: 'completed' });
      });

      expect(mockDoc.contexts['ctx-1'].status).toBe('completed');
    });

    it('updates updatedAt timestamp on change', () => {
      const oldDate = '2020-01-01T00:00:00.000Z';
      const existingContext = createMockContext({
        id: 'ctx-1',
        updatedAt: oldDate,
        createdAt: oldDate,
      });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.updateContext('ctx-1', { name: 'Updated' });
      });

      expect(mockDoc.contexts['ctx-1'].updatedAt).not.toBe(oldDate);
      expect(new Date(mockDoc.contexts['ctx-1'].updatedAt).getTime()).toBeGreaterThan(
        new Date(oldDate).getTime()
      );
    });

    it('does not modify createdAt', () => {
      const originalCreatedAt = '2020-01-01T00:00:00.000Z';
      const existingContext = createMockContext({ id: 'ctx-1', createdAt: originalCreatedAt });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.updateContext('ctx-1', { name: 'Updated' });
      });

      expect(mockDoc.contexts['ctx-1'].createdAt).toBe(originalCreatedAt);
    });

    it('handles partial updates', () => {
      const existingContext = createMockContext({
        id: 'ctx-1',
        name: 'Original Name',
        description: 'Original Description',
        color: '#FF0000',
      });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.updateContext('ctx-1', { name: 'Updated Name' });
      });

      expect(mockDoc.contexts['ctx-1'].name).toBe('Updated Name');
      expect(mockDoc.contexts['ctx-1'].description).toBe('Original Description');
      expect(mockDoc.contexts['ctx-1'].color).toBe('#FF0000');
    });

    it('handles non-existent context gracefully', () => {
      mockDoc = createMockDocument();
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      // Should not throw
      expect(() => {
        act(() => {
          result.current.updateContext('non-existent-id', { name: 'Test' });
        });
      }).not.toThrow();

      expect(mockDoc.contexts['non-existent-id']).toBeUndefined();
    });
  });

  // ==========================================
  // DELETE CONTEXT TESTS
  // ==========================================
  describe('deleteContext', () => {
    it('deletes a context by id', () => {
      const existingContext = createMockContext({ id: 'ctx-1' });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      expect(mockDoc.contexts['ctx-1']).toBeDefined();

      act(() => {
        result.current.deleteContext('ctx-1');
      });

      expect(mockDoc.contexts['ctx-1']).toBeUndefined();
    });

    it('handles non-existent context gracefully', () => {
      mockDoc = createMockDocument();
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      // Should not throw
      expect(() => {
        act(() => {
          result.current.deleteContext('non-existent-id');
        });
      }).not.toThrow();
    });

    it('only deletes the specified context', () => {
      const context1 = createMockContext({ id: 'ctx-1', name: 'Context 1' });
      const context2 = createMockContext({ id: 'ctx-2', name: 'Context 2' });
      mockDoc = createMockDocument({ 'ctx-1': context1, 'ctx-2': context2 });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.deleteContext('ctx-1');
      });

      expect(mockDoc.contexts['ctx-1']).toBeUndefined();
      expect(mockDoc.contexts['ctx-2']).toBeDefined();
      expect(mockDoc.contexts['ctx-2'].name).toBe('Context 2');
    });
  });

  // ==========================================
  // TOGGLE STATUS TESTS
  // ==========================================
  describe('toggleContextStatus', () => {
    it('toggles from ongoing to completed', () => {
      const existingContext = createMockContext({ id: 'ctx-1', status: 'ongoing' });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.toggleContextStatus('ctx-1');
      });

      expect(mockDoc.contexts['ctx-1'].status).toBe('completed');
    });

    it('toggles from completed to ongoing', () => {
      const existingContext = createMockContext({ id: 'ctx-1', status: 'completed' });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.toggleContextStatus('ctx-1');
      });

      expect(mockDoc.contexts['ctx-1'].status).toBe('ongoing');
    });

    it('updates updatedAt on toggle', () => {
      const oldDate = '2020-01-01T00:00:00.000Z';
      const existingContext = createMockContext({ id: 'ctx-1', updatedAt: oldDate });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      act(() => {
        result.current.toggleContextStatus('ctx-1');
      });

      expect(mockDoc.contexts['ctx-1'].updatedAt).not.toBe(oldDate);
    });

    it('handles non-existent context gracefully', () => {
      mockDoc = createMockDocument();
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      expect(() => {
        act(() => {
          result.current.toggleContextStatus('non-existent-id');
        });
      }).not.toThrow();
    });
  });

  // ==========================================
  // COMPUTED PROPERTIES TESTS
  // ==========================================
  describe('computed properties', () => {
    describe('contexts', () => {
      it('returns contexts sorted by updatedAt descending', () => {
        const context1 = createMockContext({
          id: 'ctx-1',
          name: 'Oldest',
          updatedAt: '2020-01-01T00:00:00.000Z',
        });
        const context2 = createMockContext({
          id: 'ctx-2',
          name: 'Middle',
          updatedAt: '2021-01-01T00:00:00.000Z',
        });
        const context3 = createMockContext({
          id: 'ctx-3',
          name: 'Newest',
          updatedAt: '2022-01-01T00:00:00.000Z',
        });
        mockDoc = createMockDocument({
          'ctx-1': context1,
          'ctx-2': context2,
          'ctx-3': context3,
        });
        mockChangeDoc = createMockChangeDoc(mockDoc);

        const { result } = renderHook(() =>
          useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
        );

        expect(result.current.contexts[0].name).toBe('Newest');
        expect(result.current.contexts[1].name).toBe('Middle');
        expect(result.current.contexts[2].name).toBe('Oldest');
      });

      it('returns empty array when doc is null', () => {
        const { result } = renderHook(() =>
          useContexts({ doc: null, changeDoc: mockChangeDoc.changeDoc })
        );

        expect(result.current.contexts).toEqual([]);
      });
    });

    describe('ongoingContexts', () => {
      it('filters only ongoing contexts', () => {
        const ongoing1 = createMockContext({ id: 'ctx-1', name: 'Ongoing 1', status: 'ongoing' });
        const completed = createMockContext({
          id: 'ctx-2',
          name: 'Completed',
          status: 'completed',
        });
        const ongoing2 = createMockContext({ id: 'ctx-3', name: 'Ongoing 2', status: 'ongoing' });
        mockDoc = createMockDocument({
          'ctx-1': ongoing1,
          'ctx-2': completed,
          'ctx-3': ongoing2,
        });
        mockChangeDoc = createMockChangeDoc(mockDoc);

        const { result } = renderHook(() =>
          useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
        );

        expect(result.current.ongoingContexts).toHaveLength(2);
        expect(result.current.ongoingContexts.every((c) => c.status === 'ongoing')).toBe(true);
      });
    });

    describe('completedContexts', () => {
      it('filters only completed contexts', () => {
        const ongoing = createMockContext({ id: 'ctx-1', name: 'Ongoing', status: 'ongoing' });
        const completed1 = createMockContext({
          id: 'ctx-2',
          name: 'Completed 1',
          status: 'completed',
        });
        const completed2 = createMockContext({
          id: 'ctx-3',
          name: 'Completed 2',
          status: 'completed',
        });
        mockDoc = createMockDocument({
          'ctx-1': ongoing,
          'ctx-2': completed1,
          'ctx-3': completed2,
        });
        mockChangeDoc = createMockChangeDoc(mockDoc);

        const { result } = renderHook(() =>
          useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
        );

        expect(result.current.completedContexts).toHaveLength(2);
        expect(result.current.completedContexts.every((c) => c.status === 'completed')).toBe(true);
      });
    });

    describe('stalledContextIds', () => {
      it('identifies stalled ongoing contexts', () => {
        const stalledContext = createMockContext({
          id: 'ctx-stalled',
          name: 'Stalled',
          status: 'ongoing',
          updatedAt: createStalledDate(),
        });
        const recentContext = createMockContext({
          id: 'ctx-recent',
          name: 'Recent',
          status: 'ongoing',
          updatedAt: createRecentDate(),
        });
        mockDoc = createMockDocument({
          'ctx-stalled': stalledContext,
          'ctx-recent': recentContext,
        });
        mockChangeDoc = createMockChangeDoc(mockDoc);

        const { result } = renderHook(() =>
          useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
        );

        expect(result.current.stalledContextIds.has('ctx-stalled')).toBe(true);
        expect(result.current.stalledContextIds.has('ctx-recent')).toBe(false);
      });

      it('does not mark completed contexts as stalled', () => {
        const stalledCompleted = createMockContext({
          id: 'ctx-1',
          name: 'Stalled Completed',
          status: 'completed',
          updatedAt: createStalledDate(),
        });
        mockDoc = createMockDocument({ 'ctx-1': stalledCompleted });
        mockChangeDoc = createMockChangeDoc(mockDoc);

        const { result } = renderHook(() =>
          useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
        );

        expect(result.current.stalledContextIds.has('ctx-1')).toBe(false);
      });
    });
  });

  // ==========================================
  // GET CONTEXT TESTS
  // ==========================================
  describe('getContext', () => {
    it('returns context by id', () => {
      const existingContext = createMockContext({ id: 'ctx-1', name: 'Find Me' });
      mockDoc = createMockDocument({ 'ctx-1': existingContext });
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      const context = result.current.getContext('ctx-1');
      expect(context).toBeDefined();
      expect(context?.name).toBe('Find Me');
    });

    it('returns undefined for non-existent id', () => {
      mockDoc = createMockDocument();
      mockChangeDoc = createMockChangeDoc(mockDoc);

      const { result } = renderHook(() =>
        useContexts({ doc: mockDoc, changeDoc: mockChangeDoc.changeDoc })
      );

      const context = result.current.getContext('non-existent');
      expect(context).toBeUndefined();
    });

    it('returns undefined when doc is null', () => {
      const { result } = renderHook(() =>
        useContexts({ doc: null, changeDoc: mockChangeDoc.changeDoc })
      );

      const context = result.current.getContext('any-id');
      expect(context).toBeUndefined();
    });
  });
});
