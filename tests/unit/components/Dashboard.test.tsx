import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../../../src/components/Dashboard';
import * as apiLib from '../../../src/lib/api';

// Mock API library
jest.mock('../../../src/lib/api');

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading state initially', () => {
    (apiLib.api.getAuctions as jest.Mock) = jest.fn(
      () => new Promise(() => {}) // Never resolves
    );
    (apiLib.api.getUsers as jest.Mock) = jest.fn(
      () => new Promise(() => {}) // Never resolves
    );
    (apiLib.api.getDisputes as jest.Mock) = jest.fn(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Dashboard />);

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('displays dashboard stats after loading', async () => {
    const mockAuctions = [
      {
        id: '1',
        title: 'Auction 1',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Auction 2',
        status: 'ended',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'User 1',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        email: 'user2@example.com',
        name: 'User 2',
        role: 'user',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    // API returns arrays directly, not wrapped in { data: [...] }
    (apiLib.api.getAuctions as jest.Mock) = jest.fn().mockResolvedValue(mockAuctions);
    (apiLib.api.getUsers as jest.Mock) = jest.fn().mockResolvedValue(mockUsers);
    (apiLib.api.getDisputes as jest.Mock) = jest.fn().mockResolvedValue([]);
    (apiLib.api.getBidsByAuction as jest.Mock) = jest.fn().mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Auctions')).toBeInTheDocument();
      expect(screen.getByText('Active Auctions')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    // Check that stats are displayed (may appear multiple times)
    const statsValues = screen.getAllByText('2');
    expect(statsValues.length).toBeGreaterThan(0);
    expect(screen.getByText('1')).toBeInTheDocument(); // Active auctions
  });

  it('displays stats cards with correct values', async () => {
    const mockAuctions = [
      {
        id: '1',
        title: 'Auction 1',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'User 1',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    // API returns arrays directly, not wrapped in { data: [...] }
    (apiLib.api.getAuctions as jest.Mock) = jest.fn().mockResolvedValue(mockAuctions);
    (apiLib.api.getUsers as jest.Mock) = jest.fn().mockResolvedValue(mockUsers);
    (apiLib.api.getDisputes as jest.Mock) = jest.fn().mockResolvedValue([]);
    (apiLib.api.getBidsByAuction as jest.Mock) = jest.fn().mockResolvedValue(
      [{ id: '1', amount: 100 }]
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Auctions')).toBeInTheDocument();
      expect(screen.getByText('Active Auctions')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Bids')).toBeInTheDocument();
    });
  });

  it('displays recent activity', async () => {
    const mockAuctions = [
      {
        id: '1',
        title: 'Test Auction',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const mockUsers = [
      {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    // API returns arrays directly, not wrapped in { data: [...] }
    (apiLib.api.getAuctions as jest.Mock) = jest.fn().mockResolvedValue(mockAuctions);
    (apiLib.api.getUsers as jest.Mock) = jest.fn().mockResolvedValue(mockUsers);
    (apiLib.api.getDisputes as jest.Mock) = jest.fn().mockResolvedValue([]);
    (apiLib.api.getBidsByAuction as jest.Mock) = jest.fn().mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (apiLib.api.getAuctions as jest.Mock) = jest.fn().mockRejectedValue(
      new Error('API Error')
    );
    (apiLib.api.getUsers as jest.Mock) = jest.fn().mockResolvedValue([]);
    (apiLib.api.getDisputes as jest.Mock) = jest.fn().mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('calculates bid count from multiple auctions', async () => {
    const mockAuctions = [
      { id: '1', title: 'Auction 1', status: 'active', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', title: 'Auction 2', status: 'active', created_at: '2024-01-02T00:00:00Z' },
    ];

    // API returns arrays directly, not wrapped in { data: [...] }
    (apiLib.api.getAuctions as jest.Mock) = jest.fn().mockResolvedValue(mockAuctions);
    (apiLib.api.getUsers as jest.Mock) = jest.fn().mockResolvedValue([]);
    (apiLib.api.getDisputes as jest.Mock) = jest.fn().mockResolvedValue([]);
    (apiLib.api.getBidsByAuction as jest.Mock) = jest.fn()
      .mockResolvedValueOnce([{ id: '1' }, { id: '2' }])
      .mockResolvedValueOnce([{ id: '3' }]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total bids (2 + 1)
    });
  });
});

