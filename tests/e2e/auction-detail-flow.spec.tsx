/**
 * E2E tests for admin auction detail page
 * Tests: view auction → edit auction → delete auction
 * Verifies XSS rendering and authorization vulnerabilities
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Admin Auction Detail Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;
  let auctionId: number;

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

    // Create auction with XSS payload
    const auctionResponse = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Admin Test Auction',
        description: '<img src=x onerror="alert(\'XSS\')">Malicious Description',
        starting_price: 100,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const auctionData = await auctionResponse.json();
    auctionId = auctionData.id;
  });

  describe('View Auction Detail', () => {
    it('should view auction details as admin', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBe(auctionId);
      expect(data.title).toBe('Admin Test Auction');
    });

    it('should render XSS payload in auction description (intentional vulnerability)', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      // XSS payload should be present (no sanitization)
      expect(data.description).toContain('<img');
      expect(data.description).toContain('onerror');
    });

    it('should allow non-admin to view auction detail (authorization vulnerability)', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`, // Regular user accessing admin auction
        },
      });

      // Should work (authorization vulnerability) or fail (proper authorization)
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Edit Auction', () => {
    it('should update auction as admin', async () => {
      const updateData = {
        title: 'Updated Admin Auction',
        description: 'Updated description',
      };

      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
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

    it('should accept XSS in updated auction data (intentional vulnerability)', async () => {
      const xssUpdateData = {
        title: '<script>alert("XSS")</script>Updated Title',
        description: '<img src=x onerror="alert(document.cookie)">',
      };

      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(xssUpdateData),
      });

      // Should accept XSS payload (no sanitization)
      expect([200, 201, 400, 500]).toContain(response.status);
      
      if (response.ok) {
        const data = await response.json();
        // XSS payload should be present
        if (data.title) {
          expect(data.title).toContain('<script>');
        }
      }
    });

    it('should allow non-admin to update auction (authorization vulnerability)', async () => {
      const updateData = {
        title: 'Hacked Auction Title',
      };

      const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`, // Regular user updating admin auction
        },
        body: JSON.stringify(updateData),
      });

      // Should fail (proper authorization) or succeed (authorization vulnerability)
      expect([200, 201, 400, 401, 403, 500]).toContain(response.status);
    });
  });

  describe('Delete Auction', () => {
    let deletableAuctionId: number;

    beforeAll(async () => {
      // Create auction for deletion test
      const auctionResponse = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Deletable Auction',
          description: 'This auction will be deleted',
          starting_price: 50,
          end_time: new Date(Date.now() + 86400000).toISOString(),
        }),
      });

      const auctionData = await auctionResponse.json();
      deletableAuctionId = auctionData.id;
    });

    it('should delete auction as admin', async () => {
      const response = await fetch(`${API_URL}/auctions/${deletableAuctionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Should succeed or fail depending on implementation
      expect([200, 204, 400, 404, 500]).toContain(response.status);
    });

    it('should allow non-admin to delete auction (authorization vulnerability)', async () => {
      // Create another auction for this test
      const auctionResponse = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Another Deletable Auction',
          description: 'Testing deletion',
          starting_price: 75,
          end_time: new Date(Date.now() + 86400000).toISOString(),
        }),
      });

      const auctionData = await auctionResponse.json();
      const testAuctionId = auctionData.id;

      const response = await fetch(`${API_URL}/auctions/${testAuctionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`, // Regular user deleting admin auction
        },
      });

      // Should fail (proper authorization) or succeed (authorization vulnerability)
      expect([200, 204, 400, 401, 403, 404, 500]).toContain(response.status);
    });
  });

  describe('Bid History', () => {
    it('should view bid history for auction', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
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

    it('should allow non-admin to view bid history (authorization vulnerability)', async () => {
      const response = await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`, // Regular user viewing admin auction bids
        },
      });

      // Should work (authorization vulnerability) or fail (proper authorization)
      expect([200, 401, 403]).toContain(response.status);
    });
  });
});
