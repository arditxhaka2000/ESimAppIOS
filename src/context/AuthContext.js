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
    
    const authListener = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        try {
          if (event === 'SIGNED_IN' && session) {
            await handleSignIn(session);
          } else if (event === 'SIGNED_OUT') {
            handleSignOut();
          } else if (event === 'TOKEN_REFRESHED' && session) {
            await handleTokenRefresh(session);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      }
    );

    return () => {
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [authService]);

  const initializeAuth = async () => {
    if (!authService) return;
    
    try {
      setLoading(true);
      
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        const storedUser = await authService.getStoredUser();
        const storedProfile = await authService.getStoredProfile();
        
        if (storedUser && storedProfile) {
          setUser(storedUser);
          setProfile(storedProfile);
          setIsAuthenticated(true);
          
          refreshProfile();
        } else {
          await authService.logout();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (session) => {
    try {
      const storedUser = await authService.getStoredUser();
      const storedProfile = await authService.getStoredProfile();
      
      if (storedUser && storedProfile) {
        setUser(storedUser);
        setProfile(storedProfile);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Handle sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const handleTokenRefresh = async (session) => {
    try {
      const storedUser = await authService.getStoredUser();
      const storedProfile = await authService.getStoredProfile();
      
      if (session && storedUser && storedProfile) {
        await authService.storeSession(session, storedUser, storedProfile);
      }
    } catch (error) {
      console.error('Handle token refresh error:', error);
    }
  };

  const login = async (email, password) => {
    if (!authService) {
      return { success: false, error: 'Authentication service not available' };
    }
    
    try {
      setLoading(true);
      
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setProfile(result.profile);
        setIsAuthenticated(true);
        return { success: true };
      } else {
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
      
      const result = await authService.logout();
      
      if (result.success) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
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
    if (!authService) {
      return { success: false, error: 'Authentication service not available' };
    }
    
    try {
      const result = await authService.getProfile();
      
      if (result.success) {
        setProfile(result.profile);
        return { success: true, profile: result.profile };
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
    try {
      setLoading(true);
      
      const result = await login('ronhoxha333@gmail.com', 'N8PtkcaQ6A');
      return result;
    } catch (error) {
      console.error('Guest login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

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