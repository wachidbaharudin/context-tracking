import { Repo } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import type { AppDocument } from '@/types';

const DB_NAME = 'context-tracking-db';
const DOC_ID_KEY = 'context-tracking-doc-id';

let repo: Repo | null = null;

export function getRepo(): Repo {
  if (!repo) {
    repo = new Repo({
      storage: new IndexedDBStorageAdapter(DB_NAME),
    });
  }
  return repo;
}

export function getStoredDocId(): string | null {
  return localStorage.getItem(DOC_ID_KEY);
}

export function setStoredDocId(docId: string): void {
  localStorage.setItem(DOC_ID_KEY, docId);
}

export function createInitialDocument(): AppDocument {
  return {
    contexts: {},
    settings: {
      theme: 'light',
      defaultView: 'list',
    },
  };
}
