
import { useState, FormEvent } from 'react';
import { api } from '../services/api';

interface AuthPageProps {
  onNavigate: (
    page: 'landing' | 'download' | 'auth' | 'dashboard'
  ) => void;
  onLoginSuccess: (user: any) => void;
}

export default function AuthPage({
  onNavigate,
  onLoginSuccess,
}: AuthPageProps) {
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

        const user = await api.signup(email, fullName, password);

        setSuccessMsg(
          'Account created successfully! Connecting your dashboard...'
        );

        setTimeout(() => {
          onLoginSuccess(user);
        }, 1500);
      } else {
        const user = await api.login(email, password);

        setSuccessMsg(
          'Welcome back! Loading your feed insights...'
        );

        setTimeout(() => {
          onLoginSuccess(user);
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err.message ||
          'An error occurred during authentication.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(
        'Please enter your email address first, then click forgot password.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const msg = await api.forgotPassword(email);
      setSuccessMsg(msg);
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to dispatch password recovery link.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);
    setSuccessMsg('Logging in with Google profile...');

    setTimeout(async () => {
      try {
        const user = await api.login(
          'alex@example.com',
          'password123'
        );

        onLoginSuccess(user);
      } catch (err: any) {
        setError(
          'Google login simulation failed: ' +
            err.message
        );
        setLoading(false);
      }
    }, 1200);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#080F1D] text-white relative overflow-hidden">

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: .25;
          }
          50% {
            opacity: .55;
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        .auth-fade-up {
          animation: fadeUp .7s ease-out both;
        }

        .auth-float {
          animation: float 4s ease-in-out infinite;
        }

        .auth-pulse {
          animation: pulse 4s ease-in-out infinite;
        }

        .auth-grid {
          background-image:
            linear-gradient(
              rgba(255,255,255,.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,.025) 1px,
              transparent 1px
            );
          background-size: 36px 36px;
        }

        .auth-input::placeholder {
          color: rgba(255,255,255,.2);
        }

        .auth-input:focus {
          border-color: rgba(183,196,255,.45);
          box-shadow:
            0 0 0 3px rgba(183,196,255,.06);
        }
      `}</style>


      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="fixed inset-0 pointer-events-none">

        <div className="auth-pulse absolute -top-48 -left-40 w-[520px] h-[520px] rounded-full bg-[#7888ff]/[0.07] blur-[130px]" />

        <div className="auth-pulse absolute -bottom-48 -right-40 w-[520px] h-[520px] rounded-full bg-[#9d8cff]/[0.055] blur-[130px]" />

        <div className="absolute inset-0 auth-grid opacity-30" />

      </div>


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="relative z-20 h-[76px] border-b border-white/[0.06] bg-[#080F1D]/70 backdrop-blur-xl">

        <div className="max-w-[1250px] mx-auto h-full px-5 md:px-8 flex items-center justify-between">

          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 group"
          >

            <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.035] flex items-center justify-center group-hover:border-[#b7c4ff]/30 transition-all">

              <span className="text-[#b7c4ff] text-sm">
                ◈
              </span>

            </div>

            <div className="text-left">

              <div className="text-sm font-semibold tracking-tight">
                Invisible Algorithm
              </div>

              <div className="text-[8px] uppercase tracking-[0.22em] text-white/25">
                See beyond your feed
              </div>

            </div>

          </button>


          <button
            onClick={() => onNavigate('landing')}
            className="text-[10px] uppercase tracking-[0.16em] text-white/35 hover:text-white transition-colors"
          >
            ← Back to home
          </button>

        </div>

      </nav>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 min-h-[calc(100vh-76px)] flex items-center px-5 py-12">

        <div className="w-full max-w-[1080px] mx-auto grid lg:grid-cols-[1fr_430px] gap-12 lg:gap-20 items-center">


          {/* =================================================
              LEFT — ALGORITHM VISUAL
          ================================================= */}

          <section className="hidden lg:block auth-fade-up">

            <div className="max-w-[510px]">

              <div className="flex items-center gap-2 mb-6">

                <span className="w-1.5 h-1.5 rounded-full bg-[#b7c4ff] shadow-[0_0_12px_rgba(183,196,255,.7)]" />

                <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#b7c4ff]/60">
                  {isSignUp
                    ? 'Create your perspective'
                    : 'Your algorithm awaits'}
                </span>

              </div>


              <h1 className="text-5xl xl:text-6xl font-bold tracking-[-0.055em] leading-[.98]">

                {isSignUp ? (
                  <>
                    Make the
                    <br />
                    <span className="text-[#b7c4ff]">
                      invisible
                    </span>{' '}
                    visible.
                  </>
                ) : (
                  <>
                    See what your
                    <br />
                    <span className="text-[#b7c4ff]">
                      feed
                    </span>{' '}
                    sees.
                  </>
                )}

              </h1>


              <p className="mt-6 text-sm leading-7 text-white/35 max-w-[430px]">

                {isSignUp
                  ? 'Create your account and start exploring how recommendation systems shape your digital world.'
                  : 'Sign in to uncover patterns, measure your feed diversity, and understand your information bubble.'}

              </p>


              {/* =============================================
                  FEED VISUAL
              ============================================= */}

              <div className="relative mt-10 w-full h-[230px] rounded-2xl border border-white/[0.07] bg-white/[0.018] overflow-hidden">

                <div className="absolute inset-0 auth-grid opacity-40" />


                {/* Header */}
                <div className="absolute top-0 left-0 right-0 h-12 border-b border-white/[0.06] px-5 flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span className="w-5 h-5 rounded-md bg-[#b7c4ff]/10 border border-[#b7c4ff]/15 flex items-center justify-center text-[8px] text-[#b7c4ff]">
                      ◈
                    </span>

                    <span className="text-[9px] text-white/40">
                      YOUR RECOMMENDATIONS
                    </span>

                  </div>

                  <span className="text-[8px] font-mono text-white/20">
                    LIVE ANALYSIS
                  </span>

                </div>


                {/* Feed cards */}
                <div className="absolute top-[68px] left-5 right-5 flex gap-3">

                  <FeedCard
                    title="Technology"
                    value="62%"
                    width="62%"
                    delay="0s"
                  />

                  <FeedCard
                    title="Entertainment"
                    value="24%"
                    width="24%"
                    delay=".6s"
                  />

                  <FeedCard
                    title="Other"
                    value="14%"
                    width="14%"
                    delay="1.2s"
                  />

                </div>


                {/* Bubble meter */}
                <div className="absolute bottom-5 left-5 right-5">

                  <div className="flex justify-between items-center mb-2">

                    <span className="text-[8px] uppercase tracking-[0.16em] text-white/25">
                      Information bubble
                    </span>

                    <span className="text-[9px] font-mono text-[#b7c4ff]/70">
                      68 / 100
                    </span>

                  </div>

                  <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">

                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#b7c4ff]/40 to-[#b7c4ff]" />

                  </div>

                </div>

              </div>


              {/* Small features */}
              <div className="flex gap-6 mt-7">

                <MiniFeature text="Feed insights" />

                <MiniFeature text="Privacy first" />

                <MiniFeature text="No blocking" />

              </div>

            </div>

          </section>


          {/* =================================================
              RIGHT — AUTH
          ================================================= */}

          <section className="auth-fade-up">

            <div className="relative rounded-[26px] border border-white/[0.08] bg-[#0c1727]/90 backdrop-blur-2xl p-7 sm:p-8 shadow-[0_35px_100px_rgba(0,0,0,.4)] overflow-hidden">

              {/* subtle glow */}
              <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-[#b7c4ff]/[0.05] blur-[90px]" />

              <div className="relative z-10">

                {/* Mobile logo */}
                <div className="lg:hidden flex justify-center mb-7">

                  <div className="w-12 h-12 rounded-2xl border border-[#b7c4ff]/15 bg-[#b7c4ff]/10 flex items-center justify-center">

                    <span className="text-[#b7c4ff]">
                      ◈
                    </span>

                  </div>

                </div>


                {/* Heading */}
                <div className="mb-7">

                  <div className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#b7c4ff]/55 mb-3">
                    {isSignUp
                      ? 'New perspective'
                      : 'Account access'}
                  </div>

                  <h2 className="text-2xl font-bold tracking-[-0.04em]">
                    {isSignUp
                      ? 'Create your account'
                      : 'Welcome back'}
                  </h2>

                  <p className="text-xs text-white/30 mt-2 leading-relaxed">
                    {isSignUp
                      ? 'Start understanding your algorithm.'
                      : 'Continue exploring your information bubble.'}
                  </p>

                </div>


                {/* Messages */}
                {error && (
                  <div className="mb-5 rounded-xl border border-red-400/10 bg-red-400/[0.05] px-4 py-3">

                    <div className="flex gap-2">

                      <span className="text-red-300 text-xs">
                        !
                      </span>

                      <p className="text-[10px] leading-relaxed text-red-300">
                        {error}
                      </p>

                    </div>

                  </div>
                )}


                {successMsg && (
                  <div className="mb-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.05] px-4 py-3">

                    <div className="flex gap-2">

                      <span className="text-emerald-300 text-xs">
                        ✓
                      </span>

                      <p className="text-[10px] leading-relaxed text-emerald-300">
                        {successMsg}
                      </p>

                    </div>

                  </div>
                )}


                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >

                  {isSignUp && (
                    <AuthInput
                      label="Full name"
                      type="text"
                      value={fullName}
                      onChange={setFullName}
                      placeholder="Your name"
                    />
                  )}


                  <AuthInput
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                  />


                  <div>

                    <div className="flex justify-between items-center mb-2">

                      <label className="text-[9px] uppercase tracking-[0.14em] font-semibold text-white/40">
                        Password
                      </label>

                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[9px] text-[#b7c4ff]/65 hover:text-[#b7c4ff] transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}

                    </div>

                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      className="auth-input w-full h-12 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-xs text-white outline-none transition-all"
                    />

                  </div>


                  {!isSignUp && (
                    <label className="flex items-center gap-2 cursor-pointer pt-1">

                      <input
                        type="checkbox"
                        id="keep-logged-in"
                        defaultChecked
                        className="w-3.5 h-3.5 rounded border-white/10 bg-white/[0.03]"
                      />

                      <span className="text-[9px] text-white/25">
                        Keep me logged in
                      </span>

                    </label>
                  )}


                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#b7c4ff] text-[#07101c] font-bold text-xs hover:brightness-110 active:scale-[.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >

                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#07101c]/25 border-t-[#07101c] rounded-full animate-spin" />
                        {isSignUp
                          ? 'Creating account...'
                          : 'Signing in...'}
                      </>
                    ) : (
                      <>
                        {isSignUp
                          ? 'Create account'
                          : 'Sign in'}

                        <span>
                          →
                        </span>
                      </>
                    )}

                  </button>

                </form>


                {/* Divider */}
                <div className="flex items-center gap-3 my-6">

                  <div className="h-px flex-1 bg-white/[0.06]" />

                  <span className="text-[8px] uppercase tracking-[0.2em] text-white/20">
                    or
                  </span>

                  <div className="h-px flex-1 bg-white/[0.06]" />

                </div>


                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.045] transition-all flex items-center justify-center gap-3 text-[11px] text-white/60 disabled:opacity-50"
                >

                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                  >

                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.93 1 12 1 7.37 1 3.4 3.63 1.39 7.47l3.74 2.9C6.01 7.15 8.78 5.04 12 5.04z"
                    />

                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.45h6.45c-.28 1.48-1.11 2.73-2.37 3.58l3.69 2.87c2.16-1.99 3.72-4.92 3.72-8.56z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M5.13 14.53c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.39 7.07C.5 8.87 0 10.87 0 13s.5 4.13 1.39 5.93l3.74-2.93z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.96-1.08 7.95-2.91l-3.69-2.87c-1.11.75-2.52 1.19-4.26 1.19-3.22 0-5.99-2.11-6.96-4.96l-3.74 2.9C3.4 20.37 7.37 23 12 23z"
                    />

                  </svg>

                  Continue with Google

                </button>


                {/* Toggle */}
                <div className="text-center mt-6">

                  <span className="text-[10px] text-white/25">
                    {isSignUp
                      ? 'Already have an account?'
                      : 'New to Invisible Algorithm?'}
                  </span>

                  {' '}

                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-[10px] font-semibold text-[#b7c4ff] hover:text-white transition-colors"
                  >
                    {isSignUp
                      ? 'Sign in'
                      : 'Create account'}
                  </button>

                </div>

              </div>

            </div>

          </section>

        </div>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="relative z-10 border-t border-white/[0.05]">

        <div className="max-w-[1250px] mx-auto px-5 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">

          <span className="text-[9px] text-white/20">
            © 2026 Invisible Algorithm
          </span>

          <div className="flex items-center gap-4 text-[9px] text-white/20">

            <button className="hover:text-white/50 transition-colors">
              Privacy
            </button>

            <span>•</span>

            <button className="hover:text-white/50 transition-colors">
              Terms
            </button>

          </div>

        </div>

      </footer>

    </div>
  );
}


/* =============================================================
   AUTH INPUT
============================================================= */

function AuthInput({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>

      <label className="block mb-2 text-[9px] uppercase tracking-[0.14em] font-semibold text-white/40">
        {label}
      </label>

      <input
        type={type}
        required
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="auth-input w-full h-12 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-xs text-white outline-none transition-all"
      />

    </div>
  );
}


/* =============================================================
   FEED CARD
============================================================= */

function FeedCard({
  title,
  value,
  width,
  delay,
}: {
  title: string;
  value: string;
  width: string;
  delay: string;
}) {
  return (
    <div
      className="auth-float flex-1"
      style={{ animationDelay: delay }}
    >

      <div className="flex items-center justify-between mb-2">

        <span className="text-[8px] text-white/30">
          {title}
        </span>

        <span className="text-[8px] font-mono text-[#b7c4ff]/60">
          {value}
        </span>

      </div>

      <div className="h-8 rounded-lg bg-white/[0.025] border border-white/[0.05] p-1">

        <div
          className="h-full rounded-md bg-[#b7c4ff]/15 border border-[#b7c4ff]/10"
          style={{ width }}
        />

      </div>

    </div>
  );
}


/* =============================================================
   MINI FEATURE
============================================================= */

function MiniFeature({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">

      <span className="w-4 h-4 rounded-full bg-[#b7c4ff]/10 border border-[#b7c4ff]/15 flex items-center justify-center text-[7px] text-[#b7c4ff]">
        ✓
      </span>

      <span className="text-[9px] text-white/25">
        {text}
      </span>

    </div>
  );
}

