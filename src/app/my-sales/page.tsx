'use client';

import { useEffect, useState } from 'react';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function MySalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getAuthUser();

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      setLoading(false);
      return;
    }

    // IDOR vulnerability: No authorization check - can access any user's sales
    const fetchSales = async () => {
      try {
        const data = await api.getMySales(user.id);
        setSales(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sales');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [user]);

  if (!isAuthenticated() || !user) {
    return (
      <div>
        <div className="border-b border-slate-200 bg-white px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">My Sales</h1>
        </div>
        <div className="p-8">
          <p className="text-slate-500 mb-4">You must be logged in to view your sales.</p>
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
          <h1 className="text-2xl font-bold text-slate-900">My Sales</h1>
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
        <h1 className="text-2xl font-bold text-slate-900">My Sales</h1>
      </div>

      <div className="p-8">
        {sales.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 mb-4">You haven&apos;t completed any sales yet.</p>
            <Link href="/auctions/new">
              <button className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                Create New Auction
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/auctions/${sale.id}`} className="text-base font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                    {sale.title}
                  </Link>
                  <span className="text-lg font-bold text-slate-900">
                    ${sale.final_price ? parseFloat(sale.final_price).toFixed(2) : '0.00'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{sale.description || 'No description'}</p>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-slate-500">Total Bids</span>
                    <p className="font-medium text-slate-900">{sale.bid_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Winner ID</span>
                    <p className="font-medium text-slate-900">{sale.winner_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment Status</span>
                    <p className="mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        sale.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                          : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                      }`}>
                        {sale.payment_status || 'pending'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Completed: {new Date(sale.end_time).toLocaleDateString()}</span>
                  <Link href={`/auctions/${sale.id}`}>
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
