import {useTheme} from '../context/ThemeContext';
import './ErrorView.css';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({message, onRetry}: ErrorViewProps) {
  const {isDarkMode} = useTheme();

  return (
    <div className={`error-container ${isDarkMode ? 'dark' : ''}`}>
      <p className={`error-message ${isDarkMode ? 'dark' : ''}`}>{message}</p>
      {onRetry && (
        <button
          className={`error-button ${isDarkMode ? 'dark' : ''}`}
          onClick={onRetry}
          type="button">
          <span className="error-button-text">Retry</span>
        </button>
      )}
    </div>
  );
}
