import { useState, useEffect, useCallback, useRef } from 'react';
import { type DocHandle, type DocumentId } from '@automerge/automerge-repo';
import { getRepo, getStoredDocId, setStoredDocId, createInitialDocument } from '@/lib/automerge';
import type { AppDocument } from '@/types';

interface UseAutomergeResult {
  doc: AppDocument | null;
  handle: DocHandle<AppDocument> | null;
  isLoading: boolean;
  error: Error | null;
  changeDoc: (changeFn: (doc: AppDocument) => void) => void;
}

export function useAutomerge(): UseAutomergeResult {
  const [doc, setDoc] = useState<AppDocument | null>(null);
  const [handle, setHandle] = useState<DocHandle<AppDocument> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const handleRef = useRef<DocHandle<AppDocument> | null>(null);

  useEffect(() => {
    const initializeDoc = async () => {
      try {
        const repo = getRepo();
        // Doc ID decryption is handled internally via the worker
        const storedDocId = await getStoredDocId();

        let docHandle: DocHandle<AppDocument>;

        if (storedDocId) {
          docHandle = await repo.find<AppDocument>(storedDocId as DocumentId);
        } else {
          docHandle = repo.create<AppDocument>(createInitialDocument());
          // Doc ID encryption is handled internally via the worker
          await setStoredDocId(docHandle.documentId);
        }

        handleRef.current = docHandle;
        setHandle(docHandle);

        // Wait for document to be ready
        await docHandle.whenReady();
        const initialDoc = docHandle.docSync();
        if (initialDoc) {
          setDoc(initialDoc);
        }

        // Subscribe to changes
        docHandle.on('change', ({ doc: updatedDoc }) => {
          setDoc(updatedDoc);
        });

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize document'));
        setIsLoading(false);
      }
    };

    initializeDoc();
  }, []);

  const changeDoc = useCallback((changeFn: (doc: AppDocument) => void) => {
    if (handleRef.current) {
      handleRef.current.change(changeFn);
    }
  }, []);

  return {
    doc,
    handle,
    isLoading,
    error,
    changeDoc,
  };
}
