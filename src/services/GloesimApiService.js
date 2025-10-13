import axios from 'axios';

export class GloesimApiService {
  static instance = null;
  
  constructor(useSandbox = false) {
    this.baseUrl = useSandbox 
      ? 'https://sandbox.gloesim.com/api/' 
      : 'https://gloesim.com/api/';
    
    this.bearerToken = '';
    this.useSandbox = useSandbox;
    this.isAuthenticated = false;
    
    // Use a Promise to track authentication state properly
    this.authenticationPromise = null;
    
    // Store credentials for auto-authentication
    this.credentials = {
      email: 'ronhoxha333@gmail.com',
      password: 'N8PtkcaQ6A'
    };
    
    console.log(`GloeSIM API initialized: ${this.useSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
    console.log(`Base URL: ${this.baseUrl}`);
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    // Request interceptor to add auth header and handle auto-authentication
    this.httpClient.interceptors.request.use(
      async (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        
        // Skip authentication for login endpoint
        if (config.url.includes('login')) {
          return config;
        }
        
        // Auto-authenticate if not authenticated
        if (!this.isAuthenticated) {
          console.log('Not authenticated, attempting auto-login...');
          await this.ensureAuthenticated();
        }
        
        if (this.bearerToken) {
          config.headers.Authorization = `Bearer ${this.bearerToken}`;
          console.log('Bearer token added to request');
        } else {
          console.log('No Bearer token available');
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with auto-re-authentication on 401
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`API Success: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error(`API Error: ${error.response?.status || error.code} ${error.config?.url}`);
        
        // Handle 401 errors with auto-re-authentication
        if (error.response?.status === 401 && !error.config.url.includes('login')) {
          console.log('401 error, attempting re-authentication...');
          
          // Reset authentication state
          this.isAuthenticated = false;
          this.bearerToken = '';
          this.authenticationPromise = null;
          
          // Try to re-authenticate
          const authSuccess = await this.ensureAuthenticated();
          
          if (authSuccess && error.config) {
            console.log('Re-authentication successful, retrying original request...');
            
            // Update the failed request with new token
            error.config.headers.Authorization = `Bearer ${this.bearerToken}`;
            
            // Retry the original request
            return this.httpClient(error.config);
          }
        }
        
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.code
        });
        
        return Promise.reject(error);
      }
    );
  }

  static getInstance(useSandbox = false) {
    if (GloesimApiService.instance && GloesimApiService.instance.useSandbox !== useSandbox) {
      console.log('Environment changed, creating new instance');
      GloesimApiService.instance = null;
    }
    
    if (!GloesimApiService.instance) {
      GloesimApiService.instance = new GloesimApiService(useSandbox);
    }
    return GloesimApiService.instance;
  }

  // Set credentials for auto-authentication
  setCredentials(email, password) {
    this.credentials.email = email;
    this.credentials.password = password;
    console.log('Credentials updated for auto-authentication');
  }

  // Ensure authentication with proper Promise handling to prevent race conditions
  async ensureAuthenticated() {
    // If already authenticated, return immediately
    if (this.isAuthenticated && this.bearerToken) {
      return true;
    }

    // If authentication is already in progress, wait for it
    if (this.authenticationPromise) {
      console.log('Authentication already in progress, waiting for completion...');
      return await this.authenticationPromise;
    }

    // Start new authentication
    this.authenticationPromise = this.performAuthentication();
    
    try {
      const result = await this.authenticationPromise;
      return result;
    } finally {
      // Clear the promise regardless of success/failure
      this.authenticationPromise = null;
    }
  }

  // Internal authentication method
  async performAuthentication() {
    try {
      console.log(`Authenticating to ${this.useSandbox ? 'SANDBOX' : 'PRODUCTION'}...`);
      
      const response = await axios.post(`${this.baseUrl}developer/reseller/login`, {
        email: this.credentials.email,
        password: this.credentials.password,
      });

      if (response.data && response.data.status && response.data.access_token) {
        this.bearerToken = response.data.access_token;
        this.isAuthenticated = true;
        
        console.log('Authentication successful');
        return true;
      } else {
        console.error('Authentication failed: Invalid response structure');
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      console.error('Auth failed with details:', {
        status: error.response?.status,
        data: error.response?.data
      });
      
      this.isAuthenticated = false;
      this.bearerToken = '';
      return false;
    }
  }

  // Manual login method (optional, for explicit authentication)
  async loginAsync(email, password) {
    this.setCredentials(email, password);
    
    // Reset authentication state to force new login
    this.isAuthenticated = false;
    this.bearerToken = '';
    this.authenticationPromise = null;
    
    const success = await this.ensureAuthenticated();
    
    return {
      success,
      token: this.bearerToken,
      error: success ? null : 'Authentication failed'
    };
  }

  // Check if user is authenticated
  isLoggedIn() {
    return this.isAuthenticated && !!this.bearerToken;
  }

  // Get current token
  getToken() {
    return this.bearerToken;
  }

  clearBearerToken() {
    this.bearerToken = '';
    this.isAuthenticated = false;
    this.authenticationPromise = null;
    console.log('Bearer token cleared');
  }

  setEnvironment(useSandbox = false) {
    if (this.useSandbox !== useSandbox) {
      // Clear authentication when switching environments
      this.bearerToken = '';
      this.isAuthenticated = false;
      this.authenticationPromise = null;
      
      this.useSandbox = useSandbox;
      this.baseUrl = useSandbox 
        ? 'https://sandbox.gloesim.com/api/' 
        : 'https://gloesim.com/api/';
      
      this.httpClient.defaults.baseURL = this.baseUrl;
      
      console.log(`Environment switched to: ${this.useSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
      console.log(`New Base URL: ${this.baseUrl}`);
      console.log('Authentication cleared - will auto-authenticate on next API call');
    }
  }

  // API methods remain the same
  async getCountriesAsync() {
    try {
      console.log('Fetching countries...');
      const response = await this.httpClient.get('developer/reseller/packages/country');
      console.log('Countries fetched successfully');
      return response.data;
    } catch (error) {
      console.error('Error getting countries:', error.message);
      return null;
    }
  }

  async getGlobalPackagesAsync(packageType = null) {
    try {
      let url = 'developer/reseller/packages/global';
      if (packageType) {
        url += `?package_type=${encodeURIComponent(packageType)}`;
      }

      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting global packages:', error.message);
      return null;
    }
  }

  async getContinentsAsync() {
    try {
      const response = await this.httpClient.get('developer/reseller/packages/continent');
      return response.data;
    } catch (error) {
      console.error('Error getting continents:', error.message);
      return null;
    }
  }

  async getPackagesByCountryAsync(countryId) {
    try {
      const response = await this.httpClient.get(`developer/reseller/packages/country/${countryId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting packages by country:', error.message);
      return null;
    }
  }

  async getMyESIMsAsync() {
    try {
      const response = await this.httpClient.get('developer/reseller/my-esims');
      return response.data;
    } catch (error) {
      console.error('Error getting my eSIMs:', error.message);
      return null;
    }
  }

  async checkDeviceCompatibilityAsync(imei) {
    try {
      const formData = new FormData();
      formData.append('imei', imei);

      const response = await this.httpClient.post(
        'developer/reseller/ultimate-mobile-imei-compatible',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error checking compatibility:', error.message);
      return null;
    }
  }

  async getSupportedDevicesAsync(type, model) {
    try {
      const response = await this.httpClient.get(
        `developer/dealer/supported-mobile-devices?type=${type}&model=${encodeURIComponent(model)}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting supported devices:', error.message);
      return null;
    }
  }

  async getPackagesAsync() {
    try {
      const response = await this.httpClient.get('developer/reseller/packages');
      return response.data;
    } catch (error) {
      console.error('Error getting packages:', error.message);
      return null;
    }
  }

  async purchasePackageAsync(packageTypeId, iccid = null) {
    try {
      const formData = new FormData();
      formData.append('package_type_id', packageTypeId);
      if (iccid) {
        formData.append('iccid', iccid);
      }

      const response = await this.httpClient.post(
        'developer/reseller/package/purchase',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error purchasing package:', error.message);
      return null;
    }
  }

  async purchaseDataOnlyPackageAsync(packageTypeId, iccid = null) {
    try {
      const formData = new FormData();
      formData.append('package_type_id', packageTypeId);
      if (iccid) {
        formData.append('iccid', iccid);
      }

      const response = await this.httpClient.post(
        'developer/reseller/package/purchase',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error purchasing data-only package:', error.message);
      return null;
    }
  }

  async topUpESimAsync(simId, packageTypeId) {
    try {
      const formData = new FormData();
      formData.append('package_type_id', packageTypeId);

      const response = await this.httpClient.post(
        `developer/reseller/my-esims/${simId}/top-up`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error topping up eSIM:', error.message);
      return null;
    }
  }

  async checkUltimateMobileCompatibilityAsync(imei) {
    try {
      const formData = new FormData();
      formData.append('imei', imei);

      const response = await this.httpClient.post(
        'developer/reseller/ultimate-mobile-imei-compatible',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error checking ultimate mobile compatibility:', error.message);
      return null;
    }
  }

  async getMobileCompatibilityAsync(type, model) {
    try {
      const response = await this.httpClient.get(
        `developer/dealer/supported-mobile-devices?type=${encodeURIComponent(type)}&model=${encodeURIComponent(model)}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting mobile compatibility:', error.message);
      return null;
    }
  }
}