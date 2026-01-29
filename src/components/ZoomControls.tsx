import {useTheme} from '../context/ThemeContext';
import './ZoomControls.css';

interface ZoomControlsProps {
  onFitAll: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function ZoomControls({onFitAll, onZoomIn, onZoomOut}: ZoomControlsProps) {
  const {isDarkMode} = useTheme();

  return (
    <div className="zoom-controls">
      {onZoomIn && (
        <button
          className={`zoom-icon-button zoom-in ${isDarkMode ? 'dark' : ''}`}
          onClick={onZoomIn}
          type="button"
          title="Zoom In">
          <span className={`zoom-icon-text ${isDarkMode ? 'dark' : ''}`}>+</span>
        </button>
      )}
      {onZoomOut && (
        <button
          className={`zoom-icon-button zoom-out ${isDarkMode ? 'dark' : ''}`}
          onClick={onZoomOut}
          type="button"
          title="Zoom Out">
          <span className={`zoom-icon-text ${isDarkMode ? 'dark' : ''}`}>−</span>
        </button>
      )}
      <button
        className={`zoom-button ${isDarkMode ? 'dark' : ''}`}
        onClick={onFitAll}
        type="button"
        title="Fit All Zones">
        <span className={`zoom-button-text ${isDarkMode ? 'dark' : ''}`}>
          Fit All
        </span>
      </button>
    </div>
  );
}
