'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../../lib/auth';
import { api } from '../../lib/api';
import { Auction } from '../../types';
import AuctionTable from '../../components/AuctionTable';
import AdvancedSearch from '../../components/AdvancedSearch';
import WorkflowStateFilter from '../../components/WorkflowStateFilter';

export default function AuctionsPage() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState<{
    search?: string;
    status?: string;
    workflow_state?: string;
    minPrice?: number;
    maxPrice?: number;
  }>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadAuctions();
  }, [router]);

  const loadAuctions = async (filters?: typeof searchFilters) => {
    try {
      setLoading(true);
      const activeFilters = filters || searchFilters;

      // If workflow_state filter is set, use the workflow endpoint
      if (activeFilters.workflow_state) {
        const response = await api.getAuctionsByWorkflow({
          workflow_state: activeFilters.workflow_state,
        });
        setAuctions(Array.isArray(response) ? response : []);
      } else {
        // Otherwise use the regular auctions endpoint
        const response = await api.getAuctions(activeFilters);
        setAuctions(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
      console.error('Error loading auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: typeof searchFilters) => {
    setSearchFilters(filters);
    loadAuctions(filters);
  };

  const handleClear = () => {
    setSearchFilters({});
    loadAuctions({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this auction?')) {
      return;
    }

    try {
      await api.deleteAuction(id);
      // Reload auctions after deletion
      await loadAuctions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete auction');
      console.error('Error deleting auction:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Auction Management</h1>
            <p className="text-slate-500 mt-1">Manage all auctions on the platform</p>
          </div>
          <Link href="/auctions/new">
            <button className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Auction
            </button>
          </Link>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        <AdvancedSearch onSearch={handleSearch} onClear={handleClear} />

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <WorkflowStateFilter
            value={searchFilters.workflow_state || ''}
            onChange={(value) => {
              const newFilters = { ...searchFilters, workflow_state: value || undefined };
              setSearchFilters(newFilters);
              loadAuctions(newFilters);
            }}
          />
        </div>

        <AuctionTable auctions={auctions} onDelete={handleDelete} />
      </div>
    </div>
  );
}
