import { useState, useEffect, useCallback, useRef } from 'react';
import { type DocHandle, type DocumentId, Repo } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { type POCDocument, createInitialPOCDocument } from '../types';

const POC_DB_NAME = 'automerge-poc-db';
const POC_DOC_ID_KEY = 'automerge-poc-doc-id';

let pocRepo: Repo | null = null;

function getPOCRepo(): Repo {
  if (!pocRepo) {
    pocRepo = new Repo({
      storage: new IndexedDBStorageAdapter(POC_DB_NAME),
    });
  }
  return pocRepo;
}

function getStoredPOCDocId(): string | null {
  return localStorage.getItem(POC_DOC_ID_KEY);
}

function setStoredPOCDocId(docId: string): void {
  localStorage.setItem(POC_DOC_ID_KEY, docId);
}

export interface UsePOCDocumentResult {
  doc: POCDocument | null;
  handle: DocHandle<POCDocument> | null;
  isLoading: boolean;
  error: Error | null;
  changeDoc: (changeFn: (doc: POCDocument) => void) => void;
  resetDocument: () => void;
}

/**
 * Hook to manage POC document - separate from main app document
 */
export function usePOCDocument(): UsePOCDocumentResult {
  const [doc, setDoc] = useState<POCDocument | null>(null);
  const [handle, setHandle] = useState<DocHandle<POCDocument> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const handleRef = useRef<DocHandle<POCDocument> | null>(null);
  const initializeCountRef = useRef(0);

  // Initialize document on mount
  useEffect(() => {
    let isMounted = true;

    const initializeDoc = async () => {
      try {
        const repo = getPOCRepo();
        const storedDocId = getStoredPOCDocId();

        let docHandle: DocHandle<POCDocument>;

        if (storedDocId) {
          docHandle = await repo.find<POCDocument>(storedDocId as DocumentId);
        } else {
          docHandle = repo.create<POCDocument>(createInitialPOCDocument());
          setStoredPOCDocId(docHandle.documentId);
        }

        if (!isMounted) return;

        handleRef.current = docHandle;
        setHandle(docHandle);

        // Wait for document to be ready
        await docHandle.whenReady();

        if (!isMounted) return;

        const initialDoc = docHandle.docSync();
        if (initialDoc) {
          setDoc(initialDoc);
        }

        // Subscribe to changes
        docHandle.on('change', ({ doc: updatedDoc }) => {
          if (isMounted) {
            setDoc(updatedDoc);
          }
        });

        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize POC document'));
          setIsLoading(false);
        }
      }
    };

    initializeDoc();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeCountRef.current]);

  const changeDoc = useCallback((changeFn: (doc: POCDocument) => void) => {
    if (handleRef.current) {
      handleRef.current.change(changeFn);
    }
  }, []);

  const resetDocument = useCallback(() => {
    // Clear stored doc ID and trigger re-initialization
    localStorage.removeItem(POC_DOC_ID_KEY);
    setIsLoading(true);
    setDoc(null);
    setHandle(null);
    setError(null);
    handleRef.current = null;
    // Increment counter to trigger useEffect re-run
    initializeCountRef.current += 1;
    // Force a re-render by creating new state
    setIsLoading(true);

    // Re-run initialization
    const initializeDoc = async () => {
      try {
        const repo = getPOCRepo();
        const docHandle = repo.create<POCDocument>(createInitialPOCDocument());
        setStoredPOCDocId(docHandle.documentId);

        handleRef.current = docHandle;
        setHandle(docHandle);

        await docHandle.whenReady();

        const initialDoc = docHandle.docSync();
        if (initialDoc) {
          setDoc(initialDoc);
        }

        docHandle.on('change', ({ doc: updatedDoc }) => {
          setDoc(updatedDoc);
        });

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to reset POC document'));
        setIsLoading(false);
      }
    };

    initializeDoc();
  }, []);

  return {
    doc,
    handle,
    isLoading,
    error,
    changeDoc,
    resetDocument,
  };
}
