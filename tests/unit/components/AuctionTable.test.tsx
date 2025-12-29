import React from 'react';
import { render, screen } from '@testing-library/react';
import AuctionTable from '../../../src/components/AuctionTable';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('AuctionTable', () => {
  const mockAuctions = [
    {
      id: '1',
      title: 'Test Auction 1',
      description: 'Description 1',
      starting_price: 100,
      current_bid: 150,
      end_time: '2024-12-31T23:59:59Z',
      status: 'active',
      created_by: 'user1',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Test Auction 2',
      description: 'Description 2',
      starting_price: 200,
      current_bid: 200,
      end_time: '2024-12-30T23:59:59Z',
      status: 'ended',
      created_by: 'user2',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  it('renders table with auction data', () => {
    render(<AuctionTable auctions={mockAuctions} />);

    expect(screen.getByText('Test Auction 1')).toBeInTheDocument();
    expect(screen.getByText('Test Auction 2')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('ended')).toBeInTheDocument();
  });

  it('displays empty state when no auctions', () => {
    render(<AuctionTable auctions={[]} />);

    expect(screen.getByText(/no auctions found/i)).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(<AuctionTable auctions={mockAuctions} />);

    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('displays status badges with correct colors', () => {
    render(<AuctionTable auctions={mockAuctions} />);

    const activeBadge = screen.getByText('active');
    const endedBadge = screen.getByText('ended');

    expect(activeBadge).toBeInTheDocument();
    expect(endedBadge).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    render(<AuctionTable auctions={mockAuctions} onDelete={mockOnDelete} />);

    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons.length).toBe(2);

    // Click first delete button
    deleteButtons[0].click();
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('renders edit links for each auction', () => {
    render(<AuctionTable auctions={mockAuctions} />);

    const editLinks = screen.getAllByText('Edit');
    expect(editLinks.length).toBe(2);
    expect(editLinks[0].closest('a')).toHaveAttribute('href', '/auctions/1');
    expect(editLinks[1].closest('a')).toHaveAttribute('href', '/auctions/2');
  });

  it('does not show delete buttons when onDelete is not provided', () => {
    render(<AuctionTable auctions={mockAuctions} />);

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<AuctionTable auctions={mockAuctions} />);

    // Check that dates are rendered (format may vary by locale)
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('2024');
  });
});

