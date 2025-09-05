import axios from 'axios';
import { SecureStorageService } from './SecureStorageService';
import { GloesimApiService } from './GloesimApiService';

export class AuthService {
  static instance = null;
  
  constructor() {
    this.baseUrl = 'https://gloesim.com/api/';
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  static async initialize() {
    const instance = AuthService.getInstance();
    return instance;
  }

  async loginAsync(username, password) {
    try {
      const loginData = {
        email: username,
        password: password,
      };

      const response = await this.httpClient.post(
        'developer/reseller/login',
        loginData
      );

      if (response.data?.status && response.data?.access_token) {
        await SecureStorageService.setAsync('bearer_token', response.data.access_token);
        GloesimApiService.getInstance().setBearerToken(response.data.access_token);
        GloesimApiService.getInstance().setEnvironment();
        return response.data.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('Login error:', error.message);
      return null;
    }
  }

  async logoutAsync() {
    try {
      await SecureStorageService.removeAsync('bearer_token');
      GloesimApiService.getInstance().clearBearerToken();
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  }

  async isAuthenticatedAsync() {
    try {
      const token = await SecureStorageService.getAsync('bearer_token');
      if (token) {
        GloesimApiService.getInstance().setBearerToken(token);
        GloesimApiService.getInstance().setEnvironment();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication check error:', error.message);
      return false;
    }
  }

  async getStoredTokenAsync() {
    try {
      return await SecureStorageService.getAsync('bearer_token');
    } catch (error) {
      console.error('Error getting stored token:', error.message);
      return null;
    }
  }
}