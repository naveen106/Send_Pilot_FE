import { User } from '../types';

// These credentials are intentionally frontend-only and are used only when the API is unavailable.
export const OFFLINE_DEMO_EMAIL = 'demo@example.com';
export const OFFLINE_DEMO_PASSWORD = 'demo123';
export const OFFLINE_DEMO_SESSION_KEY = 'offlineDemoSession';

export function isOfflineDemoSession(): boolean {
  return sessionStorage.getItem(OFFLINE_DEMO_SESSION_KEY) === 'true';
}

export const offlineDemoUser: User = {
  id: 0,
  email: OFFLINE_DEMO_EMAIL,
  name: 'Offline Demo User',
  role: 'ADMIN',
};

export function isOfflineDemoCredentials(email: string, password: string): boolean {
  return email.toLowerCase() === OFFLINE_DEMO_EMAIL && password === OFFLINE_DEMO_PASSWORD;
}
