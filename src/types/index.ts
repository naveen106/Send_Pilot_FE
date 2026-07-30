export type Role = 'ADMIN' | 'USER' | 'MANAGER';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Campaign {
  id: number;
  name: string;
  subject: string;
  to: string;
  cc?: string;
  bcc?: string;
  status: string;
  sentCount: number;
  failedCount: number;
  totalCount: number;
  scheduledAt?: string;
  createdAt: string;
}

export interface Contact {
  id: number;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalEmails: number;
  sentToday: number;
  scheduledCampaigns: number;
  totalCampaigns: number;
}

export interface AppLog {
  id: number;
  level: string;
  message: string;
  context?: string;
  createdAt: string;
}
