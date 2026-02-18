'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { Dispute } from '../types';
import { formatDateTime } from '@design-system/utils';
import { useResolvedParam } from '../hooks/useResolvedParam';

interface DisputeDetailPageContentProps {
  id: string;
}

export default function DisputeDetailPageContent({ id: rawId }: DisputeDetailPageContentProps) {
  const id = useResolvedParam(rawId);
  const router = useRouter();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (id) {
      fetchDispute();
    }
  }, [id, router]);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDisputeById(id);
      const disputeData = response.data || response;
      setDispute(disputeData);
      setStatus(disputeData.status || 'open');
      setResolution(disputeData.resolution || '');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dispute';
      setError(errorMessage);
      console.error('Failed to fetch dispute:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!dispute) return;

    try {
      setUpdating(true);
      await api.updateDispute(id, { status });
      await fetchDispute();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update dispute';
      setError(errorMessage);
      console.error('Failed to update dispute:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!dispute || !resolution.trim()) {
      alert('Please provide a resolution before resolving the dispute.');
      return;
    }

    try {
      setUpdating(true);
      await api.resolveDispute(id, resolution);
      await fetchDispute();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve dispute';
      setError(errorMessage);
      console.error('Failed to resolve dispute:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusClasses = (s: string): string => {
    switch (s) {
      case 'resolved':
      case 'closed':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'open':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'in_review':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading dispute...</p>
        </div>
      </div>
    );
  }

  if (error && !dispute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600">Error: {error}</p>
        <button onClick={fetchDispute} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500">Dispute not found.</p>
        <Link href="/disputes">
          <button className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            Back to Disputes
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/disputes" className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Dispute #{String(dispute.id).slice(0, 8)}</h1>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(dispute.status)}`}>
              {dispute.status}
            </span>
          </div>
          <Link href="/disputes">
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Back to Disputes
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="p-8 space-y-6">
        {/* Auction Details */}
        {dispute.auction && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Auction Details</h3>
            <Link href={`/auctions/${dispute.auction.id}`} className="text-lg font-medium text-primary-600 hover:text-primary-700 transition-colors">
              {dispute.auction.title}
            </Link>
            <p className="text-sm text-slate-500 mt-2">{dispute.auction.description}</p>
          </div>
        )}

        {/* Dispute Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Dispute Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-slate-500">Filed By</span>
              <p className="text-sm text-slate-900 mt-1">
                {dispute.filer ? (
                  <Link href={`/users/${dispute.filed_by}`} className="text-primary-600 hover:text-primary-700 transition-colors">
                    {dispute.filer.name || dispute.filer.email}
                  </Link>
                ) : (
                  `User ${String(dispute.filed_by).slice(0, 8)}`
                )}
              </p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Role</span>
              <p className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  dispute.filed_by_role === 'seller' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-slate-50 text-slate-700 ring-slate-600/20'
                }`}>
                  {dispute.filed_by_role}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Status</span>
              <p className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(dispute.status)}`}>
                  {dispute.status}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Created</span>
              <p className="text-sm text-slate-900 mt-1">{formatDateTime(dispute.created_at)}</p>
            </div>
            {dispute.updated_at && (
              <div>
                <span className="text-sm text-slate-500">Last Updated</span>
                <p className="text-sm text-slate-900 mt-1">{formatDateTime(dispute.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reason */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Reason</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{dispute.reason}</p>
        </div>

        {/* Resolution */}
        {dispute.resolution && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Resolution</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{dispute.resolution}</p>
          </div>
        )}

        {/* Admin Actions */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Admin Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="status-select" className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
              >
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={updating || status === dispute.status}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>

            <div className="border-t border-slate-200 pt-4">
              <label htmlFor="resolution" className="block text-sm font-medium text-slate-700 mb-1.5">
                Resolution Notes
              </label>
              <textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={6}
                placeholder="Enter resolution details..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-vertical"
              />
            </div>

            <button
              onClick={handleResolve}
              disabled={updating || !resolution.trim()}
              className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Resolving...' : 'Resolve Dispute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
