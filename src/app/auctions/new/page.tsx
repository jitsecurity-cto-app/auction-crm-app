'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../lib/auth';
import { api } from '../../../lib/api';
import AuctionForm from '../../../components/AuctionForm';
import Link from 'next/link';

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
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/auctions" className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Create New Auction</h1>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-2xl">
        <AuctionForm onSubmit={handleSubmit} onCancel={() => router.push('/auctions')} />
      </div>
    </div>
  );
}
