import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, BrowsingSession, FeedScore, Achievement, Settings, DashboardData } from '../src/types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase Client initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase Client:', err);
  }
} else {
  console.log('⚠️ SUPABASE_URL and/or SUPABASE_ANON_KEY not configured.');
  console.log('⚠️ Operating in high-fidelity local in-memory fallback mode.');
}

// In-Memory Database Fallback Store
const memoryStore = {
  users: new Map<string, User>([
    [
      'mock-user-id-123',
      {
        id: 'mock-user-id-123',
        full_name: 'Alex Mercer',
        email: 'alex@example.com',
        avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxU7GN8fYHccJ7d5uSUrZ9nSlXlCqtpeGq4O59wQ8AsE5wHUsYYZKfaXXst3DmDQAKC19qM5kBhQqQ1WNhmrVunX5Y6DWawfxX91T14l-sTqH6uhLzi2ywHL8NFlT-t1n7A9ERAQIOBTqDn5CCrNdEUgvd2GnjBTke1gqaxwbWXrHs4VE59bAGx1C9MkN2oL2lT_cVAN4l2i5bWZ_AGuZ4FKdwcXxWM34IA5b-xAVksmEi4eDcnKb0',
        created_at: new Date().toISOString()
      }
    ]
  ]),
  credentials: new Map<string, string>([
    ['alex@example.com', 'password123'] // email -> password
  ]),
  tokens: new Map<string, string>([
    ['mock-session-token-123', 'mock-user-id-123'] // token -> user_id
  ]),
  sessions: new Array<BrowsingSession>(
    {
      id: 'sess-1',
      user_id: 'mock-user-id-123',
      website: 'twitter.com',
      start_time: new Date(Date.now() - 3600000).toISOString(),
      end_time: new Date().toISOString(),
      browsing_duration: 2700, // 45m
    },
    {
      id: 'sess-2',
      user_id: 'mock-user-id-123',
      website: 'youtube.com',
      start_time: new Date(Date.now() - 7200000).toISOString(),
      end_time: new Date(Date.now() - 3600000).toISOString(),
      browsing_duration: 4320, // 1h 12m
    },
    {
      id: 'sess-3',
      user_id: 'mock-user-id-123',
      website: 'facebook.com',
      start_time: new Date(Date.now() - 15000000).toISOString(),
      end_time: new Date(Date.now() - 12000000).toISOString(),
      browsing_duration: 2280, // 38m
    }
  ),
  feedScores: new Array<FeedScore>(
    {
      id: 'score-1',
      session_id: 'sess-1',
      diversity_score: 68,
      reflection: 'Heavy focus on AI and Space.',
      created_at: new Date().toISOString()
    },
    {
      id: 'score-2',
      session_id: 'sess-2',
      diversity_score: 82,
      reflection: 'Social media bubble intensification.',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'score-3',
      session_id: 'sess-3',
      diversity_score: 54,
      reflection: 'Productive educational exploration.',
      created_at: new Date(Date.now() - 12000000).toISOString()
    }
  ),
  achievements: new Array<Achievement>(
    {
      id: 'ach-1',
      user_id: 'mock-user-id-123',
      badge_name: 'Explorer',
      unlocked_at: new Date().toISOString()
    },
    {
      id: 'ach-2',
      user_id: 'mock-user-id-123',
      badge_name: 'Seeker',
      unlocked_at: new Date().toISOString()
    },
    {
      id: 'ach-3',
      user_id: 'mock-user-id-123',
      badge_name: 'Detective',
      unlocked_at: new Date().toISOString()
    },
    {
      id: 'ach-4',
      user_id: 'mock-user-id-123',
      badge_name: 'Mindful',
      unlocked_at: new Date().toISOString()
    }
  ),
  settings: new Map<string, Settings>([
    [
      'mock-user-id-123',
      {
        id: 'set-1',
        user_id: 'mock-user-id-123',
        notifications: true,
        dark_mode: true,
        email_updates: false
      }
    ]
  ])
};

// Database Service Class
export class DbService {
  /**
   * Validates a JWT or session token. Returns User if valid, or null.
   */
  static async verifyToken(token: string): Promise<User | null> {
    if (supabase) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        return null;
      }
      
      // Get the profile from the Users table
      const { data: profile } = await supabase
        .from('Users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        return profile as User;
      }

      // Fallback: build user from auth payload
      return {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || 'User',
        email: data.user.email || '',
        avatar_url: data.user.user_metadata?.avatar_url || '',
        created_at: data.user.created_at
      };
    } else {
      const userId = memoryStore.tokens.get(token);
      if (userId) {
        return memoryStore.users.get(userId) || null;
      }
      return null;
    }
  }

  /**
   * Signs up a new user
   */
  static async signUp(email: string, fullName: string, passwordHash: string): Promise<{ user: User | null; token: string | null; error: string | null }> {
    if (supabase) {
      // Supabase Auth sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password: passwordHash,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error || !data.user) {
        return { user: null, token: null, error: error?.message || 'Failed to sign up' };
      }

      const newUser: User = {
        id: data.user.id,
        full_name: fullName,
        email,
        avatar_url: '',
        created_at: data.user.created_at
      };

      // Store in Users profiles table (ignore if triggers exist in Supabase schema)
      await supabase.from('Users').upsert([newUser]);

      // Initialize Settings
      const defaultSettings = {
        user_id: data.user.id,
        notifications: true,
        dark_mode: true,
        email_updates: false
      };
      await supabase.from('Settings').insert([defaultSettings]);

      // Return session access token if available, otherwise confirm verification email needed
      const token = data.session?.access_token || 'mock-verification-required-token';
      return { user: newUser, token, error: null };
    } else {
      // Memory Store logic
      if (memoryStore.credentials.has(email)) {
        return { user: null, token: null, error: 'User already exists' };
      }

      const id = 'user-' + Math.random().toString(36).substr(2, 9);
      const newUser: User = {
        id,
        full_name: fullName,
        email,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        created_at: new Date().toISOString()
      };

      memoryStore.users.set(id, newUser);
      memoryStore.credentials.set(email, passwordHash);
      
      const token = 'token-' + Math.random().toString(36).substr(2, 9);
      memoryStore.tokens.set(token, id);

      // Create Settings
      memoryStore.settings.set(id, {
        id: 'set-' + Math.random().toString(36).substr(2, 9),
        user_id: id,
        notifications: true,
        dark_mode: true,
        email_updates: false
      });

      return { user: newUser, token, error: null };
    }
  }

  /**
   * Logs in a user
   */
  static async login(email: string, passwordHash: string): Promise<{ user: User | null; token: string | null; error: string | null }> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordHash
      });

      if (error || !data.user || !data.session) {
        return { user: null, token: null, error: error?.message || 'Login failed' };
      }

      // Fetch Profile
      const { data: profile } = await supabase
        .from('Users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const user: User = profile ? (profile as User) : {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || 'User',
        email: data.user.email || '',
        avatar_url: data.user.user_metadata?.avatar_url || '',
        created_at: data.user.created_at
      };

      return { user, token: data.session.access_token, error: null };
    } else {
      const savedPassword = memoryStore.credentials.get(email);
      if (!savedPassword || savedPassword !== passwordHash) {
        return { user: null, token: null, error: 'Invalid email or password' };
      }

      // Find user
      let matchedUser: User | null = null;
      for (const u of memoryStore.users.values()) {
        if (u.email === email) {
          matchedUser = u;
          break;
        }
      }

      if (!matchedUser) {
        return { user: null, token: null, error: 'User profile not found' };
      }

      const token = 'token-' + Math.random().toString(36).substr(2, 9);
      memoryStore.tokens.set(token, matchedUser.id);

      return { user: matchedUser, token, error: null };
    }
  }

  /**
   * Log out
   */
  static async logout(token: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      return !error;
    } else {
      return memoryStore.tokens.delete(token);
    }
  }

  /**
   * Gets user settings
   */
  static async getSettings(userId: string): Promise<Settings> {
    if (supabase) {
      const { data, error } = await supabase
        .from('Settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        return data as Settings;
      }

      // If missing, initialize
      const defaultSettings = {
        user_id: userId,
        notifications: true,
        dark_mode: true,
        email_updates: false
      };
      const { data: inserted } = await supabase
        .from('Settings')
        .insert([defaultSettings])
        .select()
        .single();

      return (inserted || defaultSettings) as Settings;
    } else {
      let userSettings = memoryStore.settings.get(userId);
      if (!userSettings) {
        userSettings = {
          id: 'set-' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          notifications: true,
          dark_mode: true,
          email_updates: false
        };
        memoryStore.settings.set(userId, userSettings);
      }
      return userSettings;
    }
  }

  /**
   * Updates settings
   */
  static async updateSettings(userId: string, updates: Partial<Settings>): Promise<Settings> {
    if (supabase) {
      const { data, error } = await supabase
        .from('Settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Settings;
    } else {
      const current = await this.getSettings(userId);
      const updated = { ...current, ...updates };
      memoryStore.settings.set(userId, updated);
      return updated;
    }
  }

  /**
   * Returns list of user's browsing sessions, with nested feed scores if available
   */
  static async getSessions(userId: string, token: string): Promise<BrowsingSession[]> {
    if (supabase) {
      const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
      console.log('DB INSERT USER ID:', userId);
      const { data: sessions, error: sErr } = await userSupabase
        .from('BrowsingSessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });
      console.log('🔎 SESSIONS FETCH FINISHED', { count: sessions?.length || 0, sErr });
      if (sErr) {
       console.error('❌ ERROR FETCHING BROWSING SESSIONS:', sErr);
      return [];
      }

      console.log('✅ BROWSING SESSIONS FOUND:', sessions?.length || 0);

      // Fetch feed scores for these sessions
      const sessionIds = sessions.map(s => s.id);
      const { data: scores } = await userSupabase
        .from('FeedScores')
        .select('*')
        .in('session_id', sessionIds);

      return sessions.map(session => {
        const matchingScore = scores?.find(sc => sc.session_id === session.id);
        return {
          ...session,
          feed_score: matchingScore || undefined
        };
      });
    } else {
      return memoryStore.sessions
        .filter(s => s.user_id === userId)
        .map(session => {
          const feed_score = memoryStore.feedScores.find(fs => fs.session_id === session.id);
          return {
            ...session,
            feed_score
          };
        })
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    }
  }

  /**
   * Returns achievements unlocked by a user
   */
  static async getAchievements(userId: string, token: string): Promise<Achievement[]> {
    if (supabase) {
      const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
          const { data, error } = await userSupabase
        .from('Achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });
        console.log('🏆 ACHIEVEMENTS FETCHED:', { count: data?.length || 0, error, data });
      return (data || []) as Achievement[];
    } else {
      return memoryStore.achievements
        .filter(a => a.user_id === userId)
        .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime());
    }
  }

  /**
   * Compiles complete dashboard analytics for a user
   */
    static async getDashboardData(userId: string, token: string): Promise<DashboardData> {
    const sessions = await this.getSessions(userId, token);
      const achievements = await this.getAchievements(userId, token);
      const settings = await this.getSettings(userId);
      const { data: reels, error: reelsError } = await supabase
    .from('Reels')
    .select('category')
    .eq('user_id', userId);

    if (reelsError) {
      console.error('Error fetching Reel categories:', reelsError);
    }

    const categoryCounts: Record<string, number> = {};

    (reels || []).forEach((reel: { category: string | null }) => {
    const category = reel.category || 'Other';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

  const categoryBreakdown = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

      // Calculate metrics
  let totalDuration = 0;

  sessions.forEach(s => {
    totalDuration += s.browsing_duration;
  });

  // Current diversity = average of the 7 most recent scored sessions
  const recentScoredSessions = sessions
    .filter(s => s.feed_score)
    .slice(0, 7);

  const averageScore =
    recentScoredSessions.length > 0
      ? Math.round(
          recentScoredSessions.reduce(
            (sum, s) => sum + s.feed_score!.diversity_score,
            0
          ) / recentScoredSessions.length
        )
      : 0;

      const browsingHours = Math.floor(totalDuration / 3600);
      const browsingMinutes = Math.floor((totalDuration % 3600) / 60);

      let browsingTimeText = '';
      if (browsingHours > 0) {
        browsingTimeText = `${browsingHours}h ${browsingMinutes}m`;
      } else {
        browsingTimeText = `${browsingMinutes}m`;
      }
      if (browsingTimeText === '0m') {
        browsingTimeText = '0m';
      }

    // Latest reflection summary
    const reflections = sessions
      .filter(s => s.feed_score?.reflection)
      .map(s => s.feed_score!.reflection);
    
    let reflectionSummary = '';
    if (reflections.length > 0) {
      reflectionSummary = `"${reflections[0]}"`;
    }

    // Dynamic recent sessions — one point per day
const dailySessions = new Map<string, {
  totalScore: number;
  count: number;
  duration: number;
}>();

sessions.forEach(s => {
  const dateKey = new Date(s.start_time).toISOString().slice(0, 10);

  const existing = dailySessions.get(dateKey) || {
    totalScore: 0,
    count: 0,
    duration: 0
  };

  existing.totalScore += s.feed_score?.diversity_score ?? 60;
  existing.count += 1;
  existing.duration += s.browsing_duration;

  dailySessions.set(dateKey, existing);
});

const recentSessions = [...dailySessions.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .slice(-7)
  .map(([dateKey, day]) => {
    const date = new Date(`${dateKey}T00:00:00Z`).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    );

    const durationMins = Math.round(day.duration / 60);

    const duration = durationMins >= 60
      ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
      : `${durationMins}m`;

    return {
      date,
      duration,
      score: Math.round(day.totalScore / day.count),
      summary: `${day.count} browsing session${day.count === 1 ? '' : 's'}`
    };
  });

    // Handle defaults if empty
    const finalRecentSessions = recentSessions;
    const totalSessions = sessions.length;

    // Current streak (for simplicity, we return a mockup or computed streak)
    console.log('🔢 SESSION COUNT FOR STREAK:', sessions.length);

    const sessionDates = new Set(
      sessions.map(s =>
        new Date(s.start_time).toISOString().slice(0, 10)
      )
    );

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    let currentStreakDays = 0;

    let startOffset = sessionDates.has(todayKey) ? 0 : 1;

    for (let i = startOffset; i < sessions.length + 2; i++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - i);

      const dateKey = date.toISOString().slice(0, 10);

      if (sessionDates.has(dateKey)) {
        currentStreakDays++;
      } else {
        break;
      }
    }

    console.log('📅 TODAY:', todayKey);
    console.log('📅 SESSION DATES:', [...sessionDates]);
    console.log('🔥 CURRENT STREAK:', currentStreakDays);

    return {
      echoChamberScore: averageScore,
      totalSessions,
      categoryBreakdown,
      diversityLabel: averageScore > 70 ? 'High' : averageScore > 40 ? 'Moderate' : 'Low',
      diversityChange: (() => {
        if (recentSessions.length < 2) return 'No change yet';

        const midpoint = Math.floor(recentSessions.length / 2);

       const olderSessions = recentSessions.slice(0, midpoint);
        const newerSessions = recentSessions.slice(midpoint);

        const olderAverage =
        olderSessions.reduce((sum, s) => sum + s.score, 0) /
        olderSessions.length;

        const newerAverage =
        newerSessions.reduce((sum, s) => sum + s.score, 0) /
        newerSessions.length;

        if (olderAverage === 0) return 'No change yet';

        const change = Math.round(
          ((newerAverage - olderAverage) / olderAverage) * 100
        );

       return change > 0
        ? `+${change}% this week`
        : `${change}% this week`;
      })(),
      browsingTimeText,
      currentStreakDays,
      reflectionSummary,
      recentSessions: finalRecentSessions,
      achievements,
      settings,
    };
  }

  /**
   * Extends browsed summary database record. Used by the browser extension APIs.
   */
  static async recordExtensionActivity(
    userId: string,
    website: string,
    durationSeconds: number,
    diversityScore: number,
    reflectionSummary: string,
    token: string
  ): Promise<boolean> {
    const startTime = new Date(Date.now() - durationSeconds * 1000).toISOString();
    const endTime = new Date().toISOString();

    if (supabase) {
      const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
      console.log('DEBUG USER ID:', userId);
      console.log('DEBUG SUPABASE INSERT USER ID:', userId);
      // 1. Create BrowsingSession
      const { data: session, error: sErr } = await userSupabase
        .from('BrowsingSessions')
        .insert([{
          user_id: userId,
          website,
          start_time: startTime,
          end_time: endTime,
          browsing_duration: durationSeconds
        }])
        .select()
        .single();

      if (sErr || !session) {
        console.error('Error creating browsing session:', sErr);
        return false;
      }

      // 2. Create FeedScore
      const { error: fErr } = await userSupabase
        .from('FeedScores')
        .insert([{
          session_id: session.id,
          diversity_score: diversityScore,
          reflection: reflectionSummary
        }]);

      if (fErr) {
        console.error('Error creating feed score:', fErr);
        return false;
      }

      // 3. Check and unlock achievements
const { count: sessionCount } = await userSupabase
  .from('BrowsingSessions')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);

const achievementsToUnlock: string[] = [];

if ((sessionCount || 0) >= 5) {
  achievementsToUnlock.push('Explorer');
}

if (diversityScore >= 80) {
  achievementsToUnlock.push('Seeker');
}

if (diversityScore >= 90) {
  achievementsToUnlock.push('Diversity Champion');
}

if ((sessionCount || 0) >= 10) {
  achievementsToUnlock.push('Detective');
}

for (const badgeName of achievementsToUnlock) {
  const { data: existing } = await userSupabase
    .from('Achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_name', badgeName)
    .maybeSingle();

  if (!existing) {
     const { error: achievementError } = await userSupabase
      .from('Achievements')
      .insert([{
        user_id: userId,
        badge_name: badgeName,
        unlocked_at: new Date().toISOString()
      }]);

    if (achievementError) {
      if (achievementError.code === '23505') {
        console.log(`ℹ️ Achievement already unlocked: ${badgeName}`);
      } else {
        console.error(`Error unlocking ${badgeName}:`, achievementError);
      }
    } else {
      console.log(`🏆 Achievement unlocked: ${badgeName}`);
    }
  }
}
      return true;
    } else {
      // Memory Store logic
      const id = 'sess-' + Math.random().toString(36).substr(2, 9);
      const newSession: BrowsingSession = {
        id,
        user_id: userId,
        website,
        start_time: startTime,
        end_time: endTime,
        browsing_duration: durationSeconds
      };

      const scoreId = 'score-' + Math.random().toString(36).substr(2, 9);
      const newFeedScore: FeedScore = {
        id: scoreId,
        session_id: id,
        diversity_score: diversityScore,
        reflection: reflectionSummary,
        created_at: new Date().toISOString()
      };

      memoryStore.sessions.unshift(newSession);
      memoryStore.feedScores.unshift(newFeedScore);

      // Randomly trigger standard badges based on count of sessions
      const unlockedCount = memoryStore.achievements.filter(a => a.user_id === userId).length;
      if (unlockedCount < 4 && memoryStore.sessions.filter(s => s.user_id === userId).length >= 5) {
        memoryStore.achievements.push({
          id: 'ach-' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          badge_name: 'Detective',
          unlocked_at: new Date().toISOString()
        });
      }

      return true;
    }
  }
  
static categorizeReel(
  caption: string | null,
  hashtags: string[]
): string {
  const text = `${caption || ''} ${hashtags.join(' ')}`.toLowerCase();

  if (/study|learn|education|exam|college|school|tutorial|coding|programming|science|math/.test(text)) {
    return 'Education';
  }

  if (/gym|fitness|workout|health|running|yoga|weight|exercise|nursing|doctor|medical/.test(text)) {
    return 'Health & Fitness';
  }

  if (/recipe|food|cooking|cook|travel|fashion|beauty|makeup|lifestyle|outfit/.test(text)) {
    return 'Food & Lifestyle';
  }

  if (/song|music|sing|singer|guitar|piano|cover|dance/.test(text)) {
    return 'Music';
  }

  if (/makeup|skincare|beauty|fashion|dress|outfit|hair|nail/.test(text)) {
    return 'Fashion & Beauty';
  }

  if (/job|career|business|money|finance|invest|salary|entrepreneur/.test(text)) {
    return 'Career & Finance';
  }

  if (/funny|meme|comedy|lol|haha|prank|viral|entertainment/.test(text)) {
    return 'Entertainment';
  }

  if (/art|artist|illustration|illustrator|drawing|draw|painting|painter|sketch|sketching|canvas|digital art|digitalart|artwork|creative|creativity|portrait|watercolor|watercolour|calligraphy|sculpture|ceramic|design/.test(text)) {
    return 'Art';
  }
  return 'Other';
}
/**
 * Stores an individual Reel captured by the browser extension.
 */
static async recordReel(
  userId: string,
  reelUrl: string,
  username: string | null,
  caption: string | null,
  hashtags: string[]
): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase
      .from('Reels')
      .insert([{
  user_id: userId,
  reel_url: reelUrl,
  username,
  caption,
  hashtags,
  category: DbService.categorizeReel(caption, hashtags)
}]);

    if (error) {
      console.error('Error saving reel:', error);
      return false;
    }

    return true;
  }

  console.log('Reel recorded in local fallback:', {
    userId,
    reelUrl,
    username,
    caption,
    hashtags
  });

  return true;
}

}
