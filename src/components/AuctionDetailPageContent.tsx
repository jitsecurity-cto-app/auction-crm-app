'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { Auction } from '../types';
import AuctionForm from './AuctionForm';
import WorkflowVisualization from './WorkflowVisualization';
import WorkflowStateBadge from './WorkflowStateBadge';
import { formatCurrency } from '@design-system/utils';
import { useResolvedParam } from '../hooks/useResolvedParam';

interface AuctionDetailPageContentProps {
  id: string;
}

export default function AuctionDetailPageContent({ id: rawId }: AuctionDetailPageContentProps) {
  const id = useResolvedParam(rawId);
  const router = useRouter();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowState, setWorkflowState] = useState<string>('');
  const [updatingWorkflow, setUpdatingWorkflow] = useState(false);

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
      const auctionData = response || null;
      setAuction(auctionData);
      setWorkflowState(auctionData?.workflow_state || 'active');
    } catch (err) {
      console.error('Error loading auction:', err);
      alert('Failed to load auction');
      router.push('/auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowStateChange = async (newState: string) => {
    if (!id || !newState) return;

    try {
      setUpdatingWorkflow(true);
      await api.updateWorkflowState(id, newState);
      await loadAuction();
    } catch (err) {
      console.error('Error updating workflow state:', err);
      alert('Failed to update workflow state');
    } finally {
      setUpdatingWorkflow(false);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Auction not found</p>
      </div>
    );
  }

  const workflowStates: Array<{ value: string; label: string }> = [
    { value: 'active', label: 'Active Bidding' },
    { value: 'pending_sale', label: 'Pending Sale' },
    { value: 'shipping', label: 'Shipped' },
    { value: 'complete', label: 'Complete' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/auctions')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Auction Details</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                auction.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-700 ring-slate-600/20'
              }`}>
                {auction.status}
              </span>
              <WorkflowStateBadge state={auction.workflow_state} size="sm" />
              <span className="text-sm text-slate-500">{formatCurrency(auction.current_bid || auction.starting_price)}</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/auctions')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to Auctions
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Workflow State */}
        {auction?.workflow_state && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Workflow State</h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <WorkflowVisualization currentState={auction.workflow_state as any} />
              </div>
              <div className="border-t border-slate-200 pt-4">
                <label htmlFor="workflow-state-select" className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Override - Change Workflow State:
                </label>
                <div className="flex items-center gap-3">
                  <select
                    id="workflow-state-select"
                    value={workflowState}
                    onChange={(e) => setWorkflowState(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white min-w-[200px]"
                  >
                    {workflowStates.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleWorkflowStateChange(workflowState)}
                    disabled={updatingWorkflow || workflowState === auction.workflow_state}
                    className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingWorkflow ? 'Updating...' : 'Update State'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <AuctionForm
          auction={auction}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/auctions')}
        />
      </div>
    </div>
  );
}
