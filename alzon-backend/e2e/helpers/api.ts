import axios, { AxiosInstance } from 'axios';
import { BASE_URLS } from '../config/test.config';

const API_BASE = `${BASE_URLS.backend}/api/v1`;

export function createApiClient(): AxiosInstance {
  return axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface AuthTokens {
  accessToken: string;
  userId: string;
}

export async function apiLogin(phone: string, password: string): Promise<AuthTokens> {
  const client = createApiClient();
  const res = await client.post('/auth/login', { phone, password });
  const token = res.data.data.accessToken;
  // Get user info
  const meRes = await client.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    accessToken: token,
    userId: meRes.data.data.id,
  };
}

export function authedClient(accessToken: string): AxiosInstance {
  const client = createApiClient();
  client.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });
  return client;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const client = createApiClient();
    const res = await client.get('/health', { baseURL: BASE_URLS.backend });
    return res.data?.data?.db === 'connected';
  } catch {
    return false;
  }
}

export async function checkFrontend(url: string): Promise<boolean> {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.status === 200;
  } catch {
    return false;
  }
}
