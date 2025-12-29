'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../../lib/auth';
import { api } from '../../lib/api';
import { Auction } from '../../types';
import AuctionTable from '../../components/AuctionTable';
import AdvancedSearch from '../../components/AdvancedSearch';
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
      // API returns array directly, not wrapped in { data: [...] }
      const response = await api.getAuctions(filters || searchFilters);
      setAuctions(Array.isArray(response) ? response : []);
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

      <AuctionTable auctions={auctions} onDelete={handleDelete} />
    </div>
  );
}

