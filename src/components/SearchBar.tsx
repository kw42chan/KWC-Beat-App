import React, {useState} from 'react';
import {useTheme} from '../context/ThemeContext';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({onSearch, onClear, placeholder = 'Search zones...'}: SearchBarProps) {
  const {isDarkMode} = useTheme();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <div className={`search-bar ${isDarkMode ? 'dark' : ''}`}>
      <input
        type="text"
        className={`search-input ${isDarkMode ? 'dark' : ''}`}
        placeholder={placeholder}
        value={query}
        onChange={handleSearch}
        autoCapitalize="off"
        autoCorrect="off"
      />
      {query.length > 0 && (
        <button onClick={handleClear} className="clear-button" type="button">
          <span className={`clear-text ${isDarkMode ? 'dark' : ''}`}>✕</span>
        </button>
      )}
    </div>
  );
}
