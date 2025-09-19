import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authService] = useState(() => {
    try {
      return AuthService.getInstance();
    } catch (error) {
      console.error('Failed to initialize AuthService:', error);
      return null;
    }
  });

  useEffect(() => {
    if (!authService) {
      console.error('AuthService is not available');
      setLoading(false);
      return;
    }

    initializeAuth();
  }, [authService]);

  const initializeAuth = async () => {
    if (!authService) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Initializing authentication...');
      
      // Check if user is authenticated
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        console.log('User is authenticated, loading stored data...');
        
        // Get stored user data
        const [storedUser, storedProfile] = await Promise.all([
          authService.getStoredUser(),
          authService.getStoredProfile()
        ]);
        
        if (storedUser && storedProfile) {
          console.log('Stored data loaded successfully:', {
            userEmail: storedUser.email,
            profileName: storedProfile.full_name
          });
          
          setUser(storedUser);
          setProfile(storedProfile);
          setIsAuthenticated(true);
          
          // Refresh profile in background (don't wait for it)
          setTimeout(() => {
            refreshProfile();
          }, 2000);
        } else {
          console.log('Missing stored data, clearing authentication');
          await authService.clearSession();
          setIsAuthenticated(false);
        }
      } else {
        console.log('User is not authenticated');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
      setIsAuthenticated(false);
      await authService.clearSession();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (!authService) {
      return { success: false, error: 'Authentication service not available' };
    }
    
    try {
      setLoading(true);
      console.log('Starting login process...');
      
      const result = await authService.login(email, password);
      
      if (result.success) {
        console.log('Login successful, updating context state...');
        setUser(result.user);
        setProfile(result.profile);
        setIsAuthenticated(true);
        
        console.log('Context state updated successfully');
        return { success: true };
      } else {
        console.log('Login failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    if (!authService) {
      return { success: false, error: 'Authentication service not available' };
    }
    
    try {
      setLoading(true);
      
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!authService) {
      return { success: false, error: 'Authentication service not available' };
    }
    
    try {
      setLoading(true);
      console.log('Starting logout process...');
      
      const result = await authService.logout();
      
      if (result.success) {
        console.log('Logout successful, clearing context state...');
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        console.log('Context state cleared');
      }
      
      return result;
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!authService) {
      return { success: false, error: 'Authentication service not available' };
    }
    
    try {
      const result = await authService.updateProfile(profileData);
      
      if (result.success) {
        setProfile(result.profile);
      }
      
      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshProfile = async () => {
    if (!authService || !isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      console.log('Refreshing profile...');
      const result = await authService.getProfile();
      
      if (result.success) {
        console.log('Profile refreshed successfully');
        setProfile(result.profile);
        return { success: true, profile: result.profile };
      } else if (result.error && (result.error.includes('Unauthorized') || result.error.includes('Invalid'))) {
        console.log('Session expired during profile refresh, logging out...');
        await logout();
      }
      
      return result;
    } catch (error) {
      console.error('Refresh profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    if (!authService) {
      return { success: false, error: 'Authentication service not available' };
    }
    
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  const loginAsGuest = async () => {
    console.log('Attempting guest login...');
    return await login('ronhoxha333@gmail.com', 'N8PtkcaQ6A');
  };

  // Debug logging
  useEffect(() => {
    console.log('Auth Context State Changed:', {
      isAuthenticated,
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.email,
      profileName: profile?.full_name,
      loading
    });
  }, [isAuthenticated, user, profile, loading]);

  const value = {
    user,
    profile,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    resetPassword,
    loginAsGuest,
    isGuest: profile?.email === 'ronhoxha333@gmail.com',
    userDisplayName: profile?.full_name || user?.email?.split('@')[0] || 'User',
    userEmail: user?.email || profile?.email,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};