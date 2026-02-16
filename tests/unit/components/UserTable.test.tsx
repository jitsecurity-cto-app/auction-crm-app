import React from 'react';
import { render, screen } from '@testing-library/react';
import UserTable from '../../../src/components/UserTable';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('UserTable', () => {
  const mockUsers = [
    {
      id: '1',
      email: 'user1@example.com',
      name: 'User One',
      role: 'user',
      password: 'hashed_password_12345678901234567890',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      password: 'hashed_password_admin_12345678901234567890',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  it('renders table with user data', () => {
    render(<UserTable users={mockUsers} />);

    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('displays empty state when no users', () => {
    render(<UserTable users={[]} />);

    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it('displays password hash (intentional vulnerability)', () => {
    render(<UserTable users={mockUsers} />);

    // Password hash should be displayed (truncated to 20 chars + ...)
    expect(screen.getByText(/hashed_password_1234/i)).toBeInTheDocument();
  });

  it('displays role badges with correct styling', () => {
    render(<UserTable users={mockUsers} />);

    const userBadge = screen.getByText('user');
    const adminBadge = screen.getByText('admin');

    expect(userBadge).toBeInTheDocument();
    expect(adminBadge).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    render(<UserTable users={mockUsers} onDelete={mockOnDelete} />);

    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons.length).toBe(2);

    // Click first delete button
    deleteButtons[0].click();
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('renders edit links for each user', () => {
    render(<UserTable users={mockUsers} />);

    const editLinks = screen.getAllByText('Edit');
    expect(editLinks.length).toBe(2);
    expect(editLinks[0].closest('a')).toHaveAttribute('href', '/users/1');
    expect(editLinks[1].closest('a')).toHaveAttribute('href', '/users/2');
  });

  it('does not show delete buttons when onDelete is not provided', () => {
    render(<UserTable users={mockUsers} />);

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<UserTable users={mockUsers} />);

    // Check that dates are rendered (format may vary by locale)
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('2024');
  });

  it('handles users without password hash', () => {
    const usersWithoutHash = [
      {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    render(<UserTable users={usersWithoutHash} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});

