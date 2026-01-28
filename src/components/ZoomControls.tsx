import React from 'react';
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
      <button
        className={`zoom-button ${isDarkMode ? 'dark' : ''}`}
        onClick={onFitAll}
        type="button">
        <span className={`zoom-button-text ${isDarkMode ? 'dark' : ''}`}>
          Fit All Zones
        </span>
      </button>
      {onZoomIn && (
        <button
          className={`zoom-icon-button ${isDarkMode ? 'dark' : ''}`}
          onClick={onZoomIn}
          type="button">
          <span className={`zoom-icon-text ${isDarkMode ? 'dark' : ''}`}>+</span>
        </button>
      )}
      {onZoomOut && (
        <button
          className={`zoom-icon-button ${isDarkMode ? 'dark' : ''}`}
          onClick={onZoomOut}
          type="button">
          <span className={`zoom-icon-text ${isDarkMode ? 'dark' : ''}`}>−</span>
        </button>
      )}
    </div>
  );
}
