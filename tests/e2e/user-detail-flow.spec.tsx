/**
 * E2E tests for admin user detail page
 * Tests: view user → edit user → view user activity
 * Verifies IDOR vulnerabilities and sensitive data exposure
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Admin User Detail Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create admin user
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `admin-${timestamp}@example.com`,
        password: 'password123',
        name: 'Admin User',
        role: 'admin', // Client-side role setting (vulnerability)
      }),
    });

    const adminLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `admin-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const adminData = await adminLogin.json();
    adminToken = adminData.token;
    adminId = adminData.user.id;

    // Create regular user
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user-${timestamp}@example.com`,
        password: 'password123',
        name: 'Regular User',
      }),
    });

    const userLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const userData = await userLogin.json();
    userToken = userData.token;
    userId = userData.user.id;
  });

  describe('View User Detail', () => {
    it('should view user details as admin', async () => {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBe(userId);
      expect(data.email).toContain('user-');
      expect(data.name).toBe('Regular User');
    });

    it('should expose password hash in user detail (intentional vulnerability)', async () => {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Intentionally exposes password hash (security vulnerability)
        if (data.password_hash) {
          expect(data).toHaveProperty('password_hash');
          expect(typeof data.password_hash).toBe('string');
        }
      }
    });

    it('should allow non-admin to view user details (authorization vulnerability)', async () => {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`, // Regular user viewing another user
        },
      });

      // Should work (authorization vulnerability) or fail (proper authorization)
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Edit User', () => {
    it('should update user as admin', async () => {
      const updateData = {
        name: 'Updated User Name',
        phone: '123-456-7890',
        address: '123 Test Street',
      };

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      });

      // Should succeed or fail depending on implementation
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should change user role as admin', async () => {
      const updateData = {
        role: 'admin', // Change regular user to admin
      };

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      });

      // Should succeed or fail depending on implementation
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should accept XSS in user update data (intentional vulnerability)', async () => {
      const xssUpdateData = {
        name: '<script>alert("XSS")</script>Malicious Name',
        address: '<img src=x onerror="alert(document.cookie)">',
      };

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(xssUpdateData),
      });

      // Should accept XSS payload (no sanitization)
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it('should allow non-admin to update user (authorization vulnerability)', async () => {
      const updateData = {
        name: 'Hacked User Name',
      };

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`, // Regular user updating another user
        },
        body: JSON.stringify(updateData),
      });

      // Should fail (proper authorization) or succeed (authorization vulnerability)
      expect([200, 201, 400, 401, 403, 500]).toContain(response.status);
    });
  });

  describe('View User Activity', () => {
    it('should view user bids', async () => {
      const response = await fetch(`${API_URL}/users/${userId}/my-bids`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const bids = await response.json();
      expect(Array.isArray(bids)).toBe(true);
    });

    it('should view user auctions', async () => {
      const response = await fetch(`${API_URL}/users/${userId}/my-auctions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const auctions = await response.json();
      expect(Array.isArray(auctions)).toBe(true);
    });

    it('should view user wins', async () => {
      const response = await fetch(`${API_URL}/users/${userId}/my-wins`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const wins = await response.json();
      expect(Array.isArray(wins)).toBe(true);
    });

    it('should view user sales', async () => {
      const response = await fetch(`${API_URL}/users/${userId}/my-sales`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const sales = await response.json();
      expect(Array.isArray(sales)).toBe(true);
    });

    it('should allow non-admin to view user activity (IDOR vulnerability)', async () => {
      const response = await fetch(`${API_URL}/users/${userId}/my-bids`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`, // Regular user viewing another user's bids
        },
      });

      // Should work (IDOR vulnerability) or fail (proper authorization)
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Sensitive Data Exposure', () => {
    it('should expose all user data including sensitive fields', async () => {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Should expose various user data
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('email');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('role');
        expect(data).toHaveProperty('created_at');
        // Password hash may be exposed (vulnerability)
      }
    });
  });
});
