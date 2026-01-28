import React from 'react';
import {useTheme} from '../context/ThemeContext';
import './LoadingSpinner.css';

export function LoadingSpinner({message}: {message?: string}) {
  const {isDarkMode} = useTheme();

  return (
    <div className={`loading-container ${isDarkMode ? 'dark' : ''}`}>
      <div className={`spinner ${isDarkMode ? 'dark' : ''}`}></div>
      {message && (
        <p className={`loading-message ${isDarkMode ? 'dark' : ''}`}>{message}</p>
      )}
    </div>
  );
}
