import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Link, AppDocument } from '@/types';
import { validateUrl } from '@/lib/security/validate';

interface UseLinksProps {
  contextId: string;
  doc: AppDocument | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

interface UseLinksResult {
  links: Link[];
  addLink: (url: string, title: string, description?: string) => string | null;
  updateLink: (linkId: string, updates: Partial<Omit<Link, 'id' | 'addedAt'>>) => boolean;
  deleteLink: (linkId: string) => void;
}

export function useLinks({ contextId, doc, changeDoc }: UseLinksProps): UseLinksResult {
  const links = doc?.contexts[contextId]?.links ?? [];

  const addLink = useCallback(
    (url: string, title: string, description?: string): string | null => {
      const validation = validateUrl(url);
      if (!validation.valid || !validation.sanitizedUrl) {
        console.warn(`[Security] Rejected invalid URL: ${validation.error}`);
        return null;
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      changeDoc((d) => {
        if (d.contexts[contextId]) {
          d.contexts[contextId].links.push({
            id,
            url: validation.sanitizedUrl!,
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
    (linkId: string, updates: Partial<Omit<Link, 'id' | 'addedAt'>>): boolean => {
      // Validate URL if it's being updated
      if (updates.url !== undefined) {
        const validation = validateUrl(updates.url);
        if (!validation.valid || !validation.sanitizedUrl) {
          console.warn(`[Security] Rejected invalid URL update: ${validation.error}`);
          return false;
        }
        updates = { ...updates, url: validation.sanitizedUrl };
      }

      changeDoc((d) => {
        if (d.contexts[contextId]) {
          const linkIndex = d.contexts[contextId].links.findIndex((link) => link.id === linkId);
          if (linkIndex !== -1) {
            Object.assign(d.contexts[contextId].links[linkIndex], updates);
            d.contexts[contextId].updatedAt = new Date().toISOString();
          }
        }
      });
      return true;
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
