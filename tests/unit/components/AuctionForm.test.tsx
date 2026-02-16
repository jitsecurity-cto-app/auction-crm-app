import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuctionForm from '../../../src/components/AuctionForm';

describe('AuctionForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form when no auction provided', () => {
    render(<AuctionForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Create New Auction')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/starting price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
  });

  it('renders edit form when auction provided', () => {
    const mockAuction = {
      id: '1',
      title: 'Test Auction',
      description: 'Test Description',
      starting_price: 100,
      current_bid: 150,
      end_time: '2024-12-31T23:59:59Z',
      status: 'active',
      created_by: 'user1',
      created_at: '2024-01-01T00:00:00Z',
    };

    render(<AuctionForm auction={mockAuction} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Edit Auction')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Auction')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('calls onSubmit with form data on submit', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(<AuctionForm onSubmit={mockOnSubmit} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const priceInput = screen.getByLabelText(/starting price/i);
    const endTimeInput = screen.getByLabelText(/end time/i);
    const submitButton = screen.getByRole('button', { name: /create auction/i });

    fireEvent.change(titleInput, { target: { value: 'New Auction' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    fireEvent.change(priceInput, { target: { value: '200' } });
    fireEvent.change(endTimeInput, { target: { value: '2024-12-31T23:59' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Auction',
        description: 'New Description',
        starting_price: 200,
        end_time: expect.any(String),
      });
    });
  });

  it('displays error message on submit failure', async () => {
    const errorMessage = 'Failed to save auction';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));

    render(<AuctionForm onSubmit={mockOnSubmit} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const priceInput = screen.getByLabelText(/starting price/i);
    const endTimeInput = screen.getByLabelText(/end time/i);
    const submitButton = screen.getByRole('button', { name: /create auction/i });

    fireEvent.change(titleInput, { target: { value: 'New Auction' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    fireEvent.change(priceInput, { target: { value: '200' } });
    fireEvent.change(endTimeInput, { target: { value: '2024-12-31T23:59' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<AuctionForm onSubmit={mockOnSubmit} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const priceInput = screen.getByLabelText(/starting price/i);
    const endTimeInput = screen.getByLabelText(/end time/i);
    const submitButton = screen.getByRole('button', { name: /create auction/i });

    fireEvent.change(titleInput, { target: { value: 'New Auction' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    fireEvent.change(priceInput, { target: { value: '200' } });
    fireEvent.change(endTimeInput, { target: { value: '2024-12-31T23:59' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<AuctionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('does not show cancel button when onCancel is not provided', () => {
    render(<AuctionForm onSubmit={mockOnSubmit} />);

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('displays XSS vulnerability warning in description field', () => {
    render(<AuctionForm onSubmit={mockOnSubmit} />);

    // The Textarea component passes helperText as an attribute on the textarea element
    const descriptionTextarea = screen.getByLabelText(/description/i);
    expect(descriptionTextarea).toHaveAttribute(
      'helperText',
      expect.stringMatching(/description will be rendered without sanitization/i)
    );
  });
});

