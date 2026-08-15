import { useState, useEffect, FormEvent } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { DashboardData, Settings } from '../types';

interface DashboardPageProps {
  onNavigate: (page: 'landing' | 'download' | 'auth' | 'dashboard') => void;
  onLogout: () => void;
  userName: string;
}

export default function DashboardPage({ onNavigate, onLogout, userName }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulator Form State
  const [simWebsite, setSimWebsite] = useState('youtube.com');
  const [simDuration, setSimDuration] = useState(45); // minutes
  const [simScore, setSimScore] = useState(72);
  const [simReflection, setSimReflection] = useState('Deep dive into scientific recommendation recommendations, breaking out of typical political feed.');
  const [simulating, setSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<Settings | null>(null);

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

  const handleToggleSetting = async (key: keyof Settings, currentValue: boolean) => {
    if (!settings) return;
    try {
      const updated = await api.updateSettings({ [key]: !currentValue });
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
      // Convert minutes to seconds
      const seconds = simDuration * 60;
      await api.simulateExtensionActivity(simWebsite, seconds, simScore, simReflection);
      setSimSuccess(true);
      // Re-fetch to show new data on charts & logs
      await fetchDashboard();
      setTimeout(() => setSimSuccess(false), 3000);
    } catch (err: any) {
      console.error('Simulation failed:', err);
      alert('Simulation failed: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Convert scores to recharts format
  const chartData = data?.recentSessions ? [...data.recentSessions].reverse().map((session, index) => ({
    name: session.date,
    Score: session.score,
  })) : [
    { name: 'Oct 20', Score: 60 },
    { name: 'Oct 21', Score: 65 },
    { name: 'Oct 22', Score: 54 },
    { name: 'Oct 23', Score: 82 },
    { name: 'Oct 24', Score: 68 },
  ];

  return (
    <div className="font-body-md text-body-md bg-surface-dim text-on-surface min-h-screen">
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
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-white hidden sm:inline">{userName}</span>
            </div>
            <button 
              onClick={onLogout}
              className="border border-white/10 px-4 py-2 rounded-lg font-label-md text-xs hover:bg-white/5 transition-all text-on-surface cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Area */}
      <main className="pt-28 pb-16 px-container-padding-desktop max-w-[1280px] mx-auto space-y-8">
        
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display-lg text-3xl font-bold text-white tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-on-surface-variant">
              Analyzing real-time recommendations and audit logs submitted via browser extension.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Extension Hook: Live Connection
          </span>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 text-error text-sm rounded-xl p-4 flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <span className="material-symbols-outlined" data-icon="error">error</span>
              <span>{error}</span>
            </div>
            <button onClick={fetchDashboard} className="text-xs font-bold underline cursor-pointer">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-on-surface-variant font-mono">Syncing analytics from storage...</p>
          </div>
        ) : (
          <>
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg">
              {/* Card 1: Echo Chamber Score */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant font-mono uppercase tracking-widest">Feed Diversity</span>
                    <span className="material-symbols-outlined text-primary text-xl" data-icon="diversity_3">dashboard_customize</span>
                  </div>
                  <div className="flex items-baseline gap-2 pt-4">
                    <span className="text-5xl font-black text-white">{data?.echoChamberScore}%</span>
                    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-bold">
                      {data?.diversityLabel}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  Average recommendation variety across active sessions. Higher means a more diverse content feed.
                </div>
              </div>

              {/* Card 2: Browsing Time */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant font-mono uppercase tracking-widest">Audited Time</span>
                    <span className="material-symbols-outlined text-secondary text-xl" data-icon="timer">timer</span>
                  </div>
                  <div className="flex items-baseline gap-2 pt-4">
                    <span className="text-4xl font-bold text-white">{data?.browsingTimeText}</span>
                  </div>
                </div>
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  Total cumulative web surfing duration active with running content recommendation audits.
                </div>
              </div>

              {/* Card 3: Current Streak */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant font-mono uppercase tracking-widest">Streak Days</span>
                    <span className="material-symbols-outlined text-tertiary text-xl" data-icon="local_fire_department">local_fire_department</span>
                  </div>
                  <div className="flex items-baseline gap-2 pt-4">
                    <span className="text-4xl font-bold text-white">{data?.currentStreakDays} Days</span>
                  </div>
                </div>
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  Consecutive days auditing feeds and seeking fresh perspectives. Keep it up!
                </div>
              </div>
            </div>

            {/* Middle Section: Chart & Reflection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
              {/* Column 1 & 2: Chart Card */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 lg:col-span-2 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white font-headline-md">Historical Feed Diversity</h3>
                  <p className="text-xs text-on-surface-variant">Visualizing your information bubbles across recent audited sessions.</p>
                </div>
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b7c4ff" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#b7c4ff" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#8e90a0" fontSize={10} tickLine={false} />
                      <YAxis stroke="#8e90a0" fontSize={10} domain={[0, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1c2d', borderColor: '#273647', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#b7c4ff', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="Score" stroke="#b7c4ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Column 3: Reflection & AI Insight Summary */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-white font-headline-md">Reflection Summary</h3>
                  <p className="text-xs text-on-surface-variant">Synthesized patterns from audited recommendations.</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 relative overflow-hidden flex-grow flex items-center justify-center">
                  <span className="absolute top-3 left-3 text-2xl text-primary font-serif select-none opacity-40">“</span>
                  <p className="text-sm italic text-on-surface-variant leading-relaxed text-center px-2">
                    {data?.reflectionSummary.replace(/"/g, '')}
                  </p>
                  <span className="absolute bottom-1 right-3 text-2xl text-primary font-serif select-none opacity-40">”</span>
                </div>
                <div className="text-xs text-on-surface-variant flex gap-2 items-center bg-primary/10 border border-primary/20 rounded-lg p-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="lightbulb">lightbulb</span>
                  <span>Your bubble is 12% wider than last week! Try exploring scientific journals.</span>
                </div>
              </div>
            </div>

            {/* Logs Table & Simulator Console */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
              
              {/* Sessions Logs Table */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 lg:col-span-2 space-y-4">
                <div>
                  <h3 className="font-bold text-white font-headline-md">Recent Audited Sessions</h3>
                  <p className="text-xs text-on-surface-variant">Real-time summaries sent directly from the browser extension.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-xs font-mono text-on-surface-variant">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Website</th>
                        <th className="py-3 px-2">Duration</th>
                        <th className="py-3 px-2 text-right">Diversity Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {data?.recentSessions && data.recentSessions.length > 0 ? (
                        data.recentSessions.map((session, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-2 text-on-surface-variant">{session.date}</td>
                            <td className="py-3 px-2 font-mono text-xs text-white">{session.summary.split(' ')[0] || 'social'}</td>
                            <td className="py-3 px-2 text-on-surface-variant">{session.duration}</td>
                            <td className="py-3 px-2 text-right">
                              <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded-full ${
                                session.score > 70 ? 'bg-emerald-500/10 text-emerald-400' :
                                session.score > 45 ? 'bg-amber-500/10 text-amber-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>
                                {session.score}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-xs text-on-surface-variant">No audited sessions recorded yet. Run the Simulator or browse to add telemetry!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extension Simulator Console */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-white font-headline-md">Extension Simulator</h3>
                  <p className="text-xs text-on-surface-variant">Simulate extension data payload logs sent to your backend database hooks.</p>
                </div>

                <form onSubmit={handleSimulateSubmit} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-on-surface-variant block mb-1">Target Website</label>
                    <input 
                      type="text" 
                      value={simWebsite}
                      onChange={(e) => setSimWebsite(e.target.value)}
                      placeholder="e.g. youtube.com, twitter.com"
                      className="w-full bg-surface-container-low border border-white/10 rounded-lg text-xs px-3 py-2 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-on-surface-variant block mb-1">Duration (Mins)</label>
                      <input 
                        type="number" 
                        value={simDuration}
                        onChange={(e) => setSimDuration(Number(e.target.value))}
                        className="w-full bg-surface-container-low border border-white/10 rounded-lg text-xs px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-on-surface-variant block mb-1">Diversity Score (%)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={simScore}
                        onChange={(e) => setSimScore(Number(e.target.value))}
                        className="w-full bg-surface-container-low border border-white/10 rounded-lg text-xs px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-on-surface-variant block mb-1">Audit Log Reflection Summary</label>
                    <textarea 
                      value={simReflection}
                      onChange={(e) => setSimReflection(e.target.value)}
                      rows={2}
                      className="w-full bg-surface-container-low border border-white/10 rounded-lg text-xs px-3 py-2 text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  {simSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-lg p-2 text-center">
                      ✓ Session data synced securely. Refreshed charts.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={simulating}
                    className="w-full bg-secondary hover:brightness-110 active:scale-95 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:scale-100"
                  >
                    <span className="material-symbols-outlined text-sm" data-icon="send">send</span>
                    <span>{simulating ? 'Sending payload...' : 'Send Simulation Payload'}</span>
                  </button>
                </form>
              </div>
            </div>
                        {/* Content Category Breakdown */}
            <div className="glass p-stack-lg rounded-2xl border border-white/5 space-y-5">
              <div>
                <h3 className="font-bold text-white font-headline-md">
                  Content Categories
                </h3>
                <p className="text-xs text-on-surface-variant">
                  What your recommendations are mostly about.
                </p>
              </div>

              <div className="space-y-4">
                {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                  data.categoryBreakdown.map((item) => {
                    const total = data.categoryBreakdown.reduce(
                      (sum, category) => sum + category.count,
                      0
                    );

                    const percentage =
                      total > 0 ? Math.round((item.count / total) * 100) : 0;

                    return (
                      <div key={item.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white">
                            {item.category}
                          </span>
                          <span className="text-xs text-on-surface-variant font-mono">
                            {item.count} {item.count === 1 ? 'Reel' : 'Reels'} · {percentage}%
                          </span>
                        </div>

                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-on-surface-variant">
                    No categorised Reels yet. Browse a few Reels with the extension
                    enabled to start building your profile.
                  </p>
                )}
              </div>
            </div>


            {/* Achievements & Badges & Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
              
              {/* Unlocked Badges */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 lg:col-span-2 space-y-4">
                <div>
                  <h3 className="font-bold text-white font-headline-md">Unlocked Audit Achievements</h3>
                  <p className="text-xs text-on-surface-variant">Earn badges automatically as you expand your recommendations horizon.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/20 shadow-lg">
                      <span className="material-symbols-outlined" data-icon="explore">explore</span>
                    </div>
                    <span className="font-bold text-white text-xs">Explorer</span>
                    <span className="text-[10px] text-on-surface-variant">First audit completed</span>
                  </div>
                  <div className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center border border-secondary/20 shadow-lg">
                      <span className="material-symbols-outlined" data-icon="groups">groups</span>
                    </div>
                    <span className="font-bold text-white text-xs">Seeker</span>
                    <span className="text-[10px] text-on-surface-variant">Diversity {'>'} 80% once</span>
                  </div>
                  <div className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-tertiary-fixed-dim/20 text-tertiary flex items-center justify-center border border-tertiary/20 shadow-lg">
                      <span className="material-symbols-outlined" data-icon="search">psychology</span>
                    </div>
                    <span className="font-bold text-white text-xs">Detective</span>
                    <span className="text-[10px] text-on-surface-variant">5+ feeds audited</span>
                  </div>
                  <div className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex flex-col items-center text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center border border-white/10">
                      <span className="material-symbols-outlined" data-icon="workspace_premium">mindfulness</span>
                    </div>
                    <span className="font-bold text-on-surface-variant text-xs">Bubble Buster</span>
                    <span className="text-[10px] text-on-surface-variant">Audit streak of 30 days</span>
                  </div>
                </div>
              </div>

              {/* Quick Settings */}
              <div className="glass p-stack-lg rounded-2xl border border-white/5 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-white font-headline-md">Audit Preferences</h3>
                  <p className="text-xs text-on-surface-variant">Configure details of your background extension monitoring.</p>
                </div>
                
                {settings && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white">Browser Notifications</span>
                        <p className="text-[10px] text-on-surface-variant">Alert when diversity is critically low.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleToggleSetting('notifications', settings.notifications)}
                        className={`w-10 h-6 rounded-full p-1 transition-all ${settings.notifications ? 'bg-primary flex justify-end' : 'bg-white/10 flex justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white">Deep Research Insights</span>
                        <p className="text-[10px] text-on-surface-variant">Enable automated reflection generation.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleToggleSetting('dark_mode', settings.dark_mode)}
                        className={`w-10 h-6 rounded-full p-1 transition-all ${settings.dark_mode ? 'bg-primary flex justify-end' : 'bg-white/10 flex justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white">Weekly Email Reports</span>
                        <p className="text-[10px] text-on-surface-variant">Send weekly analysis summaries.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleToggleSetting('email_updates', settings.email_updates)}
                        className={`w-10 h-6 rounded-full p-1 transition-all ${settings.email_updates ? 'bg-primary flex justify-end' : 'bg-white/10 flex justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-6 border-t border-outline-variant/20 mt-12">
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-semibold text-white text-sm">The Invisible Algorithm</div>
            <p className="text-xs text-on-surface-variant">© 2024 The Invisible Algorithm. All rights reserved.</p>
          </div>
          <div className="flex gap-4 text-xs text-on-surface-variant">
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => onNavigate('landing')}>Home</span>
            <span>•</span>
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => onNavigate('download')}>Download</span>
            <span>•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Support API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
