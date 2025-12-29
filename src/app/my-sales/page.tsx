'use client';

import { useEffect, useState } from 'react';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button, Card, Badge } from '@design-system/components';
import styles from './page.module.css';

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
      <div className={styles.container}>
        <h1 className={styles.title}>My Sales</h1>
        <p className={styles.message}>You must be logged in to view your sales.</p>
        <div className={styles.actions}>
          <Link href="/login">
            <Button variant="primary">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>My Sales</h1>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Sales</h1>
      {sales.length === 0 ? (
        <Card variant="outlined" padding="md">
          <p>You haven't completed any sales yet.</p>
          <Link href="/auctions/new">
            <Button variant="primary">Create New Auction</Button>
          </Link>
        </Card>
      ) : (
        <div className={styles.salesList}>
          {sales.map((sale) => (
            <Card key={sale.id} variant="outlined" padding="md" className={styles.saleCard}>
              <div className={styles.saleHeader}>
                <h3>
                  <Link href={`/auctions/${sale.id}`}>
                    {sale.title}
                  </Link>
                </h3>
                <span className={styles.salePrice}>
                  ${sale.final_price ? parseFloat(sale.final_price).toFixed(2) : '0.00'}
                </span>
              </div>
              <p className={styles.saleDescription}>
                {sale.description || 'No description'}
              </p>
              <div className={styles.saleMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Total Bids:</span>
                  <span className={styles.metaValue}>{sale.bid_count || 0}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Winner ID:</span>
                  <span className={styles.metaValue}>{sale.winner_id || 'N/A'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Payment Status:</span>
                  <Badge 
                    variant={sale.payment_status === 'paid' ? 'success' : 'warning'} 
                    size="sm"
                    className={styles.paymentStatus}
                  >
                    {sale.payment_status || 'pending'}
                  </Badge>
                </div>
              </div>
              <div className={styles.saleFooter}>
                <span className={styles.completedDate}>
                  Completed: {new Date(sale.end_time).toLocaleDateString()}
                </span>
                <Link href={`/auctions/${sale.id}`}>
                  <Button variant="secondary" size="sm">View Details</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
