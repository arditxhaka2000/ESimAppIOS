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
    this.initialized = false;
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  static async initialize() {
    const instance = AuthService.getInstance();
    await instance.initializeFromStorage();
    instance.initialized = true;
    return instance;
  }

  async initializeFromStorage() {
    try {
      console.log('Initializing auth from storage...');
      const isAuth = await AsyncStorage.getItem('is_authenticated');
      const session = await this.getSession();
      
      if (isAuth === 'true' && session && this.isSessionValid(session)) {
        console.log('Valid session found during initialization');
        return true;
      } else {
        console.log('No valid session found, clearing storage');
        await this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('Initialize from storage error:', error);
      return false;
    }
  }

  isSessionValid(session) {
    if (!session) return false;
    
    // Check if session has required fields
    if (!session.access_token || !session.expires_at) return false;
    
    // Check if session is expired (add 1 minute buffer)
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = session.expires_at;
    const isValid = expiryTime > (currentTime + 60);
    
    console.log('Session validity check:', {
      currentTime,
      expiryTime,
      isValid,
      timeLeft: expiryTime - currentTime
    });
    
    return isValid;
  }

  async login(email, password) {
    try {
      console.log('Starting login process for:', email);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', { success: data.success, hasSession: !!data.session });

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store session immediately after successful login
      await this.storeSession(data.session, data.user, data.profile);
      
      console.log('Login successful, session stored');

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

  async getProfile() {
    try {
      const session = await this.getSession();
      if (!session || !this.isSessionValid(session)) {
        throw new Error('No valid session');
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

      // Update stored profile with fresh data
      await this.updateStoredProfile(data.profile);

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

  async updateProfile(profileData) {
    try {
      const session = await this.getSession();
      if (!session || !this.isSessionValid(session)) {
        throw new Error('No valid session');
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

  async logout() {
    try {
      console.log('Starting logout process');
      
      // Clear local storage first
      await this.clearSession();
      
      // Then attempt Supabase logout (but don't fail if it errors)
      try {
        const { error } = await this.supabase.auth.signOut();
        if (error) {
          console.warn('Supabase logout warning:', error);
        }
      } catch (supabaseError) {
        console.warn('Supabase logout failed, but local logout succeeded:', supabaseError);
      }

      console.log('Logout completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

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

  async storeSession(session, user, profile) {
    try {
      console.log('Storing session data...');
      
      const sessionData = {
        ...session,
        stored_at: Date.now()
      };

      const storagePromises = [
        AsyncStorage.setItem('user_session', JSON.stringify(sessionData)),
        AsyncStorage.setItem('user_data', JSON.stringify(user)),
        AsyncStorage.setItem('user_profile', JSON.stringify(profile)),
        AsyncStorage.setItem('is_authenticated', 'true'),
      ];

      await Promise.all(storagePromises);
      console.log('Session stored successfully');
    } catch (error) {
      console.error('Store session error:', error);
      throw error;
    }
  }

  async getSession() {
    try {
      const sessionData = await AsyncStorage.getItem('user_session');
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      
      if (!this.isSessionValid(session)) {
        console.log('Session expired, clearing storage');
        await this.clearSession();
        return null;
      }

      return session;
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
      console.log('Profile updated in storage');
    } catch (error) {
      console.error('Update stored profile error:', error);
    }
  }

  async clearSession() {
    try {
      const keys = [
        'user_session', 
        'user_data', 
        'user_profile',
        'is_authenticated'
      ];
      
      await AsyncStorage.multiRemove(keys);
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Clear session error:', error);
    }
  }

  async isAuthenticated() {
    try {
      console.log('Checking authentication status...');
      
      const isAuthStored = await AsyncStorage.getItem('is_authenticated');
      const session = await this.getSession();
      
      const isAuth = isAuthStored === 'true' && session && this.isSessionValid(session);
      
      console.log('Authentication check result:', {
        isAuthStored: isAuthStored === 'true',
        hasSession: !!session,
        isSessionValid: session ? this.isSessionValid(session) : false,
        finalResult: isAuth
      });

      if (!isAuth) {
        await this.clearSession();
      }
      
      return isAuth;
    } catch (error) {
      console.error('Is authenticated error:', error);
      return false;
    }
  }

  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      callback(event, session);
    });
  }
}

export default AuthService;