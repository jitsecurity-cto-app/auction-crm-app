/**
 * E2E tests for core infrastructure
 * Tests verify API client and auth utilities work together for admin operations
 */

import { api, setAuthToken, removeAuthToken } from '@/lib/api';
import {
  login,
  logout,
  isAuthenticated,
  isAdmin,
  isAuthenticatedAdmin,
  getCurrentUser,
  getToken,
  setAuth,
  getAuthToken,
  getAuthUser,
} from '@/lib/auth';

// Mock fetch for E2E tests
global.fetch = jest.fn();

describe('Core Infrastructure E2E', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    removeAuthToken();
    localStorage.clear();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api';
  });

  describe('Complete Admin Authentication Flow', () => {
    it('should complete full admin login flow', async () => {
      // Step 1: Login as admin
      const loginResponse = {
        token: 'admin-jwt-token-123',
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => loginResponse,
      });

      const loginResult = await login({
        email: 'admin@example.com',
        password: 'admin-password',
      });

      expect(loginResult).toEqual(loginResponse);
      expect(localStorage.getItem('auth_token')).toBe('admin-jwt-token-123');
      expect(isAuthenticated()).toBe(true);
      expect(isAdmin()).toBe(true);
      expect(isAuthenticatedAdmin()).toBe(true);

      // Step 2: Verify token and get current user
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          user: loginResponse.user,
        }),
      });

      const currentUser = await getCurrentUser();

      expect(currentUser).toEqual(loginResponse.user);
      expect(getToken()).toBe('admin-jwt-token-123');

      // Step 3: Logout
      logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(isAuthenticated()).toBe(false);
      expect(isAdmin()).toBe(false);
    });

    it('should handle authentication errors gracefully', async () => {
      // Failed login
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        }),
      });

      await expect(
        login({ email: 'wrong@example.com', password: 'wrongpassword' })
      ).rejects.toThrow();

      expect(isAuthenticated()).toBe(false);
      expect(isAdmin()).toBe(false);
    });
  });

  describe('API Client with Admin Authentication', () => {
    it('should make authenticated admin API requests', async () => {
      // Set token
      setAuthToken('admin-token-123');

      // Make authenticated request
      const mockAuction = {
        id: 1,
        title: 'Test Auction',
        description: 'Test Description',
        starting_price: 100,
        current_bid: 100,
        status: 'active',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAuction }),
      });

      const auction = await api.getAuctionById(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auctions/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer admin-token-123',
          }),
        })
      );
      expect(auction.data).toEqual(mockAuction);
    });

    it('should handle token expiration (no validation - intentional vulnerability)', async () => {
      // Set expired token (but no validation happens)
      setAuth('expired-token-123', {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        created_at: new Date().toISOString(),
      });
      expect(isAuthenticated()).toBe(true); // Still considered authenticated
      expect(isAdmin()).toBe(true); // Still considered admin

      // Try to make request with expired token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized',
          message: 'Token expired',
        }),
      });

      await expect(api.getAuctionById(1)).rejects.toThrow();
    });
  });

  describe('Admin Operations Flow', () => {
    beforeEach(() => {
      setAuthToken('admin-token');
    });

    it('should list auctions, get details, create, update, and delete', async () => {
      // List auctions
      const mockAuctions = [
        {
          id: 1,
          title: 'Auction 1',
          current_bid: 100,
          status: 'active',
        },
        {
          id: 2,
          title: 'Auction 2',
          current_bid: 200,
          status: 'active',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAuctions }),
      });

      const auctions = await api.getAuctions();
      expect(auctions.data).toEqual(mockAuctions);

      // Get auction details
      const mockAuctionDetail = {
        ...mockAuctions[0],
        description: 'Full description',
        bids: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAuctionDetail }),
      });

      const auction = await api.getAuctionById(1);
      expect(auction.data).toEqual(mockAuctionDetail);

      // Create auction
      const newAuction = {
        id: 3,
        title: 'New Auction',
        description: 'New Description',
        starting_price: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: newAuction }),
      });

      const created = await api.createAuction({
        title: 'New Auction',
        description: 'New Description',
        starting_price: 300,
        end_time: new Date().toISOString(),
      });
      expect(created.data).toEqual(newAuction);

      // Update auction
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...newAuction, title: 'Updated Auction' } }),
      });

      const updated = await api.updateAuction(3, { title: 'Updated Auction' });
      expect(updated.data.title).toBe('Updated Auction');

      // Delete auction
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } }),
      });

      await api.deleteAuction(3);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auctions/3',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should manage users: list, get, update, delete', async () => {
      // List users
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'user',
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'user',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers }),
      });

      const users = await api.getUsers();
      expect(users.data).toEqual(mockUsers);

      // Get user by ID
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers[0],
      });

      const user = await api.getUserById('1');
      expect(user).toEqual(mockUsers[0]);

      // Update user
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockUsers[0], role: 'admin' }),
      });

      const updated = await api.updateUser('1', { role: 'admin' });
      expect(updated.role).toBe('admin');

      // Delete user
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.deleteUser('1');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Security Vulnerabilities Verification', () => {
    it('should expose tokens in localStorage (intentional vulnerability)', () => {
      const sensitiveToken = 'admin-jwt-token-with-sensitive-data';
      setAuthToken(sensitiveToken);

      // Token is directly accessible
      const token = getToken();
      expect(token).toBe(sensitiveToken);
      expect(localStorage.getItem('auth_token')).toBe(sensitiveToken);
    });

    it('should log sensitive information (intentional vulnerability)', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Login logs credentials
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'test-token',
          user: { id: '1', email: 'admin@example.com', role: 'admin' },
        }),
      });

      await login({ email: 'admin@example.com', password: 'password123' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Admin login attempt:',
        expect.objectContaining({
          email: 'admin@example.com',
        })
      );

      // API requests log tokens
      setAuthToken('admin-token-123');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await api.getAuctions();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'API Request:',
        expect.objectContaining({
          hasToken: true,
          tokenPreview: expect.any(String),
        })
      );

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should not validate token expiration (intentional vulnerability)', () => {
      // Even clearly invalid tokens are accepted
      setAuth('invalid-token', {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        created_at: new Date().toISOString(),
      });
      expect(isAuthenticated()).toBe(true);
      expect(isAdmin()).toBe(true);

      // No expiration check
      const oldToken = 'old-token-from-2020';
      setAuth(oldToken, {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        created_at: new Date().toISOString(),
      });
      expect(isAuthenticated()).toBe(true);
      expect(isAdmin()).toBe(true);
    });

    it('should allow client-side role manipulation (intentional vulnerability)', () => {
      // Client can set admin role without server validation
      setAuth('user-token', {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'admin', // Client-side role setting (vulnerability)
        created_at: new Date().toISOString(),
      });

      // Client-side check only
      expect(isAdmin()).toBe(true);
      expect(isAuthenticatedAdmin()).toBe(true);

      // But server should validate - this test verifies client-side vulnerability
      const user = getAuthUser();
      expect(user?.role).toBe('admin');
    });
  });
});
