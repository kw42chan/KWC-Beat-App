/**
 * KWC Beat App
 * Interactive map displaying 54 zones in Kowloon, Hong Kong
 */

import {ThemeProvider} from './context/ThemeContext';
import {AuthProvider} from './context/AuthContext';
import {MapScreen} from './components/MapScreen';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MapScreen />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
