'use client';

import { useEffect, useState } from 'react';
import { getAuthUser, isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button, Card, Badge } from '@design-system/components';
import styles from './page.module.css';

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
      <div className={styles.container}>
        <h1 className={styles.title}>My Auctions</h1>
        <p className={styles.message}>You must be logged in to view your auctions.</p>
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
        <h1 className={styles.title}>My Auctions</h1>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Auctions</h1>
      <div className={styles.actions}>
        <Link href="/auctions/new">
          <Button variant="primary">Create New Auction</Button>
        </Link>
      </div>
      {auctions.length === 0 ? (
        <Card variant="outlined" padding="md">
          <p>You haven't created any auctions yet.</p>
          <Link href="/auctions/new">
            <Button variant="primary">Create Your First Auction</Button>
          </Link>
        </Card>
      ) : (
        <div className={styles.auctionsList}>
          {auctions.map((auction) => (
            <Card key={auction.id} variant="outlined" padding="md" className={styles.auctionCard}>
              <div className={styles.auctionHeader}>
                <h3>
                  <Link href={`/auctions/${auction.id}`}>
                    {auction.title}
                  </Link>
                </h3>
                <Badge 
                  variant={auction.status === 'active' ? 'success' : auction.status === 'completed' ? 'info' : 'default'} 
                  size="sm"
                >
                  {auction.status}
                </Badge>
              </div>
              <p className={styles.auctionDescription}>
                {auction.description || 'No description'}
              </p>
              <div className={styles.auctionMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Starting Price:</span>
                  <span className={styles.metaValue}>${parseFloat(auction.starting_price).toFixed(2)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Current Bid:</span>
                  <span className={styles.metaValue}>
                    ${auction.highest_bid ? parseFloat(auction.highest_bid).toFixed(2) : parseFloat(auction.starting_price).toFixed(2)}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Bids:</span>
                  <span className={styles.metaValue}>{auction.bid_count || 0}</span>
                </div>
              </div>
              <div className={styles.auctionFooter}>
                <span className={styles.endTime}>
                  Ends: {new Date(auction.end_time).toLocaleString()}
                </span>
                <Link href={`/auctions/${auction.id}`}>
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
