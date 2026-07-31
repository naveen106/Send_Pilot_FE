import { Role, User } from '../types';

export interface MockUser extends User {
  password: string;
  isActive: boolean;
  resetToken?: string;
}

// ── Seeded test users ────────────────────────────────────────────────────────
const users: MockUser[] = [
  {
    id: 1,
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Test Admin',
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: undefined,
  },
  {
    id: 2,
    email: 'manager@test.com',
    password: 'manager123',
    name: 'Test Manager',
    role: 'MANAGER',
    isActive: true,
    lastLoginAt: undefined,
  },
  {
    id: 3,
    email: 'user@test.com',
    password: 'user123',
    name: 'Test User',
    role: 'USER',
    isActive: true,
    lastLoginAt: undefined,
  },
];

let nextId = 4;

function makeToken(user: MockUser): string {
  return btoa(JSON.stringify({ userId: user.id, email: user.email, role: user.role }));
}

export function mockLogin(email: string, password: string): { token: string; user: User } {
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found) throw new Error('No account found with that email');
  if (!found.isActive) throw new Error('Account is disabled');
  if (found.password !== password) throw new Error('Incorrect password');

  found.lastLoginAt = new Date().toISOString();
  const { password: _, resetToken: __, ...safeUser } = found;
  return { token: makeToken(found), user: safeUser };
}

export function mockRegister(
  email: string,
  password: string,
  name: string,
  role: Role = 'ADMIN'
): User {
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists');
  }
  const newUser: MockUser = {
    id: nextId++,
    email: email.toLowerCase(),
    password,
    name,
    role,
    isActive: true,
  };
  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  return safeUser;
}

export function mockForgotPassword(email: string): string {
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found) throw new Error('No account found with that email');

  // Generate a simple reset token
  const token = Math.random().toString(36).slice(2, 10).toUpperCase();
  found.resetToken = token;

  // In offline mode this token is returned for demo; real backend sends it via email
  return token;
}

export function mockResetPassword(token: string, newPassword: string): void {
  const found = users.find((u) => u.resetToken === token);
  if (!found) throw new Error('Invalid or expired reset token');
  found.password = newPassword;
  found.resetToken = undefined;
}

export function mockGetUserFromToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token)) as { userId: number; email: string; role: Role };
    const found = users.find((u) => u.id === payload.userId);
    if (!found || !found.isActive) return null;
    const { password: _, resetToken: __, ...safeUser } = found;
    return safeUser;
  } catch {
    return null;
  }
}

export function mockGetAllUsers(): User[] {
  return users.map(({ password: _, resetToken: __, ...u }) => u);
}

export function mockUpdateRole(userId: number, role: Role): User {
  const found = users.find((u) => u.id === userId);
  if (!found) throw new Error('User not found');
  found.role = role;
  const { password: _, resetToken: __, ...safeUser } = found;
  return safeUser;
}

export function mockToggleStatus(userId: number): User {
  const found = users.find((u) => u.id === userId);
  if (!found) throw new Error('User not found');
  found.isActive = !found.isActive;
  const { password: _, resetToken: __, ...safeUser } = found;
  return safeUser;
}
