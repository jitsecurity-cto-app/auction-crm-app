import {
  setAuth,
  getAuthToken,
  getAuthUser,
  isAuthenticated,
  isAdmin,
  isAuthenticatedAdmin,
  clearAuth,
  login,
  logout,
  verifyToken,
} from '../../../src/lib/auth';
import { User, AuthResponse } from '../../../src/types';
import * as apiModule from '../../../src/lib/api';

// Mock API module
jest.mock('../../../src/lib/api');

describe('CRM Auth Utilities', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('stores and retrieves auth token', () => {
      const token = 'admin-token-123';
      const user: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      expect(getAuthToken()).toBe(token);
      expect(getAuthUser()).toEqual(user);
    });

    it('returns null when no token is stored', () => {
      expect(getAuthToken()).toBeNull();
      expect(getAuthUser()).toBeNull();
    });

    it('checks if user is authenticated', () => {
      expect(isAuthenticated()).toBe(false);

      const token = 'test-token';
      const user: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);
      expect(isAuthenticated()).toBe(true);
    });

    it('clears authentication data', () => {
      const token = 'test-token';
      const user: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);
      expect(isAuthenticated()).toBe(true);

      clearAuth();
      expect(isAuthenticated()).toBe(false);
      expect(getAuthToken()).toBeNull();
      expect(getAuthUser()).toBeNull();
    });
  });

  describe('Admin Role Checking', () => {
    it('returns true for admin user', () => {
      const token = 'admin-token';
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setAuth(token, adminUser);
      expect(isAdmin()).toBe(true);
      expect(isAuthenticatedAdmin()).toBe(true);
    });

    it('returns false for non-admin user', () => {
      const token = 'user-token';
      const regularUser: User = {
        id: '2',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, regularUser);
      expect(isAdmin()).toBe(false);
      expect(isAuthenticatedAdmin()).toBe(false);
    });

    it('returns false when no user is stored', () => {
      expect(isAdmin()).toBe(false);
      expect(isAuthenticatedAdmin()).toBe(false);
    });

    it('client-side role check only (security vulnerability)', () => {
      // This test verifies that role checking is client-side only
      // In a real app, this should be verified server-side
      const token = 'user-token';
      const regularUser: User = {
        id: '2',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, regularUser);
      
      // Client-side check correctly identifies non-admin
      expect(isAdmin()).toBe(false);
      
      // But the token is still stored, allowing potential bypass
      // This is an intentional vulnerability
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('Login', () => {
    it('logs in admin user and stores token', async () => {
      const mockResponse: AuthResponse = {
        token: 'admin-login-token',
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          created_at: new Date().toISOString(),
        },
      };

      (apiModule.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const loginData = {
        email: 'admin@example.com',
        password: 'password123',
      };

      const result = await login(loginData);

      expect(apiModule.api.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse);
      expect(getAuthToken()).toBe('admin-login-token');
      expect(getAuthUser()).toEqual(mockResponse.user);
      expect(isAdmin()).toBe(true);
    });

    it('allows login for non-admin user (intentional vulnerability)', async () => {
      const mockResponse: AuthResponse = {
        token: 'user-token',
        user: {
          id: '2',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
          created_at: new Date().toISOString(),
        },
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (apiModule.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const result = await login(loginData);

      // Login succeeds even for non-admin (vulnerability)
      expect(result).toEqual(mockResponse);
      expect(getAuthToken()).toBe('user-token');
      
      // Warning is logged but access is still allowed
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('User is not an admin')
      );

      consoleSpy.mockRestore();
    });

    it('handles login errors', async () => {
      const error = new Error('Invalid credentials');
      (apiModule.api.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        login({
          email: 'admin@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('intentionally logs credentials (security vulnerability)', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockResponse: AuthResponse = {
        token: 'admin-token',
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          created_at: new Date().toISOString(),
        },
      };

      (apiModule.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      await login({
        email: 'admin@example.com',
        password: 'password123',
      });

      // Credentials are logged (vulnerability)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Admin login attempt:',
        expect.objectContaining({
          email: 'admin@example.com',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Logout', () => {
    it('clears authentication data', () => {
      const token = 'test-token';
      const user: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);
      expect(isAuthenticated()).toBe(true);
      expect(isAdmin()).toBe(true);

      logout();
      expect(isAuthenticated()).toBe(false);
      expect(isAdmin()).toBe(false);
    });
  });

  describe('Token Verification', () => {
    it('verifies valid token', async () => {
      const token = 'valid-token';
      const user: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      const mockResponse = {
        valid: true,
        user,
      };

      (apiModule.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await verifyToken();

      expect(apiModule.api.post).toHaveBeenCalledWith(
        '/auth/verify',
        {},
        true
      );
      expect(result).toEqual(user);
    });

    it('returns null for invalid token', async () => {
      const error = new Error('Invalid token');
      (apiModule.api.post as jest.Mock).mockRejectedValueOnce(error);

      const result = await verifyToken();

      expect(result).toBeNull();
    });

    it('returns null when no token is stored', async () => {
      clearAuth();
      const result = await verifyToken();
      expect(result).toBeNull();
      expect(apiModule.api.post).not.toHaveBeenCalled();
    });
  });

  describe('Security Vulnerabilities (Intentional)', () => {
    it('stores token in localStorage (XSS vulnerability)', () => {
      const token = 'sensitive-admin-token';
      const user: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      // Token is stored in localStorage (vulnerable to XSS)
      expect(localStorage.getItem('auth_token')).toBe(token);
    });

    it('does not check token expiration (intentional vulnerability)', () => {
      const token = 'expired-token';
      const user: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      // isAuthenticated only checks if token exists, not if it's expired
      expect(isAuthenticated()).toBe(true);
    });

    it('client-side admin check only (no server-side validation)', () => {
      // This test verifies the intentional vulnerability:
      // Admin role is checked client-side only
      const token = 'user-token';
      const user: User = {
        id: '2',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setAuth(token, user);

      // Client correctly identifies non-admin
      expect(isAdmin()).toBe(false);
      
      // But token is still valid and stored
      // In a real app, server should reject non-admin access
      expect(isAuthenticated()).toBe(true);
    });
  });
});

