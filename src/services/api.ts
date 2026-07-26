import { User, DashboardData, Settings } from '../types';

const API_BASE = '/api';

class ApiService {
  private token: string | null = localStorage.getItem('invisible_algo_token');
  private currentUser: User | null = null;

  constructor() {
    const savedUser = localStorage.getItem('invisible_algo_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        this.currentUser = null;
      }
    }
  }

  setSession(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('invisible_algo_token', token);
    localStorage.setItem('invisible_algo_user', JSON.stringify(user));
  }

  clearSession() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('invisible_algo_token');
    localStorage.removeItem('invisible_algo_user');
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  async signup(email: string, fullName: string, passwordHash: string): Promise<User> {
    const data = await this.fetchWithAuth<{ user: User; token: string }>('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, fullName, password: passwordHash }),
    });

    this.setSession(data.token, data.user);
    return data.user;
  }

  async login(email: string, passwordHash: string): Promise<User> {
    const data = await this.fetchWithAuth<{ user: User; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordHash }),
    });

    this.setSession(data.token, data.user);
    return data.user;
  }

  async logout(): Promise<void> {
    try {
      await this.fetchWithAuth('/logout', { method: 'POST' });
    } catch (err) {
      console.warn('API logout warning:', err);
    } finally {
      this.clearSession();
    }
  }

  async forgotPassword(email: string): Promise<string> {
    const data = await this.fetchWithAuth<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return data.message;
  }

  async getMe(): Promise<User> {
    const data = await this.fetchWithAuth<{ user: User }>('/me');
    this.currentUser = data.user;
    localStorage.setItem('invisible_algo_user', JSON.stringify(data.user));
    return data.user;
  }

  async getDashboard(): Promise<DashboardData> {
    return this.fetchWithAuth<DashboardData>('/dashboard');
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const data = await this.fetchWithAuth<{ settings: Settings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.settings;
  }

  // Support function to let users submit simulated browsing summaries right from the UI
  async simulateExtensionActivity(website: string, durationSeconds: number, score: number, reflection: string): Promise<void> {
    await this.fetchWithAuth('/extension/session', {
      method: 'POST',
      body: JSON.stringify({
        website,
        duration: durationSeconds,
        diversity_score: score,
        reflection
      }),
    });
  }
}

export const api = new ApiService();
