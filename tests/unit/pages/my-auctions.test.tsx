/**
 * Unit tests for My Auctions page (CRM)
 * Verifies IDOR vulnerability exists (no authorization check)
 */

import { render, screen, waitFor } from '@testing-library/react';
import MyAuctionsPage from '@/app/my-auctions/page';
import { api } from '@/lib/api';
import { getAuthUser, isAuthenticated } from '@/lib/auth';

jest.mock('@/lib/api');
jest.mock('@/lib/auth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

describe('My Auctions Page (CRM)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display auctions for authenticated user', async () => {
    const mockUser = { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin' };
    const mockAuctions = [
      {
        id: 1,
        title: 'My Auction',
        description: 'Test Description',
        starting_price: 100,
        highest_bid: 150,
        bid_count: 5,
        status: 'active',
        end_time: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getAuthUser as jest.Mock).mockReturnValue(mockUser);
    (api.getMyAuctions as jest.Mock).mockResolvedValue(mockAuctions);

    render(<MyAuctionsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Auctions')).toBeInTheDocument();
      expect(screen.getByText('My Auction')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Verify IDOR vulnerability: can access any user's auctions
    expect(api.getMyAuctions).toHaveBeenCalledWith('1');
  });

  it('should show login prompt for unauthenticated user', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);
    (getAuthUser as jest.Mock).mockReturnValue(null);

    render(<MyAuctionsPage />);

    expect(screen.getByText('My Auctions')).toBeInTheDocument();
    expect(screen.getByText(/You must be logged in/)).toBeInTheDocument();
  });
});
