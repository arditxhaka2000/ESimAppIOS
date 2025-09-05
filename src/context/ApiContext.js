import React, { createContext, useContext, useReducer } from 'react';
import { GloesimApiService } from '../services/GloesimApiService';

const ApiContext = createContext();

const initialState = {
  packages: [],
  countries: [],
  continents: [],
  myESims: [],
  isLoading: false,
  error: null,
};

const apiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PACKAGES':
      return { ...state, packages: action.payload, isLoading: false };
    case 'SET_COUNTRIES':
      return { ...state, countries: action.payload, isLoading: false };
    case 'SET_CONTINENTS':
      return { ...state, continents: action.payload, isLoading: false };
    case 'SET_MY_ESIMS':
      return { ...state, myESims: action.payload, isLoading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

export const ApiProvider = ({ children }) => {
  const [state, dispatch] = useReducer(apiReducer, initialState);
  const apiService = GloesimApiService.getInstance();

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.getPackagesAsync();
      
      if (response?.status && response.data) {
        dispatch({ type: 'SET_PACKAGES', payload: response.data });
        return response.data;
      } else {
        setError('Failed to fetch packages');
        return [];
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError(error.message || 'Failed to fetch packages');
      return [];
    }
  };

  const fetchGlobalPackages = async (packageType = null) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.getGlobalPackagesAsync(packageType);
      
      if (response?.status && response.data) {
        dispatch({ type: 'SET_PACKAGES', payload: response.data });
        return response.data;
      } else {
        setError('Failed to fetch global packages');
        return [];
      }
    } catch (error) {
      console.error('Error fetching global packages:', error);
      setError(error.message || 'Failed to fetch global packages');
      return [];
    }
  };

  const fetchCountries = async () => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.getCountriesAsync();
      
      if (response?.status && response.data) {
        dispatch({ type: 'SET_COUNTRIES', payload: response.data });
        return response.data;
      } else {
        setError('Failed to fetch countries');
        return [];
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError(error.message || 'Failed to fetch countries');
      return [];
    }
  };

  const fetchContinents = async () => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.getContinentsAsync();
      
      if (response?.status && response.data) {
        dispatch({ type: 'SET_CONTINENTS', payload: response.data });
        return response.data;
      } else {
        setError('Failed to fetch continents');
        return [];
      }
    } catch (error) {
      console.error('Error fetching continents:', error);
      setError(error.message || 'Failed to fetch continents');
      return [];
    }
  };

  const fetchMyESims = async () => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.getMyESIMsAsync();
      
      if (response?.status && response.data) {
        dispatch({ type: 'SET_MY_ESIMS', payload: response.data });
        return response.data;
      } else {
        setError('Failed to fetch eSIMs');
        return [];
      }
    } catch (error) {
      console.error('Error fetching my eSIMs:', error);
      setError(error.message || 'Failed to fetch eSIMs');
      return [];
    }
  };

  const fetchPackagesByCountry = async (countryId) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.getPackagesByCountryAsync(countryId);
      
      if (response?.status && response.data) {
        return response.data;
      } else {
        setError('Failed to fetch packages for country');
        return [];
      }
    } catch (error) {
      console.error('Error fetching packages by country:', error);
      setError(error.message || 'Failed to fetch packages for country');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const purchasePackage = async (packageTypeId, iccid = null) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.purchasePackageAsync(packageTypeId, iccid);
      
      if (response?.status && response.data) {
        return { success: true, data: response.data };
      } else {
        setError('Failed to purchase package');
        return { success: false, error: 'Purchase failed' };
      }
    } catch (error) {
      console.error('Error purchasing package:', error);
      setError(error.message || 'Failed to purchase package');
      return { success: false, error: error.message || 'Purchase failed' };
    } finally {
      setLoading(false);
    }
  };

  const purchaseDataOnlyPackage = async (packageTypeId, iccid = null) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.purchaseDataOnlyPackageAsync(packageTypeId, iccid);
      
      if (response?.status && response.data) {
        return { success: true, data: response.data };
      } else {
        setError('Failed to purchase data-only package');
        return { success: false, error: 'Purchase failed' };
      }
    } catch (error) {
      console.error('Error purchasing data-only package:', error);
      setError(error.message || 'Failed to purchase data-only package');
      return { success: false, error: error.message || 'Purchase failed' };
    } finally {
      setLoading(false);
    }
  };

  const checkDeviceCompatibility = async (imei) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.checkUltimateMobileCompatibilityAsync(imei);
      
      if (response) {
        return response;
      } else {
        setError('Failed to check device compatibility');
        return null;
      }
    } catch (error) {
      console.error('Error checking device compatibility:', error);
      setError(error.message || 'Failed to check device compatibility');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const topUpESim = async (simId, packageTypeId) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.topUpESimAsync(simId, packageTypeId);
      
      if (response?.status && response.data) {
        return { success: true, data: response.data };
      } else {
        setError('Failed to top up eSIM');
        return { success: false, error: 'Top up failed' };
      }
    } catch (error) {
      console.error('Error topping up eSIM:', error);
      setError(error.message || 'Failed to top up eSIM');
      return { success: false, error: error.message || 'Top up failed' };
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const value = {
    ...state,
    fetchPackages,
    fetchGlobalPackages,
    fetchCountries,
    fetchContinents,
    fetchMyESims,
    fetchPackagesByCountry,
    purchasePackage,
    purchaseDataOnlyPackage,
    checkDeviceCompatibility,
    topUpESim,
    setLoading,
    setError,
    clearError,
    resetState,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};