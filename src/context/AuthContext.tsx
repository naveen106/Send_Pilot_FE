import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { authApi } from '../api';
import {
  mockLogin,
  mockRegister,
  mockForgotPassword,
  mockResetPassword,
  mockGetUserFromToken,
} from '../api/mockAuth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: Role) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: Role[]) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi.me()
        .then((res) => setUser(res.data.data))
        .catch((err) => {
          const status = err.response?.status;
          const isServerDown = !status || status >= 500;
          if (isServerDown) {
            const mockUser = mockGetUserFromToken(token);
            if (mockUser) { setUser(mockUser); return; }
          }
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    try {
      const res = await authApi.login(email, password);
      const { token: t, user: u } = res.data.data;
      localStorage.setItem('token', t);
      setToken(t);
      setUser(u);
    } catch (apiErr: any) {
      const status = apiErr.response?.status;
      const isServerDown = !status || status >= 500;
      if (isServerDown) {
        const { token: t, user: u } = mockLogin(email, password);
        localStorage.setItem('token', t);
        setToken(t);
        setUser(u);
      } else {
        throw apiErr;
      }
    }
  }

  async function register(email: string, password: string, name: string, role: Role = 'ADMIN') {
    mockRegister(email, password, name, role);
  }

  async function forgotPassword(email: string): Promise<string> {
    return mockForgotPassword(email);
  }

  async function resetPassword(resetToken: string, newPassword: string) {
    mockResetPassword(resetToken, newPassword);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  function hasRole(...roles: Role[]) {
    return !!user && roles.includes(user.role);
  }

  return (
    <AuthContext.Provider
      value={{
        user, token, login, register, forgotPassword, resetPassword,
        logout, isAuthenticated: !!user, hasRole, loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
