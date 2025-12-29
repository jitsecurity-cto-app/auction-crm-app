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
import { Button, Card } from '@design-system/components';
import styles from './page.module.css';

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
      <div className={styles.loading}>
        <p>Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Auction Management</h1>
        <Link href="/auctions/new">
          <Button variant="primary" size="lg">+ Create New Auction</Button>
        </Link>
      </div>

      {error && (
        <Card variant="outlined" padding="md" className={styles.errorCard}>
          <p className={styles.errorText}>{error}</p>
        </Card>
      )}

      <AdvancedSearch onSearch={handleSearch} onClear={handleClear} />

      <Card variant="outlined" padding="md" style={{ marginBottom: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <WorkflowStateFilter
            value={searchFilters.workflow_state || ''}
            onChange={(value) => {
              const newFilters = { ...searchFilters, workflow_state: value || undefined };
              setSearchFilters(newFilters);
              loadAuctions(newFilters);
            }}
          />
        </div>
      </Card>

      <AuctionTable auctions={auctions} onDelete={handleDelete} />
    </div>
  );
}

