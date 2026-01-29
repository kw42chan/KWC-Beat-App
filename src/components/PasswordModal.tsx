import {useState, useEffect} from 'react';
import {useTheme} from '../context/ThemeContext';
import './PasswordModal.css';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feature: string;
}

export function PasswordModal({isOpen, onClose, onSuccess, feature}: PasswordModalProps) {
  const {isDarkMode} = useTheme();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Check password against configured password
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    
    if (password === correctPassword) {
      onSuccess();
      onClose();
    } else {
      setError('Incorrect password. Please try again.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`password-modal-overlay ${isDarkMode ? 'dark' : ''}`}
      onClick={onClose}>
      <div 
        className={`password-modal ${isDarkMode ? 'dark' : ''}`}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}>
        <div className="password-modal-header">
          <h2 className="password-modal-title">🔒 Authentication Required</h2>
          <button
            className={`password-modal-close ${isDarkMode ? 'dark' : ''}`}
            onClick={onClose}
            type="button"
            aria-label="Close">
            ✕
          </button>
        </div>

        <p className="password-modal-description">
          Please enter the admin password to access <strong>{feature}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="password-input-wrapper">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`password-input ${isDarkMode ? 'dark' : ''} ${error ? 'error' : ''}`}
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="password-error">
              {error}
            </div>
          )}

          <div className="password-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className={`password-button cancel ${isDarkMode ? 'dark' : ''}`}
              disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className={`password-button submit ${isDarkMode ? 'dark' : ''}`}
              disabled={!password || isLoading}>
              {isLoading ? 'Verifying...' : 'Unlock'}
            </button>
          </div>
        </form>

        <div className="password-hint">
          <small>Default password: <code>admin123</code></small>
          <br />
          <small>Set <code>VITE_ADMIN_PASSWORD</code> in .env to customize</small>
        </div>
      </div>
    </div>
  );
}
