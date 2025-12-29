import React from 'react';
import { render, screen } from '@testing-library/react';
import StatsCard from '../../../src/components/StatsCard';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Auctions" value={10} />);

    expect(screen.getByText('Total Auctions')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders with subtitle', () => {
    render(<StatsCard title="Active Auctions" value={5} subtitle="5 ended" />);

    expect(screen.getByText('Active Auctions')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('5 ended')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<StatsCard title="Total Users" value={20} icon="👥" />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();
  });

  it('renders string values', () => {
    render(<StatsCard title="Status" value="Active" />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with all props', () => {
    render(
      <StatsCard
        title="Total Bids"
        value={100}
        subtitle="Last 24 hours"
        icon="💰"
      />
    );

    expect(screen.getByText('Total Bids')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
  });
});

