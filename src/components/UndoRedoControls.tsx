import {useTheme} from '../context/ThemeContext';
import './UndoRedoControls.css';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function UndoRedoControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UndoRedoControlsProps) {
  const {isDarkMode} = useTheme();

  return (
    <div className="undo-redo-controls">
      <button
        className={`undo-redo-button ${!canUndo ? 'disabled' : ''} ${isDarkMode ? 'dark' : ''}`}
        onClick={onUndo}
        disabled={!canUndo}
        type="button"
        title="Undo (Ctrl+Z)">
        ↶ Undo
      </button>
      <button
        className={`undo-redo-button ${!canRedo ? 'disabled' : ''} ${isDarkMode ? 'dark' : ''}`}
        onClick={onRedo}
        disabled={!canRedo}
        type="button"
        title="Redo (Ctrl+Y)">
        ↷ Redo
      </button>
    </div>
  );
}
