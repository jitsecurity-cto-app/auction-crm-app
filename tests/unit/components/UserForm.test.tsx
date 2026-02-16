import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserForm from '../../../src/components/UserForm';

describe('UserForm', () => {
  const mockUser = {
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'user' as const,
    password: 'hashed_password_12345678901234567890',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders edit form with user data', () => {
    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Edit User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
    // Check role select has correct value
    const roleSelect = screen.getByLabelText(/role/i) as HTMLSelectElement;
    expect(roleSelect.value).toBe('user');
  });

  it('displays password hash (intentional vulnerability)', () => {
    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

    expect(
      screen.getByText(/password hash.*intentionally exposed/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/hashed_password_12345678901234567890/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form data on submit', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const roleSelect = screen.getByLabelText(/role/i);
    const submitButton = screen.getByRole('button', { name: /update user/i });

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin',
      });
    });
  });

  it('displays error message on submit failure', async () => {
    const errorMessage = 'Failed to save user';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));

    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const roleSelect = screen.getByLabelText(/role/i);
    const submitButton = screen.getByRole('button', { name: /update user/i });

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const roleSelect = screen.getByLabelText(/role/i);
    const submitButton = screen.getByRole('button', { name: /update user/i });

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('displays user information section', () => {
    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

    expect(screen.getByText(/user information/i)).toBeInTheDocument();
    expect(screen.getByText(/ID: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/created:/i)).toBeInTheDocument();
  });

  it('displays security vulnerability warning', () => {
    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

    expect(
      screen.getByText(/role changes are client-side only/i)
    ).toBeInTheDocument();
  });

  it('handles users without password hash', () => {
    const userWithoutHash = {
      ...mockUser,
      password: undefined,
    };

    render(<UserForm user={userWithoutHash} onSubmit={mockOnSubmit} />);

    expect(
      screen.queryByText(/password hash.*intentionally exposed/i)
    ).not.toBeInTheDocument();
  });
});

