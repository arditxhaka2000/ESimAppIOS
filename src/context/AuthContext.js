import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthService } from '../services/AuthService';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        token: action.payload.token,
        user: action.payload.user,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: null,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = AuthService.getInstance();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const isAuthenticated = await authService.isAuthenticatedAsync();
      
      if (isAuthenticated) {
        const token = await authService.getStoredTokenAsync();
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { token, user: null } // User data can be fetched separately if needed
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const login = async (username, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const token = await authService.loginAsync(username, password);
      
      if (token) {
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { token, user: { email: username } }
        });
        return true;
      } else {
        dispatch({ 
          type: 'LOGIN_FAILURE', 
          payload: 'Invalid credentials' 
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.message || 'Login failed' 
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logoutAsync();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still dispatch logout even if there's an error
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};