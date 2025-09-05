import axios from 'axios';

export class GloesimApiService {
  static instance = null;
  
  constructor() {
    this.baseUrl = 'https://gloesim.com/api/';
    this.bearerToken = '';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });

    // Request interceptor to add auth header
    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.bearerToken) {
          config.headers.Authorization = `Bearer ${this.bearerToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  static getInstance() {
    if (!GloesimApiService.instance) {
      GloesimApiService.instance = new GloesimApiService();
    }
    return GloesimApiService.instance;
  }

  setBearerToken(token) {
    this.bearerToken = token;
  }

  clearBearerToken() {
    this.bearerToken = '';
  }

  setEnvironment() {
    // Environment setup if needed
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

  async getCountriesAsync() {
    try {
      const response = await this.httpClient.get('developer/reseller/packages/country');
      return response.data;
    } catch (error) {
      console.error('Error getting countries:', error.message);
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