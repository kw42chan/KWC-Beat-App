import {useTheme} from '../context/ThemeContext';
import './DrawingControls.css';

interface DrawingControlsProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function DrawingControls({
  isDrawing,
  onStartDrawing,
  onCancelDrawing,
  onClearAll,
  onExport,
  onImport,
}: DrawingControlsProps) {
  const {isDarkMode} = useTheme();

  return (
    <div className="drawing-controls">
      {!isDrawing ? (
        <>
          <button
            className={`drawing-button ${isDarkMode ? 'dark' : ''}`}
            onClick={onStartDrawing}
            type="button"
            title="Draw Zone">
            ✏️ Draw Zone
          </button>
          <button
            className={`drawing-button danger ${isDarkMode ? 'dark' : ''}`}
            onClick={onClearAll}
            type="button"
            title="Clear All Zones">
            🗑️ Clear All
          </button>
          <button
            className={`drawing-button ${isDarkMode ? 'dark' : ''}`}
            onClick={onImport}
            type="button"
            title="Import Zones">
            📥 Import
          </button>
          <button
            className={`drawing-button ${isDarkMode ? 'dark' : ''}`}
            onClick={onExport}
            type="button"
            title="Export Zones">
            💾 Export
          </button>
        </>
      ) : (
        <button
          className={`drawing-button cancel ${isDarkMode ? 'dark' : ''}`}
          onClick={onCancelDrawing}
          type="button"
          title="Cancel Drawing">
          ✕ Cancel
        </button>
      )}
    </div>
  );
}
