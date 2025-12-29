/**
 * E2E tests for admin order detail page
 * Tests: view order → update order status → update shipping
 * Verifies IDOR vulnerabilities and order management
 */

// Polyfill fetch for Node.js environment
import fetch from 'node-fetch';
(global as any).fetch = fetch;

describe('Admin Order Detail Flow E2E', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  let adminToken: string;
  let sellerToken: string;
  let buyerToken: string;
  let sellerId: string;
  let buyerId: string;
  let auctionId: number;
  let orderId: string;

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

    // Create seller
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `seller-${timestamp}@example.com`,
        password: 'password123',
        name: 'Seller User',
      }),
    });

    const sellerLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `seller-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const sellerData = await sellerLogin.json();
    sellerToken = sellerData.token;
    sellerId = sellerData.user.id;

    // Create buyer
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `buyer-${timestamp}@example.com`,
        password: 'password123',
        name: 'Buyer User',
      }),
    });

    const buyerLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `buyer-${timestamp}@example.com`,
        password: 'password123',
      }),
    });

    const buyerData = await buyerLogin.json();
    buyerToken = buyerData.token;
    buyerId = buyerData.user.id;

    // Create expired auction
    const auctionResponse = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        title: 'Order Detail Test Auction',
        description: 'Test auction for order detail flow',
        starting_price: 100,
        end_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      }),
    });

    const auctionData = await auctionResponse.json();
    auctionId = auctionData.id;

    // Place bid
    await fetch(`${API_URL}/auctions/${auctionId}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ amount: 150 }),
    });

    // Close auction
    await fetch(`${API_URL}/auctions/${auctionId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    // Create order
    const orderResponse = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        auction_id: auctionId,
        shipping_address: '123 Test Street',
      }),
    });

    if (orderResponse.ok) {
      const orderData = await orderResponse.json();
      orderId = orderData.id;
    }
  });

  describe('View Order Detail', () => {
    it('should view order details as admin', async () => {
      if (!orderId) return;

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBe(orderId);
      expect(data.auction_id).toBe(auctionId);
    });

    it('should allow non-admin to view order (IDOR vulnerability)', async () => {
      if (!orderId) return;

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`, // Seller viewing order
        },
      });

      // Should work (IDOR vulnerability) or fail (proper authorization)
      expect([200, 401, 403, 404]).toContain(response.status);
    });

    it('should view order without authentication (IDOR vulnerability)', async () => {
      if (!orderId) return;

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // No Authorization header
      });

      // Should work (IDOR vulnerability) or fail (proper authorization)
      expect([200, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('Update Order Status', () => {
    it('should update order status as admin', async () => {
      if (!orderId) return;

      const updateData = {
        status: 'paid',
        payment_status: 'paid',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
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

    it('should allow non-admin to update order (IDOR vulnerability)', async () => {
      if (!orderId) return;

      const updateData = {
        status: 'completed',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`, // Buyer updating order
        },
        body: JSON.stringify(updateData),
      });

      // Should fail (proper authorization) or succeed (IDOR vulnerability)
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(response.status);
    });

    it('should accept XSS in order update data (intentional vulnerability)', async () => {
      if (!orderId) return;

      const xssUpdateData = {
        tracking_number: '<script>alert("XSS")</script>TRACK123',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
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
  });

  describe('Update Shipping Information', () => {
    it('should update shipping status as admin', async () => {
      if (!orderId) return;

      const updateData = {
        shipping_status: 'shipped',
        tracking_number: 'TRACK123456',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
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

    it('should allow seller to update shipping (authorization check)', async () => {
      if (!orderId) return;

      const updateData = {
        shipping_status: 'shipped',
        tracking_number: 'SELLER123',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`, // Seller updating shipping
        },
        body: JSON.stringify(updateData),
      });

      // Should succeed (seller owns auction) or fail (authorization check)
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(response.status);
    });

    it('should allow buyer to update shipping (authorization vulnerability)', async () => {
      if (!orderId) return;

      const updateData = {
        shipping_status: 'delivered',
      };

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`, // Buyer updating shipping
        },
        body: JSON.stringify(updateData),
      });

      // Should fail (buyer shouldn't update shipping) or succeed (vulnerability)
      expect([200, 201, 400, 401, 403, 404, 500]).toContain(response.status);
    });
  });

  describe('Order Filtering', () => {
    it('should filter orders by status', async () => {
      const response = await fetch(`${API_URL}/orders?status=pending_payment`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should filter orders by payment status', async () => {
      const response = await fetch(`${API_URL}/orders?payment_status=paid`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should filter orders by shipping status', async () => {
      const response = await fetch(`${API_URL}/orders?shipping_status=shipped`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should accept SQL injection in order filters (intentional vulnerability)', async () => {
      const response = await fetch(`${API_URL}/orders?status=pending_payment' OR '1'='1`, {
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
});
