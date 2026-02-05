import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Link, AppDocument } from '@/types';

interface UseLinksProps {
  contextId: string;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

interface UseLinksResult {
  links: Link[];
  addLink: (url: string, title: string, description?: string) => string;
  updateLink: (linkId: string, updates: Partial<Omit<Link, 'id' | 'addedAt'>>) => void;
  deleteLink: (linkId: string) => void;
}

export function useLinks({ contextId, doc, changeDoc }: UseLinksProps): UseLinksResult {
  const links = doc?.contexts[contextId]?.links ?? [];

  const addLink = useCallback(
    (url: string, title: string, description?: string): string => {
      const id = uuidv4();
      const now = new Date().toISOString();

      changeDoc((d) => {
        if (d.contexts[contextId]) {
          d.contexts[contextId].links.push({
            id,
            url,
            title,
            description,
            addedAt: now,
          });
          d.contexts[contextId].updatedAt = now;
        }
      });

      return id;
    },
    [contextId, changeDoc]
  );

  const updateLink = useCallback(
    (linkId: string, updates: Partial<Omit<Link, 'id' | 'addedAt'>>) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const linkIndex = d.contexts[contextId].links.findIndex((link) => link.id === linkId);
          if (linkIndex !== -1) {
            Object.assign(d.contexts[contextId].links[linkIndex], updates);
            d.contexts[contextId].updatedAt = new Date().toISOString();
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  const deleteLink = useCallback(
    (linkId: string) => {
      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const linkIndex = d.contexts[contextId].links.findIndex((link) => link.id === linkId);
          if (linkIndex !== -1) {
            d.contexts[contextId].links.splice(linkIndex, 1);
            d.contexts[contextId].updatedAt = new Date().toISOString();
          }
        }
      });
    },
    [contextId, changeDoc]
  );

  return {
    links,
    addLink,
    updateLink,
    deleteLink,
  };
}
