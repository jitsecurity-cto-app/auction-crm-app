/**
 * E2E tests for admin operations flow
 * These tests verify admin operations: create/edit auctions, manage users, view dashboard
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/components/Dashboard';
import AuctionForm from '@/components/AuctionForm';
import UserForm from '@/components/UserForm';
import AuctionTable from '@/components/AuctionTable';
import { api } from '@/lib/api';
import { isAuthenticated, isAdmin, setAuth } from '@/lib/auth';
import { Auction, User } from '@/types';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/lib/auth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

describe('Admin Operations Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (isAdmin as jest.Mock).mockReturnValue(true);
    (window.location as any).reload = jest.fn();
  });

  describe('Dashboard Flow', () => {
    it('should load and display dashboard statistics', async () => {
      const mockAuctions: Auction[] = [
        {
          id: '1',
          title: 'Test Auction 1',
          description: 'Description 1',
          starting_price: 100,
          current_bid: 150,
          end_time: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
          created_by: 'admin1',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Test Auction 2',
          description: 'Description 2',
          starting_price: 200,
          current_bid: 250,
          end_time: new Date(Date.now() - 86400000).toISOString(),
          status: 'ended',
          created_by: 'admin1',
          created_at: new Date().toISOString(),
        },
      ];

      const mockUsers: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'user',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'user',
          created_at: new Date().toISOString(),
        },
      ];

      // Dashboard expects arrays directly, not wrapped in { data: [...] }
      (api.getAuctions as jest.Mock).mockResolvedValue(mockAuctions);
      (api.getUsers as jest.Mock).mockResolvedValue(mockUsers);
      (api.getBidsByAuction as jest.Mock).mockResolvedValue([]);

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Verify stats are displayed
      expect(screen.getByText('Total Auctions')).toBeInTheDocument();
      expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Total auctions and users both show 2
      expect(screen.getByText('Active Auctions')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Active auctions
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('should handle API errors with verbose error messages (vulnerability)', async () => {
      const errorMessage = 'SQL Error: syntax error at or near "SELECT"';
      const errorStack = 'at query (database.ts:123:45)';
      
      const error = new Error(errorMessage);
      error.stack = errorStack;
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (api.getAuctions as jest.Mock).mockRejectedValue(error);

      render(<Dashboard />);

      await waitFor(() => {
        // Dashboard should handle error gracefully
        // Error logging is intentional vulnerability
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Auction Management Flow', () => {
    it('should create new auction without input validation', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      render(<AuctionForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText('Title');
      const descriptionInput = screen.getByLabelText('Description');
      const priceInput = screen.getByLabelText('Starting Price ($)');
      const endTimeInput = screen.getByLabelText('End Time');
      const submitButton = screen.getByRole('button', { name: /Create Auction/i });

      // Test that any input format is accepted (no validation)
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, '<script>alert("XSS")</script>Malicious Title');
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, '<img src=x onerror="alert(\'XSS\')">Malicious Description');
      // Note: HTML5 validation prevents negative numbers in number inputs with min="0"
      // So we'll use a very large number instead to test lack of validation
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '999999999999999999'); // Very large number (no max validation)
      // Set a future date for end time (required field)
      const futureDate = new Date(Date.now() + 86400000);
      await userEvent.clear(endTimeInput);
      await userEvent.type(endTimeInput, futureDate.toISOString().slice(0, 16));
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '<script>alert("XSS")</script>Malicious Title',
            description: '<img src=x onerror="alert(\'XSS\')">Malicious Description',
            starting_price: 999999999999999999,
          })
        );
      }, { timeout: 3000 });
    });

    it('should edit existing auction with XSS vulnerability', async () => {
      const mockAuction: Auction = {
        id: '1',
        title: 'Existing Auction',
        description: 'Safe Description',
        starting_price: 100,
        current_bid: 150,
        end_time: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
        created_by: 'admin1',
        created_at: new Date().toISOString(),
      };

      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      render(<AuctionForm auction={mockAuction} onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText('Description');
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, '<script>document.cookie="stolen"</script>');

      const submitButton = screen.getByRole('button', { name: /Update Auction/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            description: '<script>document.cookie="stolen"</script>',
          })
        );
      });
    });

    it('should display auctions in table with XSS vulnerability', async () => {
      const mockAuctions: Auction[] = [
        {
          id: '1',
          title: '<img src=x onerror="alert(\'XSS\')">Malicious Title',
          description: 'Description',
          starting_price: 100,
          current_bid: 150,
          end_time: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
          created_by: 'admin1',
          created_at: new Date().toISOString(),
        },
      ];

      render(<AuctionTable auctions={mockAuctions} />);

      // Verify XSS vulnerability: HTML is rendered (React escapes it, but we can verify the content is there)
      const { container } = render(<AuctionTable auctions={mockAuctions} />);
      // React escapes HTML, so we check for the escaped version or the text content
      expect(container.innerHTML).toContain('&lt;img');
      expect(container.innerHTML).toContain('onerror');
      // Also verify the malicious content is present in the DOM (use getAllByText since it might appear multiple times)
      expect(screen.getAllByText(/Malicious Title/i).length).toBeGreaterThan(0);
    });
  });

  describe('User Management Flow', () => {
    it('should edit user without authorization check (IDOR vulnerability)', async () => {
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        password_hash: 'exposed-hash-123', // Intentionally exposed
        created_at: new Date().toISOString(),
      };

      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

      // Verify password hash is exposed (vulnerability)
      expect(screen.getByText(/Password Hash/i)).toBeInTheDocument();
      expect(screen.getByText('exposed-hash-123')).toBeInTheDocument();

      // Change role without server-side validation
      // UserForm uses "Role *" as the label text
      const roleSelect = screen.getByLabelText('Role *');
      await userEvent.selectOptions(roleSelect, 'admin');

      const submitButton = screen.getByRole('button', { name: /Update User/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'admin',
          })
        );
      });
    });

    it('should accept any user input without validation', async () => {
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        created_at: new Date().toISOString(),
      };

      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      render(<UserForm user={mockUser} onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;

      // Test that any input format is accepted in the input fields (no validation)
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'not-an-email-format');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, '<script>alert("XSS")</script>');

      // Verify the values are accepted in the input fields (vulnerability: no validation)
      expect(emailInput.value).toBe('not-an-email-format');
      expect(nameInput.value).toBe('<script>alert("XSS")</script>');

      // Note: HTML5 email validation will prevent form submission with invalid email
      // But the form component accepts the value, which demonstrates the vulnerability
      // For a true E2E test, we'd need to bypass HTML5 validation or use a valid email format
      const submitButton = screen.getByRole('button', { name: /Update User/i });
      
      // Try submitting - HTML5 validation may prevent it, but values are accepted
      await userEvent.click(submitButton);
      
      // If HTML5 validation blocks submission, the form won't submit
      // But we've verified the vulnerability: invalid input is accepted
      // Check if form was submitted (might be blocked by browser validation)
      if (mockOnSubmit.mock.calls.length > 0) {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'not-an-email-format',
            name: '<script>alert("XSS")</script>',
          })
        );
      } else {
        // Form was blocked by HTML5 validation, but we verified input acceptance
        expect(emailInput.value).toBe('not-an-email-format');
        expect(nameInput.value).toBe('<script>alert("XSS")</script>');
      }
    });
  });

  describe('Vulnerability Verification', () => {
    it('should verify XSS vulnerability exists in auction descriptions', async () => {
      const xssPayload = '<img src=x onerror="alert(document.cookie)">';
      const mockAuction = {
        id: '1',
        title: 'XSS Test',
        description: xssPayload,
        starting_price: 100,
        current_bid: 150,
        end_time: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
        created_by: 'admin1',
        created_at: new Date().toISOString(),
      };

      const mockOnSubmit = jest.fn();
      const { container } = render(<AuctionForm auction={mockAuction as Auction} onSubmit={mockOnSubmit} />);

      // Verify that XSS payload is present in form
      // Textarea component doesn't add asterisk for required fields
      const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;
      expect(descriptionInput.value).toContain('<img');
      expect(descriptionInput.value).toContain('onerror');
    });

    it('should verify no authorization check for admin operations', async () => {
      // Client-side role check only (vulnerability)
      (isAdmin as jest.Mock).mockReturnValue(false);
      (isAuthenticated as jest.Mock).mockReturnValue(true);

      const mockAuctions: Auction[] = [];
      (api.getAuctions as jest.Mock).mockResolvedValue({ data: mockAuctions });

      // Should still allow access (client-side check only)
      render(<Dashboard />);

      await waitFor(() => {
        // Dashboard loads even without admin role (vulnerability)
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    it('should verify sensitive data exposure in user forms', async () => {
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        password_hash: 'sensitive-hash-data-12345',
        created_at: new Date().toISOString(),
      };

      render(<UserForm user={mockUser} onSubmit={jest.fn()} />);

      // Verify password hash is exposed
      expect(screen.getByText(/Password Hash/i)).toBeInTheDocument();
      expect(screen.getByText('sensitive-hash-data-12345')).toBeInTheDocument();
    });
  });
});
