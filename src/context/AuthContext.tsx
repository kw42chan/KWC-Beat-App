import {createContext, useContext, useState, useCallback, ReactNode} from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  requireAuth: (feature: string, callback: () => void) => void;
  pendingFeature: {name: string; callback: () => void} | null;
  clearPendingFeature: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<{name: string; callback: () => void} | null>(null);

  const login = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const requireAuth = useCallback((feature: string, callback: () => void) => {
    if (isAuthenticated) {
      // Already authenticated, execute immediately
      callback();
    } else {
      // Store the pending feature and show password modal
      setPendingFeature({name: feature, callback});
    }
  }, [isAuthenticated]);

  const clearPendingFeature = useCallback(() => {
    setPendingFeature(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        requireAuth,
        pendingFeature,
        clearPendingFeature,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
