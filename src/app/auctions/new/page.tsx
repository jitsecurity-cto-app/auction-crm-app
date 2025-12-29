'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../lib/auth';
import { api } from '../../../lib/api';
import AuctionForm from '../../../components/AuctionForm';

export default function NewAuctionPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    starting_price: number;
    end_time: string;
  }) => {
    await api.createAuction(data);
    router.push('/auctions');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <AuctionForm onSubmit={handleSubmit} onCancel={() => router.push('/auctions')} />
    </div>
  );
}

