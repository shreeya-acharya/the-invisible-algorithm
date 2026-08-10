
import { useEffect, useState, type FormEvent } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { api } from '../services/api';
import { DashboardData, Settings } from '../types';

interface DashboardPageProps {
  onNavigate: (
    page: 'landing' | 'download' | 'auth' | 'dashboard'
  ) => void;
  onLogout: () => void;
  userName: string;
}

export default function DashboardPage({
  onNavigate,
  onLogout,
  userName,
}: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings | null>(null);

  // Developer simulator
  const [simWebsite, setSimWebsite] = useState('youtube.com');
  const [simDuration, setSimDuration] = useState(45);
  const [simScore, setSimScore] = useState(72);
  const [simReflection, setSimReflection] = useState(
    'Explored scientific recommendations outside my usual feed.'
  );
  const [simulating, setSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);
  const [showDeveloperTools, setShowDeveloperTools] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardData = await api.getDashboard();

      setData(dashboardData);

      if (dashboardData.settings) {
        setSettings(dashboardData.settings);
      }
    } catch (err: any) {
      console.error('Fetch dashboard error:', err);
      setError('Failed to load dashboard metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleSetting = async (
    key: keyof Settings,
    currentValue: boolean
  ) => {
    if (!settings) return;

    try {
      const updated = await api.updateSettings({
        [key]: !currentValue,
      });

      setSettings(updated);
    } catch (err: any) {
      console.error('Error toggling settings:', err);
    }
  };

  const handleSimulateSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setSimulating(true);
    setSimSuccess(false);

    try {
      const seconds = simDuration * 60;

      await api.simulateExtensionActivity(
        simWebsite,
        seconds,
        simScore,
        simReflection
      );

      setSimSuccess(true);

      await fetchDashboard();

      setTimeout(() => {
        setSimSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Simulation failed:', err);
      alert('Simulation failed: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const chartData = data?.recentSessions
    ? [...data.recentSessions]
        .reverse()
        .map((session) => ({
          name: session.date,
          Score: session.score,
        }))
    : [
        { name: 'Mon', Score: 54 },
        { name: 'Tue', Score: 61 },
        { name: 'Wed', Score: 58 },
        { name: 'Thu', Score: 70 },
        { name: 'Fri', Score: 67 },
        { name: 'Sat', Score: 76 },
        { name: 'Sun', Score: 72 },
      ];

  const diversityScore = data?.echoChamberScore ?? 72;

  const scoreLabel =
    diversityScore >= 80
      ? 'Highly Diverse'
      : diversityScore >= 60
      ? 'Moderately Diverse'
      : 'Narrow Feed';

  const initials =
    userName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#080F1D] text-white overflow-x-hidden">
      <style>{`
        @keyframes dashboardFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dashboardFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slowFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: .35;
            transform: scale(1);
          }
          50% {
            opacity: .65;
            transform: scale(1.08);
          }
        }

        @keyframes scoreGlow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(183,196,255,.12));
          }
          50% {
            filter: drop-shadow(0 0 26px rgba(183,196,255,.32));
          }
        }

        .dashboard-entry {
          animation: dashboardFadeUp .7s cubic-bezier(.2,.8,.2,1) both;
        }

        .dashboard-fade {
          animation: dashboardFade .8s ease both;
        }

        .dashboard-float {
          animation: slowFloat 5s ease-in-out infinite;
        }

        .dashboard-glow {
          animation: glowPulse 5s ease-in-out infinite;
        }

        .score-glow {
          animation: scoreGlow 4s ease-in-out infinite;
        }

        .glass-dashboard {
          background:
            linear-gradient(
              135deg,
              rgba(20,34,53,.72),
              rgba(10,20,35,.68)
            );
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,.07);
          box-shadow:
            0 20px 60px rgba(0,0,0,.16),
            inset 0 1px 0 rgba(255,255,255,.025);
        }

        .dashboard-card {
          transition:
            transform .35s cubic-bezier(.2,.8,.2,1),
            border-color .35s ease,
            box-shadow .35s ease;
        }

        .dashboard-card:hover {
          transform: translateY(-4px);
          border-color: rgba(183,196,255,.16);
          box-shadow:
            0 22px 60px rgba(0,0,0,.25),
            0 0 35px rgba(183,196,255,.035);
        }

        .score-ring {
          background:
            conic-gradient(
              #b7c4ff ${diversityScore}%,
              rgba(255,255,255,.07) 0
            );
        }

        .score-ring-inner {
          background:
            radial-gradient(
              circle at 35% 30%,
              rgba(183,196,255,.12),
              #0b1424 62%
            );
        }

        .soft-grid {
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
          background-size: 38px 38px;
        }

        .dashboard-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .dashboard-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .dashboard-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(183,196,255,.15);
          border-radius: 999px;
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080F1D]/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 h-[72px] flex items-center justify-between">

          <button
            onClick={() => onNavigate('landing')}
            className="group flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#b7c4ff]/10 border border-[#b7c4ff]/15 flex items-center justify-center group-hover:bg-[#b7c4ff]/15 transition-all">
              <span className="text-[#b7c4ff] text-sm">
                ◈
              </span>
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold tracking-tight">
                Invisible Algorithm
              </p>

              <p className="text-[9px] text-white/30 tracking-[0.18em] uppercase">
                Personal dashboard
              </p>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-white/[0.025] border border-white/[0.05]">
            <button
              onClick={() => onNavigate('landing')}
              className="px-4 py-2 rounded-lg text-xs text-white/45 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              Home
            </button>

            <button
              onClick={() => onNavigate('download')}
              className="px-4 py-2 rounded-lg text-xs text-white/45 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              Extension
            </button>

            <span className="px-4 py-2 rounded-lg bg-white/[0.07] text-xs text-white font-medium">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#b7c4ff]/10 border border-[#b7c4ff]/20 flex items-center justify-center text-xs font-bold text-[#b7c4ff]">
                {initials}
              </div>

              <div className="hidden lg:block">
                <p className="text-xs font-medium text-white/75">
                  {userName}
                </p>

                <p className="text-[9px] text-white/25">
                  Connected
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-lg text-[10px] text-white/35 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="dashboard-glow absolute top-[90px] left-[7%] w-[430px] h-[430px] rounded-full bg-[#7788ff]/[0.055] blur-[120px]" />

        <div className="dashboard-glow absolute bottom-[8%] right-[5%] w-[360px] h-[360px] rounded-full bg-[#9b8cff]/[0.045] blur-[120px]" />
      </div>

      {/* MAIN */}
      <main className="relative pt-[104px] pb-20 px-5 md:px-8 max-w-[1280px] mx-auto">

        {loading ? (
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border border-[#b7c4ff]/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#b7c4ff] animate-spin" />
              </div>

              <p className="text-xs font-mono tracking-widest text-white/40 uppercase">
                Reading your information bubble...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-7">

            {/* WELCOME / HERO */}
            <section className="dashboard-entry relative overflow-hidden rounded-[30px] glass-dashboard soft-grid p-7 md:p-10">

              <div className="absolute -top-32 -right-20 w-[420px] h-[420px] rounded-full bg-[#b7c4ff]/[0.055] blur-[100px]" />

              <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-10 items-center">

                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
                    </span>

                    <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-emerald-400/80">
                      Extension connected
                    </span>
                  </div>

                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#b7c4ff]/60 mb-3">
                    Good morning, {userName}
                  </p>

                  <h1 className="text-3xl md:text-5xl font-bold tracking-[-0.045em] leading-[1.05] max-w-2xl">
                    See what your
                    <span className="text-[#b7c4ff]">
                      {' '}algorithm{' '}
                    </span>
                    is showing you.
                  </h1>

                  <p className="mt-5 text-sm md:text-base text-white/40 leading-relaxed max-w-xl">
                    Understand your information bubble, discover patterns
                    in your recommendations, and explore perspectives
                    beyond your usual feed.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-7">
                    <div className="px-3 py-2 rounded-xl bg-white/[0.035] border border-white/[0.06]">
                      <p className="text-[8px] font-mono uppercase tracking-widest text-white/25">
                        Last synced
                      </p>

                      <p className="text-xs text-white/65 mt-1">
                        Just now
                      </p>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-emerald-400/[0.05] border border-emerald-400/10">
                      <p className="text-[8px] font-mono uppercase tracking-widest text-emerald-400/50">
                        Status
                      </p>

                      <p className="text-xs text-emerald-400 mt-1">
                        Monitoring
                      </p>
                    </div>
                  </div>
                </div>

                {/* SCORE */}
                <div className="relative flex justify-center lg:justify-end">
                  <div className="relative w-[190px] h-[190px]">

                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(
                          #b7c4ff ${diversityScore}%,
                          rgba(255,255,255,0.06) 0
                        )`,
                      }}
                    />

                    <div className="absolute inset-[7px] rounded-full bg-[#0b1424] border border-white/[0.05] flex flex-col items-center justify-center">

                      <span className="text-5xl font-black tracking-[-0.06em]">
                        {diversityScore}
                      </span>

                      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 mt-1">
                        diversity score
                      </span>

                      <span className="mt-3 px-2.5 py-1 rounded-full bg-[#b7c4ff]/10 border border-[#b7c4ff]/15 text-[8px] font-bold uppercase tracking-wider text-[#b7c4ff]">
                        {scoreLabel}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* SCORE + INSIGHT */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* SCORE DETAIL */}
              <div className="dashboard-entry dashboard-card glass-dashboard rounded-[26px] lg:col-span-2 p-7 relative overflow-hidden">

                <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-[#b7c4ff]/[0.05] blur-[55px]" />

                <div className="relative">

                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[.2em] text-white/35">
                        Your information bubble
                      </p>

                      <h2 className="text-lg font-semibold mt-2">
                        Feed Diversity
                      </h2>
                    </div>

                    <span className="text-[#b7c4ff] text-xl">
                      ◈
                    </span>
                  </div>

                  <div className="flex justify-center py-8">
                    <div className="relative w-[190px] h-[190px] score-ring rounded-full p-[7px] score-glow">

                      <div className="score-ring-inner rounded-full w-full h-full flex flex-col items-center justify-center border border-white/[0.04]">

                        <span className="text-6xl font-black tracking-[-.06em]">
                          {diversityScore}
                        </span>

                        <span className="text-[10px] font-mono uppercase tracking-[.2em] text-white/35 mt-1">
                          out of 100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">

                    <span className="inline-flex px-3 py-1 rounded-full bg-[#b7c4ff]/10 border border-[#b7c4ff]/15 text-[#b7c4ff] text-[10px] font-bold uppercase tracking-wider">
                      {scoreLabel}
                    </span>

                    <p className="text-xs text-white/40 mt-3 leading-relaxed">
                      Higher diversity means your recommendations expose
                      you to a wider range of perspectives.
                    </p>
                  </div>

                </div>
              </div>

              {/* INSIGHT */}
              <div className="dashboard-entry dashboard-card glass-dashboard rounded-[26px] lg:col-span-3 p-7 relative overflow-hidden">

                <div className="absolute right-[-30px] bottom-[-50px] w-56 h-56 rounded-full bg-[#b7c4ff]/[0.045] blur-[55px]" />

                <div className="relative h-full flex flex-col">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[.2em] text-[#b7c4ff]/60">
                        Algorithm insight
                      </p>

                      <h2 className="text-xl font-semibold mt-2">
                        Your feed is changing.
                      </h2>
                    </div>

                    <div className="dashboard-float w-11 h-11 rounded-2xl bg-[#b7c4ff]/10 border border-[#b7c4ff]/15 flex items-center justify-center text-[#b7c4ff]">
                      ✦
                    </div>
                  </div>

                  <div className="flex-1 flex items-center py-7">
                    <p className="text-lg md:text-2xl text-white/75 leading-relaxed max-w-2xl">
                      {data?.reflectionSummary
                        ? data.reflectionSummary.replace(/"/g, '')
                        : 'You are exploring more diverse content than before. Keep challenging the recommendations your feed automatically gives you.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">

                    <div className="px-3 py-2 rounded-lg bg-emerald-400/[0.07] border border-emerald-400/10">
                      <span className="text-[10px] text-emerald-400 font-bold">
                        ↑ 12%
                      </span>

                      <span className="text-[10px] text-white/35 ml-2">
                        vs last week
                      </span>
                    </div>

                    <div className="px-3 py-2 rounded-lg bg-white/[0.035] border border-white/[0.06]">
                      <span className="text-[10px] text-white/45">
                        Recommendation diversity improving
                      </span>
                    </div>

                  </div>
                </div>
              </div>

            </section>

            {/* QUICK STATS */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <StatCard
                icon="◷"
                label="Audited time"
                value={data?.browsingTimeText || '0m'}
                description="Total monitored browsing"
              />

              <StatCard
                icon="✦"
                label="Current streak"
                value={`${data?.currentStreakDays || 0} days`}
                description="Keep exploring different perspectives"
              />

              <StatCard
                icon="◎"
                label="Feeds analyzed"
                value={`${data?.recentSessions?.length || 0}`}
                description="Recent recommendation sessions"
              />

            </section>

            {/* ANALYTICS */}
            <section className="dashboard-entry glass-dashboard dashboard-card rounded-[26px] p-6 md:p-8">

              <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[.2em] text-[#b7c4ff]/60">
                    Analytics
                  </p>

                  <h2 className="text-2xl font-bold mt-2">
                    Your Bubble Over Time
                  </h2>

                  <p className="text-xs text-white/35 mt-2">
                    How diverse your recommendations have been across
                    recent audited sessions.
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#b7c4ff]/[0.04] border border-[#b7c4ff]/[0.08]">
                  <span className="w-2 h-2 rounded-full bg-[#b7c4ff]" />

                  <span className="text-[10px] font-mono text-white/40">
                    FEED DIVERSITY
                  </span>
                </div>

              </div>

              <div className="h-[330px] w-full mt-8">

                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -25,
                      bottom: 0,
                    }}
                  >

                    <defs>
                      <linearGradient
                        id="dashboardGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#b7c4ff"
                          stopOpacity={0.32}
                        />

                        <stop
                          offset="100%"
                          stopColor="#b7c4ff"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="rgba(255,255,255,.045)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#707889"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />

                    <YAxis
                      stroke="#707889"
                      fontSize={10}
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      cursor={{
                        stroke: '#b7c4ff',
                        strokeOpacity: 0.15,
                      }}
                      contentStyle={{
                        background: '#0d1929',
                        border: '1px solid rgba(183,196,255,.15)',
                        borderRadius: '12px',
                        boxShadow: '0 15px 40px rgba(0,0,0,.35)',
                      }}
                      labelStyle={{
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                      itemStyle={{
                        color: '#b7c4ff',
                        fontSize: '12px',
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="Score"
                      stroke="#b7c4ff"
                      strokeWidth={3}
                      fill="url(#dashboardGradient)"
                      fillOpacity={1}
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: '#b7c4ff',
                        stroke: '#0b1424',
                        strokeWidth: 3,
                      }}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />

                  </AreaChart>
                </ResponsiveContainer>

              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center border-t border-white/[0.05] pt-5">

                <p className="text-xs text-white/35">
                  Recommendation diversity is trending upward.
                </p>

                <span className="text-xs font-bold text-emerald-400">
                  +12% this week
                </span>

              </div>

            </section>

            {/* ACTIVITY + EXPLORE */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* RECENT ACTIVITY */}
              <div className="glass-dashboard rounded-[26px] p-6 lg:col-span-2">

                <div className="flex justify-between items-end mb-6">

                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[.2em] text-[#b7c4ff]/60">
                      Recent activity
                    </p>

                    <h2 className="text-xl font-bold mt-2">
                      What you've been exploring
                    </h2>
                  </div>

                  <span className="hidden sm:block text-[9px] font-mono uppercase tracking-widest text-white/20">
                    Latest sessions
                  </span>

                </div>

                <div className="space-y-2">

                  {data?.recentSessions &&
                  data.recentSessions.length > 0 ? (
                    data.recentSessions.slice(0, 5).map(
                      (session, index) => (
                        <div
                          key={index}
                          className="group flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.035] border border-transparent hover:border-white/[0.04] transition-all"
                        >

                          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#b7c4ff]/[0.07] border border-[#b7c4ff]/10 flex items-center justify-center text-[#b7c4ff] text-sm">
                            ◎
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex justify-between gap-3">

                              <span className="text-sm font-semibold truncate">
                                {session.summary?.split(' ')[0] ||
                                  'Web session'}
                              </span>

                              <span className="text-[10px] text-white/30 shrink-0">
                                {session.date}
                              </span>

                            </div>

                            <div className="flex items-center gap-3 mt-2">

                              <span className="text-[10px] text-white/35">
                                {session.duration}
                              </span>

                              <div className="h-1.5 flex-1 bg-white/[0.05] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#b7c4ff]/60 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${session.score}%`,
                                  }}
                                />
                              </div>

                              <span className="text-[10px] font-mono text-[#b7c4ff]">
                                {session.score}%
                              </span>

                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="py-12 text-center">

                      <div className="text-2xl mb-3 opacity-40">
                        ◌
                      </div>

                      <p className="text-xs text-white/35">
                        No audited sessions yet.
                      </p>

                      <p className="text-[10px] text-white/20 mt-1 max-w-sm mx-auto">
                        Browse with the extension to start building your
                        information profile.
                      </p>

                    </div>
                  )}

                </div>
              </div>

              {/* EXPLORE */}
              <div className="glass-dashboard rounded-[26px] p-6 relative overflow-hidden">

                <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 rounded-full bg-[#b7c4ff]/[0.06] blur-[50px]" />

                <div className="relative">

                  <p className="text-[10px] font-mono uppercase tracking-[.2em] text-[#b7c4ff]/60">
                    Explore
                  </p>

                  <h2 className="text-xl font-bold mt-2">
                    Break out of your bubble.
                  </h2>

                  <p className="text-xs text-white/35 mt-2 leading-relaxed">
                    Try something your algorithm doesn't normally recommend.
                  </p>

                  <div className="space-y-2 mt-6">

                    <ExploreItem
                      icon="◈"
                      title="Science"
                      subtitle="Discover new research"
                    />

                    <ExploreItem
                      icon="◇"
                      title="World News"
                      subtitle="See different perspectives"
                    />

                    <ExploreItem
                      icon="○"
                      title="Arts & Culture"
                      subtitle="Explore something unexpected"
                    />

                  </div>

                </div>
              </div>

            </section>

            {/* ACHIEVEMENTS */}
            <section className="glass-dashboard rounded-[26px] p-6 md:p-8">

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[.2em] text-[#b7c4ff]/60">
                    Progress
                  </p>

                  <h2 className="text-xl font-bold mt-2">
                    Your achievements
                  </h2>

                  <p className="text-xs text-white/35 mt-1">
                    Keep exploring to unlock new milestones.
                  </p>
                </div>

                <span className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                  3 / 4 unlocked
                </span>

              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">

                <Achievement
                  icon="✦"
                  title="Explorer"
                  description="First audit"
                  unlocked
                />

                <Achievement
                  icon="◎"
                  title="Seeker"
                  description="80%+ diversity"
                  unlocked
                />

                <Achievement
                  icon="⌕"
                  title="Detective"
                  description="5 feeds audited"
                  unlocked
                />

                <Achievement
                  icon="◇"
                  title="Bubble Buster"
                  description="30 day streak"
                  unlocked={false}
                />

              </div>
            </section>

            {/* SETTINGS */}
            {settings && (
              <section className="glass-dashboard rounded-[26px] p-6 md:p-8">

                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[.2em] text-[#b7c4ff]/60">
                    Preferences
                  </p>

                  <h2 className="text-xl font-bold mt-2">
                    Audit preferences
                  </h2>

                  <p className="text-xs text-white/35 mt-1">
                    Control how Invisible Algorithm keeps you informed.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mt-6">

                  <Setting
                    title="Browser notifications"
                    description="Alert when diversity is critically low."
                    enabled={settings.notifications}
                    onClick={() =>
                      handleToggleSetting(
                        'notifications',
                        settings.notifications
                      )
                    }
                  />

                  <Setting
                    title="Deep research insights"
                    description="Generate automated reflections."
                    enabled={settings.dark_mode}
                    onClick={() =>
                      handleToggleSetting(
                        'dark_mode',
                        settings.dark_mode
                      )
                    }
                  />

                  <Setting
                    title="Weekly reports"
                    description="Receive weekly analysis summaries."
                    enabled={settings.email_updates}
                    onClick={() =>
                      handleToggleSetting(
                        'email_updates',
                        settings.email_updates
                      )
                    }
                  />

                </div>
              </section>
            )}

            {/* DEVELOPER TOOLS */}
            <section>

              <button
                onClick={() =>
                  setShowDeveloperTools(!showDeveloperTools)
                }
                className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
              >
                <span className="text-[#b7c4ff]/50 group-hover:text-[#b7c4ff]">
                  {showDeveloperTools ? '−' : '+'}
                </span>

                {showDeveloperTools
                  ? 'Hide developer tools'
                  : 'Developer mode'}
              </button>

              {showDeveloperTools && (
                <div className="mt-4 glass-dashboard rounded-[26px] p-6">

                  <div className="mb-5">

                    <p className="text-[10px] font-mono uppercase tracking-[.2em] text-[#b7c4ff]/60">
                      Developer console
                    </p>

                    <h2 className="text-xl font-bold mt-2">
                      Extension Simulator
                    </h2>

                    <p className="text-xs text-white/35 mt-1">
                      Send test telemetry to your backend.
                    </p>

                  </div>

                  <form
                    onSubmit={handleSimulateSubmit}
                    className="grid md:grid-cols-2 gap-4"
                  >

                    <input
                      value={simWebsite}
                      onChange={(e) =>
                        setSimWebsite(e.target.value)
                      }
                      placeholder="Website"
                      className="bg-white/[0.035] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#b7c4ff]/40"
                    />

                    <input
                      type="number"
                      value={simDuration}
                      onChange={(e) =>
                        setSimDuration(Number(e.target.value))
                      }
                      placeholder="Duration"
                      className="bg-white/[0.035] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#b7c4ff]/40"
                    />

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={simScore}
                      onChange={(e) =>
                        setSimScore(Number(e.target.value))
                      }
                      placeholder="Diversity score"
                      className="bg-white/[0.035] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#b7c4ff]/40"
                    />

                    <textarea
                      value={simReflection}
                      onChange={(e) =>
                        setSimReflection(e.target.value)
                      }
                      rows={1}
                      placeholder="Reflection"
                      className="bg-white/[0.035] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#b7c4ff]/40"
                    />

                    <button
                      type="submit"
                      disabled={simulating}
                      className="md:col-span-2 bg-[#b7c4ff] text-[#0a1220] font-bold text-xs rounded-xl py-3 hover:brightness-110 active:scale-[.99] transition-all disabled:opacity-50"
                    >
                      {simulating
                        ? 'Sending telemetry...'
                        : 'Send simulation payload'}
                    </button>

                  </form>

                  {simSuccess && (
                    <div className="mt-4 text-center text-xs text-emerald-400 bg-emerald-400/[0.06] border border-emerald-400/10 rounded-xl py-3">
                      ✓ Telemetry successfully synchronized.
                    </div>
                  )}

                </div>
              )}

            </section>

          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-500/[0.06] border border-red-500/15 rounded-xl p-4 flex justify-between items-center">
            <span className="text-xs text-red-300">
              {error}
            </span>

            <button
              onClick={fetchDashboard}
              className="text-xs font-bold text-red-300 underline"
            >
              Retry
            </button>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] bg-[#060C17]">

        <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row justify-between gap-4">

          <div>
            <p className="text-sm font-semibold">
              The Invisible Algorithm
            </p>

            <p className="text-[10px] text-white/25 mt-1">
              Making the invisible visible.
            </p>
          </div>

          <div className="flex gap-5 text-xs text-white/30">

            <button
              onClick={() => onNavigate('landing')}
              className="hover:text-white transition-colors"
            >
              Home
            </button>

            <button
              onClick={() => onNavigate('download')}
              className="hover:text-white transition-colors"
            >
              Download
            </button>

            <span>© 2026</span>

          </div>

        </div>
      </footer>
    </div>
  );
}

/* =============================================================
   SMALL REUSABLE UI COMPONENTS
============================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="dashboard-entry dashboard-card glass-dashboard rounded-2xl p-5">

      <div className="flex items-center gap-3">

        <div className="w-9 h-9 rounded-xl bg-[#b7c4ff]/[0.07] border border-[#b7c4ff]/10 flex items-center justify-center text-[#b7c4ff]">
          {icon}
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
          {label}
        </span>

      </div>

      <div className="mt-5">

        <p className="text-2xl font-bold tracking-tight">
          {value}
        </p>

        <p className="text-[10px] text-white/30 mt-1">
          {description}
        </p>

      </div>
    </div>
  );
}

function ExploreItem({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <button className="w-full group flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.045] hover:bg-[#b7c4ff]/[0.06] hover:border-[#b7c4ff]/15 transition-all text-left">

      <div className="w-9 h-9 rounded-lg bg-[#b7c4ff]/[0.07] text-[#b7c4ff] flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1">

        <p className="text-xs font-semibold">
          {title}
        </p>

        <p className="text-[9px] text-white/30 mt-0.5">
          {subtitle}
        </p>

      </div>

      <span className="text-white/20 group-hover:text-[#b7c4ff] group-hover:translate-x-1 transition-all">
        →
      </span>

    </button>
  );
}

function Achievement({
  icon,
  title,
  description,
  unlocked,
}: {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        unlocked
          ? 'bg-[#b7c4ff]/[0.045] border-[#b7c4ff]/10'
          : 'bg-white/[0.015] border-white/[0.045] opacity-45'
      }`}
    >

      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
          unlocked
            ? 'bg-[#b7c4ff]/10 text-[#b7c4ff]'
            : 'bg-white/[0.04] text-white/30'
        }`}
      >
        {icon}
      </div>

      <p className="text-xs font-bold mt-4">
        {title}
      </p>

      <p className="text-[9px] text-white/30 mt-1">
        {description}
      </p>

      {unlocked && (
        <p className="text-[9px] text-emerald-400 mt-3">
          ✓ Unlocked
        </p>
      )}

    </div>
  );
}

function Setting({
  title,
  description,
  enabled,
  onClick,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.025] border border-white/[0.05]">

      <div>
        <p className="text-xs font-semibold">
          {title}
        </p>

        <p className="text-[9px] text-white/30 mt-1">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 w-10 h-6 rounded-full p-1 transition-all ${
          enabled
            ? 'bg-[#b7c4ff]'
            : 'bg-white/[0.08]'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
            enabled
              ? 'translate-x-4'
              : 'translate-x-0'
          }`}
        />
      </button>

    </div>
  );
}
