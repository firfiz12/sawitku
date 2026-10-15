import { useState, useCallback } from 'react';

export type UndoAction<T> =
  | { type: 'CREATE'; item: T }
  | { type: 'UPDATE'; prev: T; next: T }
  | { type: 'DELETE'; item: T };

export function useTableUndoRedo<T extends { id: string }>(
  onSave: (item: T) => Promise<unknown>,
  onDelete: (id: string) => Promise<unknown>,
  onReload: () => Promise<void>
) {
  const [undoStack, setUndoStack] = useState<UndoAction<T>[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction<T>[]>([]);

  const recordCreate = useCallback((item: T) => {
    setUndoStack((prev) => [...prev, { type: 'CREATE', item }]);
    setRedoStack([]);
  }, []);

  const recordUpdate = useCallback((prevItem: T, nextItem: T) => {
    setUndoStack((prev) => [...prev, { type: 'UPDATE', prev: prevItem, next: nextItem }]);
    setRedoStack([]);
  }, []);

  const recordDelete = useCallback((item: T) => {
    setUndoStack((prev) => [...prev, { type: 'DELETE', item }]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    try {
      if (action.type === 'CREATE') {
        await onDelete(action.item.id);
      } else if (action.type === 'DELETE') {
        await onSave(action.item);
      } else if (action.type === 'UPDATE') {
        await onSave(action.prev);
      }
      setRedoStack((prev) => [...prev, action]);
      await onReload();
    } catch (err) {
      console.error('Failed to undo action:', err);
    }
  }, [undoStack, onDelete, onSave, onReload]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));

    try {
      if (action.type === 'CREATE') {
        await onSave(action.item);
      } else if (action.type === 'DELETE') {
        await onDelete(action.item.id);
      } else if (action.type === 'UPDATE') {
        await onSave(action.next);
      }
      setUndoStack((prev) => [...prev, action]);
      await onReload();
    } catch (err) {
      console.error('Failed to redo action:', err);
    }
  }, [redoStack, onDelete, onSave, onReload]);

  return {
    recordCreate,
    recordUpdate,
    recordDelete,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
