import { authApi } from './modules/auth';
import { telemetryApi } from './modules/telemetry';
import { masterApi } from './modules/master';
import { feedingApi } from './modules/feeding';
import { devicesApi } from './modules/devices';
import { reportsApi } from './modules/reports';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || '');

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

// Construct unified facade api client object to ensure backward compatibility
export const api = {
  ...authApi(BACKEND_URL, getHeaders),
  ...telemetryApi(BACKEND_URL, getHeaders),
  ...masterApi(BACKEND_URL, getHeaders),
  ...feedingApi(BACKEND_URL, getHeaders),
  ...devicesApi(BACKEND_URL, getHeaders),
  ...reportsApi(BACKEND_URL, getHeaders),
};
