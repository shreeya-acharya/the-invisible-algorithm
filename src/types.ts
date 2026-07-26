export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface BrowsingSession {
  id: string;
  user_id: string;
  website: string;
  start_time: string;
  end_time: string;
  browsing_duration: number; // in seconds or minutes
  feed_score?: FeedScore;
}

export interface FeedScore {
  id: string;
  session_id: string;
  diversity_score: number;
  reflection: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_name: string;
  unlocked_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  notifications: boolean;
  dark_mode: boolean;
  email_updates: boolean;
}

export interface DashboardData {
  echoChamberScore: number;
  diversityLabel: string;
  diversityChange: string;
  browsingTimeText: string;
  currentStreakDays: number;
  reflectionSummary: string;
  recentSessions: Array<{
    date: string;
    duration: string;
    score: number;
    summary: string;
  }>;
  achievements: Achievement[];
  settings: Settings;
}
