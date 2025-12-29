/**
 * Unit tests for My Sales page (CRM)
 * Verifies IDOR vulnerability exists (no authorization check)
 */

import { render, screen, waitFor } from '@testing-library/react';
import MySalesPage from '@/app/my-sales/page';
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

describe('My Sales Page (CRM)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display sales for authenticated user', async () => {
    const mockUser = { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin' };
    const mockSales = [
      {
        id: 1,
        title: 'Sold Auction',
        description: 'Test Description',
        final_price: 200,
        bid_count: 10,
        winner_id: 2,
        payment_status: 'paid',
        end_time: new Date().toISOString(),
      },
    ];

    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getAuthUser as jest.Mock).mockReturnValue(mockUser);
    (api.getMySales as jest.Mock).mockResolvedValue(mockSales);

    render(<MySalesPage />);

    await waitFor(() => {
      expect(screen.getByText('My Sales')).toBeInTheDocument();
      expect(screen.getByText('Sold Auction')).toBeInTheDocument();
      expect(screen.getByText('$200.00')).toBeInTheDocument();
      expect(screen.getByText('paid')).toBeInTheDocument();
    });

    // Verify IDOR vulnerability: can access any user's sales
    expect(api.getMySales).toHaveBeenCalledWith('1');
  });

  it('should show login prompt for unauthenticated user', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);
    (getAuthUser as jest.Mock).mockReturnValue(null);

    render(<MySalesPage />);

    expect(screen.getByText('My Sales')).toBeInTheDocument();
    expect(screen.getByText(/You must be logged in/)).toBeInTheDocument();
  });
});
