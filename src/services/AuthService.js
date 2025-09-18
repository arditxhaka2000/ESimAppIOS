import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

class AuthService {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login with email and password
  async login(email, password) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store session data
      await this.storeSession(data.session, data.user, data.profile);

      return {
        success: true,
        user: data.user,
        profile: data.profile,
        session: data.session,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Register new user
  async register(userData) {
    try {
      const { email, password, fullName, phone, referralCode } = userData;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          referralCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      return {
        success: true,
        user: data.user,
        profile: data.profile,
        message: data.message,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const session = await this.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get profile');
      }

      return {
        success: true,
        profile: data.profile,
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const session = await this.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update stored profile
      await this.updateStoredProfile(data.profile);

      return {
        success: true,
        profile: data.profile,
        message: data.message,
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Logout
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      // Clear stored session data
      await this.clearSession();

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Session management
  async storeSession(session, user, profile) {
    try {
      await AsyncStorage.multiSet([
        ['user_session', JSON.stringify(session)],
        ['user_data', JSON.stringify(user)],
        ['user_profile', JSON.stringify(profile)],
      ]);
    } catch (error) {
      console.error('Store session error:', error);
    }
  }

  async getSession() {
    try {
      const sessionData = await AsyncStorage.getItem('user_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  async getStoredUser() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get stored user error:', error);
      return null;
    }
  }

  async getStoredProfile() {
    try {
      const profileData = await AsyncStorage.getItem('user_profile');
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Get stored profile error:', error);
      return null;
    }
  }

  async updateStoredProfile(profile) {
    try {
      await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Update stored profile error:', error);
    }
  }

  async clearSession() {
    try {
      await AsyncStorage.multiRemove(['user_session', 'user_data', 'user_profile']);
    } catch (error) {
      console.error('Clear session error:', error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const session = await this.getSession();
      if (!session) return false;

      // Check if session is still valid
      const currentTime = Math.floor(Date.now() / 1000);
      return session.expires_at > currentTime;
    } catch (error) {
      console.error('Is authenticated error:', error);
      return false;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}

export default AuthService;