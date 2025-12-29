'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../lib/auth';
import { api } from '../../lib/api';
import { Dispute } from '../../types';
import DisputeList from '../../components/DisputeList';
import { Button, Card, Input } from '@design-system/components';
import styles from './page.module.css';

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<{
    status?: string;
    auction_id?: string;
    search?: string;
  }>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadDisputes();
  }, [router]);

  const loadDisputes = async (filterParams?: typeof filters) => {
    try {
      setLoading(true);
      const activeFilters = filterParams || filters;
      const response = await api.getDisputes(activeFilters);
      setDisputes(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
      console.error('Error loading disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    loadDisputes(newFilters);
  };

  const handleSearch = (query: string) => {
    const newFilters = { ...filters, search: query.trim() || undefined };
    setFilters(newFilters);
    loadDisputes(newFilters);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dispute Management</h1>
      </div>

      {error && (
        <Card variant="outlined" padding="md" className={styles.errorCard}>
          <p>{error}</p>
        </Card>
      )}

      <Card variant="outlined" padding="md" className={styles.filtersCard}>
        <div className={styles.filters}>
          <div className={styles.searchGroup}>
            <Input
              id="dispute-search"
              label="Search Disputes"
              type="text"
              placeholder="Search by dispute ID, auction title, or user..."
              onChange={(e) => handleSearch(e.target.value)}
              fullWidth
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="status-filter" className={styles.filterLabel}>Status:</label>
            <select
              id="status-filter"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      <DisputeList disputes={disputes} />
    </div>
  );
}
