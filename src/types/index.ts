export type Role = 'ADMIN' | 'USER' | 'MANAGER';

/** Campaign send strategy — controls how emails are dispatched. */
export type SendMode = 'immediate' | 'scheduled' | 'interval';

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
  htmlContent: string;
  status: string;
  recipients: string[];
  totalCount: number;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;                    // null when the creator was deleted
  sendMode?: string;
  attachments?: { filename: string; content: string; contentType: string }[];
  user?: { name: string; email: string } | null; // null when creator was deleted
  assignedCampaigns: { id: number; contactId: number; contacts: Contact; campaignId: number; campaign: Campaign }[];
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

export interface assignedCampaigns {
  id: number;
  contactId: number;
  contacts: Contact;
  campaignId: number;
  campaign: Campaign;
}


