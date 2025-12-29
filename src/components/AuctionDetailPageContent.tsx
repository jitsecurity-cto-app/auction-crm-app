'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { Auction } from '../types';
import AuctionForm from './AuctionForm';

interface AuctionDetailPageContentProps {
  id: string;
}

export default function AuctionDetailPageContent({ id }: AuctionDetailPageContentProps) {
  const router = useRouter();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (id) {
      loadAuction();
    }
  }, [id, router]);

  const loadAuction = async () => {
    try {
      setLoading(true);
      // API returns object directly, not wrapped in { data: {...} }
      const response = await api.getAuctionById(id);
      setAuction(response || null);
    } catch (err) {
      console.error('Error loading auction:', err);
      alert('Failed to load auction');
      router.push('/auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: {
    title: string;
    description: string;
    starting_price: number;
    end_time: string;
  }) => {
    if (!id) return;
    await api.updateAuction(id, data);
    router.push('/auctions');
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading auction...</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Auction not found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <AuctionForm
        auction={auction}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/auctions')}
      />
    </div>
  );
}
