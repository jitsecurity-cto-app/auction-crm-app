'use client';

import { useEffect, useState } from 'react';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function MyAuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getAuthUser();

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      setLoading(false);
      return;
    }

    // IDOR vulnerability: No authorization check - can access any user's auctions
    const fetchAuctions = async () => {
      try {
        const data = await api.getMyAuctions(user.id);
        setAuctions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load auctions');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [user]);

  if (!isAuthenticated() || !user) {
    return (
      <div>
        <div className="border-b border-slate-200 bg-white px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">My Auctions</h1>
        </div>
        <div className="p-8">
          <p className="text-slate-500 mb-4">You must be logged in to view your auctions.</p>
          <Link href="/login">
            <button className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="border-b border-slate-200 bg-white px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">My Auctions</h1>
        </div>
        <div className="p-8">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">My Auctions</h1>
          <Link href="/auctions/new">
            <button className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
              Create New Auction
            </button>
          </Link>
        </div>
      </div>

      <div className="p-8">
        {auctions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 mb-4">You haven&apos;t created any auctions yet.</p>
            <Link href="/auctions/new">
              <button className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                Create Your First Auction
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {auctions.map((auction) => (
              <div key={auction.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/auctions/${auction.id}`} className="text-base font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                    {auction.title}
                  </Link>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    auction.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                      : auction.status === 'completed'
                      ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                      : 'bg-slate-50 text-slate-700 ring-slate-600/20'
                  }`}>
                    {auction.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{auction.description || 'No description'}</p>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-slate-500">Starting Price</span>
                    <p className="font-medium text-slate-900">${parseFloat(auction.starting_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Current Bid</span>
                    <p className="font-medium text-slate-900">
                      ${auction.highest_bid ? parseFloat(auction.highest_bid).toFixed(2) : parseFloat(auction.starting_price).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Bids</span>
                    <p className="font-medium text-slate-900">{auction.bid_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Ends: {new Date(auction.end_time).toLocaleString()}</span>
                  <Link href={`/auctions/${auction.id}`}>
                    <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
