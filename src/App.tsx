/**
 * KWC Beat App
 * Interactive map displaying 54 zones in Kowloon, Hong Kong
 */

import React from 'react';
import {ThemeProvider} from './context/ThemeContext';
import {MapScreen} from './components/MapScreen';
import './App.css';

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <MapScreen />
    </ThemeProvider>
  );
}

export default App;
