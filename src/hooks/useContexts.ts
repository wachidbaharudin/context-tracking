import { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Context, AppDocument } from '@/types';
import { isStalled } from '@/lib/utils';

interface UseContextsProps {
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

interface UseContextsResult {
  contexts: Context[];
  ongoingContexts: Context[];
  completedContexts: Context[];
  stalledContextIds: Set<string>;
  getContext: (id: string) => Context | undefined;
  createContext: (name: string, description?: string, color?: string) => string;
  updateContext: (id: string, updates: Partial<Omit<Context, 'id' | 'createdAt'>>) => void;
  deleteContext: (id: string) => void;
  toggleContextStatus: (id: string) => void;
}

export function useContexts({ doc, changeDoc }: UseContextsProps): UseContextsResult {
  const contexts = useMemo(() => {
    if (!doc) return [];
    return Object.values(doc.contexts).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [doc]);

  const ongoingContexts = useMemo(() => contexts.filter((c) => c.status === 'ongoing'), [contexts]);

  const completedContexts = useMemo(
    () => contexts.filter((c) => c.status === 'completed'),
    [contexts]
  );

  const stalledContextIds = useMemo(() => {
    const stalled = new Set<string>();
    contexts.forEach((c) => {
      if (c.status === 'ongoing' && isStalled(c.updatedAt)) {
        stalled.add(c.id);
      }
    });
    return stalled;
  }, [contexts]);

  const getContext = useCallback(
    (id: string) => {
      return doc?.contexts[id];
    },
    [doc]
  );

  const createContext = useCallback(
    (name: string, description?: string, color?: string): string => {
      const id = uuidv4();
      const now = new Date().toISOString();

      changeDoc((d) => {
        d.contexts[id] = {
          id,
          name,
          status: 'ongoing',
          actionItems: [],
          links: [],
          createdAt: now,
          updatedAt: now,
        };
        // Only set optional fields if they have values (Automerge doesn't allow undefined)
        if (description) {
          d.contexts[id].description = description;
        }
        if (color) {
          d.contexts[id].color = color;
        }
      });

      return id;
    },
    [changeDoc]
  );

  const updateContext = useCallback(
    (id: string, updates: Partial<Omit<Context, 'id' | 'createdAt'>>) => {
      changeDoc((d) => {
        if (d.contexts[id]) {
          Object.assign(d.contexts[id], {
            ...updates,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    },
    [changeDoc]
  );

  const deleteContext = useCallback(
    (id: string) => {
      changeDoc((d) => {
        delete d.contexts[id];
      });
    },
    [changeDoc]
  );

  const toggleContextStatus = useCallback(
    (id: string) => {
      changeDoc((d) => {
        if (d.contexts[id]) {
          const currentStatus = d.contexts[id].status;
          d.contexts[id].status = currentStatus === 'ongoing' ? 'completed' : 'ongoing';
          d.contexts[id].updatedAt = new Date().toISOString();
        }
      });
    },
    [changeDoc]
  );

  return {
    contexts,
    ongoingContexts,
    completedContexts,
    stalledContextIds,
    getContext,
    createContext,
    updateContext,
    deleteContext,
    toggleContextStatus,
  };
}
