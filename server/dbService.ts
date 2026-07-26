import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, BrowsingSession, FeedScore, Achievement, Settings, DashboardData } from '../src/types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
  static async getSessions(userId: string): Promise<BrowsingSession[]> {
    if (supabase) {
      const { data: sessions, error: sErr } = await supabase
        .from('BrowsingSessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (sErr || !sessions) return [];

      // Fetch feed scores for these sessions
      const sessionIds = sessions.map(s => s.id);
      const { data: scores } = await supabase
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
  static async getAchievements(userId: string): Promise<Achievement[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('Achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });
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
  static async getDashboardData(userId: string): Promise<DashboardData> {
    const sessions = await this.getSessions(userId);
    const achievements = await this.getAchievements(userId);
    const settings = await this.getSettings(userId);

    // Calculate metrics
    let totalDuration = 0; // seconds
    let totalScores = 0;
    let scoresWithDiversity = 0;

    sessions.forEach(s => {
      totalDuration += s.browsing_duration;
      if (s.feed_score) {
        totalScores += s.feed_score.diversity_score;
        scoresWithDiversity++;
      }
    });

    const averageScore = scoresWithDiversity > 0 ? Math.round(totalScores / scoresWithDiversity) : 74; // Fallback to 74%
    const browsingHours = Math.floor(totalDuration / 3600);
    const browsingMinutes = Math.floor((totalDuration % 3600) / 60);

    let browsingTimeText = '';
    if (browsingHours > 0) {
      browsingTimeText = `${browsingHours}h ${browsingMinutes}m`;
    } else {
      browsingTimeText = `${browsingMinutes}m`;
    }
    if (browsingTimeText === '0m') {
      browsingTimeText = '1h 24m'; // Fallback mockup default
    }

    // Latest reflection summary
    const reflections = sessions
      .filter(s => s.feed_score?.reflection)
      .map(s => s.feed_score!.reflection);
    
    let reflectionSummary = `"Today's browsing focused mostly on technology and entertainment. Only 22% of viewed recommendations introduced new perspectives."`;
    if (reflections.length > 0) {
      reflectionSummary = `"${reflections[0]}"`;
    }

    // Dynamic recent sessions
    const recentSessions = sessions.slice(0, 3).map(s => {
      const date = new Date(s.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const durationMins = Math.round(s.browsing_duration / 60);
      const duration = durationMins >= 60 
        ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` 
        : `${durationMins}m`;

      return {
        date,
        duration,
        score: s.feed_score ? s.feed_score.diversity_score : 60,
        summary: s.feed_score ? s.feed_score.reflection : 'Web browsing session.'
      };
    });

    // Handle defaults if empty
    const finalRecentSessions = recentSessions.length > 0 ? recentSessions : [
      { date: 'Oct 24', duration: '45m', score: 68, summary: 'Heavy focus on AI and Space.' },
      { date: 'Oct 23', duration: '1h 12m', score: 82, summary: 'Social media bubble intensification.' },
      { date: 'Oct 22', duration: '38m', score: 54, summary: 'Productive educational exploration.' }
    ];

    // Current streak (for simplicity, we return a mockup or computed streak)
    const currentStreakDays = sessions.length > 0 ? Math.min(12, 3 + sessions.length) : 12;

    return {
      echoChamberScore: averageScore,
      diversityLabel: averageScore > 70 ? 'High' : averageScore > 40 ? 'Moderate' : 'Low',
      diversityChange: '+15% improvement',
      browsingTimeText,
      currentStreakDays,
      reflectionSummary,
      recentSessions: finalRecentSessions,
      achievements,
      settings
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
    reflectionSummary: string
  ): Promise<boolean> {
    const startTime = new Date(Date.now() - durationSeconds * 1000).toISOString();
    const endTime = new Date().toISOString();

    if (supabase) {
      // 1. Create BrowsingSession
      const { data: session, error: sErr } = await supabase
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
      const { error: fErr } = await supabase
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

      // 3. Unlock a badge if not already unlocked
      // E.g. unlock "Explorer" or others based on diversity score
      if (diversityScore > 80) {
        const { data: existing } = await supabase
          .from('Achievements')
          .select('*')
          .eq('user_id', userId)
          .eq('badge_name', 'Seeker')
          .single();

        if (!existing) {
          await supabase.from('Achievements').insert([{
            user_id: userId,
            badge_name: 'Seeker',
            unlocked_at: new Date().toISOString()
          }]);
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
}
