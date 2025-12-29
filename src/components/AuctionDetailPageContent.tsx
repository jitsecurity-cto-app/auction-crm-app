'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { Auction } from '../types';
import AuctionForm from './AuctionForm';
import WorkflowVisualization from './WorkflowVisualization';
import WorkflowStateBadge from './WorkflowStateBadge';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@design-system/components';
import { formatCurrency, formatDateTime } from '@design-system/utils';

interface AuctionDetailPageContentProps {
  id: string;
}

export default function AuctionDetailPageContent({ id }: AuctionDetailPageContentProps) {
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

  const workflowStates: Array<{ value: string; label: string }> = [
    { value: 'active', label: 'Active Bidding' },
    { value: 'pending_sale', label: 'Pending Sale' },
    { value: 'shipping', label: 'Shipped' },
    { value: 'complete', label: 'Complete' },
  ];

  return (
    <div style={{ padding: 'var(--spacing-8)' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
            Auction Details
          </h1>
          <Button variant="secondary" size="sm" onClick={() => router.push('/auctions')}>
            ← Back to Auctions
          </Button>
        </div>

        {auction && (
          <Card variant="outlined" padding="md" style={{ marginBottom: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)' }}>
                  {auction.title}
                </h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge variant={auction.status === 'active' ? 'success' : 'default'} size="sm">
                    {auction.status}
                  </Badge>
                  <WorkflowStateBadge state={auction.workflow_state} size="sm" />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatCurrency(auction.current_bid || auction.starting_price)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {auction?.workflow_state && (
          <Card variant="outlined" padding="md" style={{ marginBottom: 'var(--spacing-4)' }}>
            <CardHeader>
              <CardTitle>Workflow State</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <WorkflowVisualization currentState={auction.workflow_state as any} />
              </div>
              <div>
                <label htmlFor="workflow-state-select" style={{ 
                  display: 'block', 
                  marginBottom: 'var(--spacing-2)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  Admin Override - Change Workflow State:
                </label>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                  <select
                    id="workflow-state-select"
                    value={workflowState}
                    onChange={(e) => setWorkflowState(e.target.value)}
                    style={{
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-base)',
                      minWidth: '200px'
                    }}
                  >
                    {workflowStates.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleWorkflowStateChange(workflowState)}
                    disabled={updatingWorkflow || workflowState === auction.workflow_state}
                    isLoading={updatingWorkflow}
                  >
                    Update State
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AuctionForm
        auction={auction}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/auctions')}
      />
    </div>
  );
}
