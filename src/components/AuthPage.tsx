import { useState, FormEvent } from 'react';
import { api } from '../services/api';

interface AuthPageProps {
  onNavigate: (page: 'landing' | 'download' | 'auth' | 'dashboard') => void;
  onLoginSuccess: (user: any) => void;
}

export default function AuthPage({ onNavigate, onLoginSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all required fields.');
      }

      if (isSignUp) {
        if (!fullName) {
          throw new Error('Please provide your Full Name to sign up.');
        }
        // Signup
        const user = await api.signup(email, fullName, password);
        setSuccessMsg('Account created successfully! Connecting your dashboard...');
        setTimeout(() => {
          onLoginSuccess(user);
        }, 1500);
      } else {
        // Login
        const user = await api.login(email, password);
        setSuccessMsg('Welcome back! Loading your feed insights...');
        setTimeout(() => {
          onLoginSuccess(user);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first, then click forgot password.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const msg = await api.forgotPassword(email);
      setSuccessMsg(msg);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password recovery link.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);
    setSuccessMsg('Logging in with Google profile...');
    
    // Simulate oauth integration callback (or authenticates with the mockup user)
    setTimeout(async () => {
      try {
        const user = await api.login('alex@example.com', 'password123');
        onLoginSuccess(user);
      } catch (err: any) {
        setError('Google login simulation failed: ' + err.message);
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="font-body-md text-body-md bg-surface-dim text-on-surface min-h-screen flex flex-col justify-between">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface-dim/80 backdrop-blur-xl border-b border-white/5 shadow-sm h-20">
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop flex justify-between items-center h-full">
          <div className="font-headline-md text-headline-md tracking-tighter text-on-surface cursor-pointer" onClick={() => onNavigate('landing')}>
            The Invisible Algorithm
          </div>
          <div className="hidden md:flex items-center gap-stack-lg">
            <span className="text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-label-md cursor-pointer" onClick={() => onNavigate('landing')}>
              Home
            </span>
            <span className="text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-label-md cursor-pointer" onClick={() => onNavigate('download')}>
              Download
            </span>
            <span className="text-primary font-semibold border-b-2 border-primary pb-1 font-label-md text-label-md cursor-pointer">
              Sign In
            </span>
          </div>
          <button 
            onClick={() => onNavigate('download')}
            className="bg-primary text-on-primary-container px-6 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Download Extension
          </button>
        </div>
      </nav>

      {/* Main Auth Card Area */}
      <main className="pt-32 pb-16 px-4 flex flex-col items-center justify-center flex-grow">
        <div className="w-full max-w-md glass rounded-2xl p-8 border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Accent decoration inside the card */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="text-center space-y-2 relative z-10">
            <h1 className="font-display-lg text-3xl font-bold text-white tracking-tight">
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {isSignUp 
                ? 'Join to begin auditing recommendations and tracking digital biases.' 
                : 'Access your personalized digital feed analysis dashboard.'}
            </p>
          </div>

          {/* Error & Success Feedback displays */}
          {error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm rounded-lg p-3 flex gap-2 items-center">
              <span className="material-symbols-outlined text-base" data-icon="error">error</span>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-primary/10 border border-primary/20 text-primary text-sm rounded-lg p-3 flex gap-2 items-center">
              <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant text-lg" data-icon="person">person</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full bg-surface-container-low border border-outline-variant/30 text-white rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant text-lg" data-icon="mail">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-white rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-surface-variant block">Password</label>
                {!isSignUp && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant text-lg" data-icon="lock">lock</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-white rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="keep-logged-in" 
                  defaultChecked
                  className="rounded bg-surface-container-low border-outline-variant/30 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="keep-logged-in" className="text-xs text-on-surface-variant cursor-pointer select-none">
                  Keep me logged in
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary-container py-3.5 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Log In'}</span>
                  <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant opacity-55 relative z-10">
            <div className="flex-grow h-[1px] bg-outline-variant/20"></div>
            <span>or</span>
            <div className="flex-grow h-[1px] bg-outline-variant/20"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border border-outline-variant/30 py-3 rounded-lg flex items-center justify-center gap-2 text-sm text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {/* Simple Inline Google G Logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.93 1 12 1 7.37 1 3.4 3.63 1.39 7.47l3.74 2.9C6.01 7.15 8.78 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.45h6.45c-.28 1.48-1.11 2.73-2.37 3.58l3.69 2.87c2.16-1.99 3.72-4.92 3.72-8.56z" />
              <path fill="#FBBC05" d="M5.13 14.53c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.39 7.07C.5 8.87 0 10.87 0 13s.5 4.13 1.39 5.93l3.74-2.93z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.96-1.08 7.95-2.91l-3.69-2.87c-1.11.75-2.52 1.19-4.26 1.19-3.22 0-5.99-2.11-6.96-4.96l-3.74 2.9C3.4 20.37 7.37 23 12 23z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Toggle link */}
          <div className="text-center text-xs text-on-surface-variant relative z-10 pt-2">
            <span>{isSignUp ? 'Already have an account?' : 'New to The Invisible Algorithm?'}</span>{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-primary hover:underline font-bold cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-6 border-t border-outline-variant/20">
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-semibold text-white text-sm">The Invisible Algorithm</div>
            <p className="text-xs text-on-surface-variant">© 2024 The Invisible Algorithm. All rights reserved.</p>
          </div>
          <div className="flex gap-4 text-xs text-on-surface-variant">
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => onNavigate('landing')}>Back to Home</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
