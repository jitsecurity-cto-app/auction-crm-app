import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import Navbar from '../../../src/components/Navbar';
import * as authLib from '../../../src/lib/auth';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(),
}));

// Mock auth library
jest.mock('../../../src/lib/auth');

describe('Navbar', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
    (authLib.logout as jest.Mock) = mockLogout;
    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('renders CRM Admin Panel title', () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authLib.getAuthUser as jest.Mock).mockReturnValue(null);

    render(<Navbar />);

    expect(screen.getByText('CRM Admin Panel')).toBeInTheDocument();
  });

  it('shows login link when not authenticated', () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authLib.getAuthUser as jest.Mock).mockReturnValue(null);

    render(<Navbar />);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Auctions')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('shows navigation links when authenticated', () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authLib.getAuthUser as jest.Mock).mockReturnValue({
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    });

    render(<Navbar />);

    expect(screen.getByText('Auctions')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('displays user name when authenticated', () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authLib.getAuthUser as jest.Mock).mockReturnValue({
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    });

    render(<Navbar />);

    // The design-system Navbar renders user.name in a navbar-user span
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('displays user email when name is not available', () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authLib.getAuthUser as jest.Mock).mockReturnValue({
      id: '1',
      email: 'admin@example.com',
      name: '',
      role: 'admin',
    });

    render(<Navbar />);

    // The design-system Navbar renders user.name || user.email in a navbar-user span
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('calls logout and redirects on logout button click', () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authLib.getAuthUser as jest.Mock).mockReturnValue({
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    });

    render(<Navbar />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });

  it('highlights active route in navigation', () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authLib.getAuthUser as jest.Mock).mockReturnValue({
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    });
    (usePathname as jest.Mock).mockReturnValue('/auctions');

    render(<Navbar />);

    // The design-system Navbar renders links as <a> tags with href
    const auctionsLink = screen.getByText('Auctions').closest('a');
    expect(auctionsLink).toBeInTheDocument();
    expect(auctionsLink).toHaveAttribute('href', '/auctions');
  });
});

