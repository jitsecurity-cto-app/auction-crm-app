import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AdminLoginForm from '../../../src/components/AdminLoginForm';
import * as authLib from '../../../src/lib/auth';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth library
jest.mock('../../../src/lib/auth');

describe('AdminLoginForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders login form with email and password fields', () => {
    render(<AdminLoginForm />);

    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('calls login function with form data on submit', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      token: 'test-token',
      user: { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
    });
    (authLib.login as jest.Mock) = mockLogin;

    render(<AdminLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to dashboard after successful login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      token: 'test-token',
      user: { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
    });
    (authLib.login as jest.Mock) = mockLogin;

    render(<AdminLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on login failure', async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    (authLib.login as jest.Mock) = mockLogin;

    render(<AdminLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    const mockLogin = jest.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              token: 'test-token',
              user: { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
            });
          }, 100);
        })
    );
    (authLib.login as jest.Mock) = mockLogin;

    render(<AdminLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/logging in/i)).not.toBeInTheDocument();
    });
  });

  it('does not validate input format (intentional vulnerability)', () => {
    render(<AdminLoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // HTML5 validation will still catch invalid email format, but we're testing
    // that our code doesn't do additional validation
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('not-an-email');
  });
});

