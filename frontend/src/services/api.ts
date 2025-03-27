import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface EmailCredentials {
  id: string;
  tenantId: string;
  userId: string;
  email: string;
  provider: 'gmail' | 'outlook';
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const emailAPI = {
  initiateGmailAuth: async () => {
    const response = await api.get('/email-credentials/gmail/auth');
    return response.data;
  },
  completeGmailAuth: async (code: string, state: string) => {
    const response = await api.post('/email-credentials/gmail/callback', { code, state });
    return response.data;
  },
  getEmailStats: async () => {
    const response = await api.get('/email/stats');
    return response.data;
  },
  getQuotaInfo: async () => {
    const response = await api.get('/email/quota');
    return response.data;
  },
  getEmailLogs: async () => {
    const response = await api.get('/email/logs');
    return response.data;
  },
  getEmailCredentials: async () => {
    const response = await api.get('/email-credentials');
    return response.data;
  },
  sendTestEmail: async (toAddress: string) => {
    const response = await api.post('/email/test', { toAddress });
    return response.data;
  },
};

export const apiService = {
  // Link email account
  async linkAccount(userId: string, tenantId: string, provider: 'gmail' | 'outlook') {
    try {
      const response = await api.post('/auth/link-account', {
        userId,
        tenantId,
        provider,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to link account');
    }
  },

  // Get account status
  async getAccountStatus(userId: string, tenantId: string) {
    try {
      const response = await api.get(`/auth/account-status/${tenantId}/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get account status');
    }
  },

  // Get email statistics
  async getEmailStats(userId: string, tenantId: string) {
    try {
      const response = await api.get(`/email/stats/${tenantId}/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get email statistics');
    }
  },

  // Get recent activity
  async getRecentActivity(userId: string, tenantId: string) {
    try {
      const response = await api.get(`/email/activity/${tenantId}/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get recent activity');
    }
  },
};

export default apiService; 