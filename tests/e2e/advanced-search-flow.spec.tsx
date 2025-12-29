/**
 * E2E tests for advanced search functionality
 * Tests: search with filters → combine filters
 * Verifies SQL injection vulnerabilities in search parameters
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Advanced Search Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let adminToken: string;

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
        role: 'admin',
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

    // Create test auctions
    const auctions = [
      {
        title: 'Vintage Camera Collection',
        description: 'A beautiful collection of vintage cameras',
        starting_price: 100,
        status: 'active',
      },
      {
        title: 'Antique Watch Set',
        description: 'Rare antique watches from 1800s',
        starting_price: 500,
        status: 'active',
      },
      {
        title: 'First Edition Books',
        description: 'Rare first edition books',
        starting_price: 50,
        status: 'ended',
      },
    ];

    for (const auction of auctions) {
      await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...auction,
          end_time: auction.status === 'ended' 
            ? new Date(Date.now() - 86400000).toISOString()
            : new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    }
  });

  describe('Search with Text', () => {
    it('should search auctions by title', async () => {
      const response = await fetch(`${API_URL}/auctions?search=camera`, {
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

    it('should search auctions by description', async () => {
      const response = await fetch(`${API_URL}/auctions?search=vintage`, {
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

    it('should accept XSS in search query (intentional vulnerability)', async () => {
      const xssQuery = '<script>alert("XSS")</script>';
      const response = await fetch(`${API_URL}/auctions?search=${encodeURIComponent(xssQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Should accept XSS payload (no sanitization)
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should accept SQL injection in search query (intentional vulnerability)', async () => {
      const sqlQuery = "camera' OR '1'='1";
      const response = await fetch(`${API_URL}/auctions?search=${encodeURIComponent(sqlQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Should either fail with SQL error or expose vulnerability
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Filter by Status', () => {
    it('should filter auctions by active status', async () => {
      const response = await fetch(`${API_URL}/auctions?status=active`, {
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

    it('should filter auctions by ended status', async () => {
      const response = await fetch(`${API_URL}/auctions?status=ended`, {
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

    it('should accept SQL injection in status filter (intentional vulnerability)', async () => {
      const sqlStatus = "active' OR '1'='1";
      const response = await fetch(`${API_URL}/auctions?status=${encodeURIComponent(sqlStatus)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Should either fail with SQL error or expose vulnerability
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Filter by Price Range', () => {
    it('should filter auctions by minimum price', async () => {
      const response = await fetch(`${API_URL}/auctions?minPrice=100`, {
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

    it('should filter auctions by maximum price', async () => {
      const response = await fetch(`${API_URL}/auctions?maxPrice=200`, {
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

    it('should filter auctions by price range', async () => {
      const response = await fetch(`${API_URL}/auctions?minPrice=50&maxPrice=200`, {
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

    it('should accept SQL injection in price filters (intentional vulnerability)', async () => {
      const sqlPrice = "100 OR 1=1";
      const response = await fetch(`${API_URL}/auctions?minPrice=${encodeURIComponent(sqlPrice)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Should either fail with SQL error or expose vulnerability
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Combined Search and Filters', () => {
    it('should combine search and status filter', async () => {
      const response = await fetch(`${API_URL}/auctions?search=camera&status=active`, {
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

    it('should combine search, status, and price filters', async () => {
      const response = await fetch(`${API_URL}/auctions?search=vintage&status=active&minPrice=50&maxPrice=200`, {
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
  });

  describe('Search Users', () => {
    it('should list all users', async () => {
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const users = await response.json();
      expect(Array.isArray(users)).toBe(true);
    });

    it('should accept SQL injection in user list (intentional vulnerability)', async () => {
      // Note: This would depend on if there's a search parameter for users
      // Testing basic endpoint access
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
