import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import DownloadPage from './components/DownloadPage';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import { api } from './services/api';
import { User } from './types';

export default function App() {
  const [page, setPage] = useState<'landing' | 'download' | 'auth' | 'dashboard'>('landing');
  const [user, setUser] = useState<User | null>(api.getUser());
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyTokenOnStart = async () => {
      if (api.isAuthenticated()) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          // If already on 'auth' and authenticated, go straight to dashboard
          if (page === 'auth') {
            setPage('dashboard');
          }
        } catch (err) {
          console.warn('Session expired or invalid, logging out silently.', err);
          api.clearSession();
          setUser(null);
        }
      }
      setCheckingAuth(false);
    };

    verifyTokenOnStart();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setPage('landing');
    }
  };

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setPage('dashboard');
  };

  if (checkingAuth) {
    return (
      <div className="bg-surface-dim min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-on-surface-variant font-mono">Verifying secure session...</p>
      </div>
    );
  }

  switch (page) {
    case 'landing':
      return (
        <LandingPage 
          onNavigate={setPage} 
          isAuthenticated={!!user} 
        />
      );
    case 'download':
      return (
        <DownloadPage 
          onNavigate={setPage} 
          isAuthenticated={!!user} 
        />
      );
    case 'auth':
      return (
        <AuthPage 
          onNavigate={setPage} 
          onLoginSuccess={handleLoginSuccess} 
        />
      );
    case 'dashboard':
      if (!user) {
        // Safe fallback redirect
        return (
          <AuthPage 
            onNavigate={setPage} 
            onLoginSuccess={handleLoginSuccess} 
          />
        );
      }
      return (
        <DashboardPage 
          onNavigate={setPage} 
          onLogout={handleLogout} 
          userName={user.full_name} 
        />
      );
    default:
      return (
        <LandingPage 
          onNavigate={setPage} 
          isAuthenticated={!!user} 
        />
      );
  }
}
