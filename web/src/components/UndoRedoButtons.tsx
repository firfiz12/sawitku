import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';

interface UndoRedoButtonsProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  entityName?: string;
}

export const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {},
  entityName = 'data',
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#f1f5f9',
        borderRadius: '10px',
        padding: '3px',
        gap: '2px',
        border: '1px solid #e2e8f0',
      }}
    >
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title={canUndo ? `Batalkan perubahan ${entityName} (Undo)` : 'Tidak ada perubahan untuk dibatalkan'}
        className="btn btn-icon"
        style={{
          width: 32,
          height: 32,
          minHeight: 32,
          borderRadius: '7px',
          background: canUndo ? '#ffffff' : 'transparent',
          color: canUndo ? '#0f172a' : '#94a3b8',
          border: canUndo ? '1px solid #cbd5e1' : 'none',
          boxShadow: canUndo ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <Undo2 size={15} />
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title={canRedo ? `Ulangi perubahan ${entityName} (Redo)` : 'Tidak ada perubahan untuk diulangi'}
        className="btn btn-icon"
        style={{
          width: 32,
          height: 32,
          minHeight: 32,
          borderRadius: '7px',
          background: canRedo ? '#ffffff' : 'transparent',
          color: canRedo ? '#0f172a' : '#94a3b8',
          border: canRedo ? '1px solid #cbd5e1' : 'none',
          boxShadow: canRedo ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          cursor: canRedo ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <Redo2 size={15} />
      </button>
    </div>
  );
};
