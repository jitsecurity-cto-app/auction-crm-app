'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Auction, User, Bid } from '../types';
import StatsCard from './StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@design-system/components';
import { formatDateTime } from '@design-system/utils';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalUsers: 0,
    totalBids: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: string;
    description: string;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [auctionsRes, usersRes] = await Promise.all([
        api.getAuctions(),
        api.getUsers(),
      ]);

      // API returns arrays directly, not wrapped in { data: [...] }
      const auctions: Auction[] = Array.isArray(auctionsRes) ? auctionsRes : [];
      const users: User[] = Array.isArray(usersRes) ? usersRes : [];
      
      // Calculate stats
      const totalAuctions = auctions.length;
      const activeAuctions = auctions.filter(a => a.status === 'active').length;
      const totalUsers = users.length;
      
      // For bids, we'd need to fetch from each auction or have a separate endpoint
      // For now, let's try to get bids from a few auctions
      let totalBids = 0;
      try {
        const bidsPromises = auctions.slice(0, 10).map(auction => 
          api.getBidsByAuction(auction.id).catch(() => [])
        );
        const bidsResults = await Promise.all(bidsPromises);
        // API returns arrays directly
        totalBids = bidsResults.reduce((sum, res) => sum + (Array.isArray(res) ? res.length : 0), 0);
      } catch {
        // If we can't get bids, just show 0
        totalBids = 0;
      }

      setStats({
        totalAuctions,
        activeAuctions,
        totalUsers,
        totalBids,
      });

      // Create recent activity from auctions and users
      const activity: Array<{ type: string; description: string; timestamp: string }> = [];
      
      // Add recent auctions
      auctions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .forEach(auction => {
          activity.push({
            type: 'auction',
            description: `Auction "${auction.title}" created`,
            timestamp: auction.created_at,
          });
        });

      // Add recent users
      users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .forEach(user => {
          activity.push({
            type: 'user',
            description: `User "${user.email}" registered`,
            timestamp: user.created_at,
          });
        });

      // Sort by timestamp and take most recent
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 10));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Intentionally verbose error logging (security vulnerability)
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      
      <div className={styles.statsGrid}>
        <StatsCard
          title="Total Auctions"
          value={stats.totalAuctions}
          icon="📦"
        />
        <StatsCard
          title="Active Auctions"
          value={stats.activeAuctions}
          subtitle={`${stats.totalAuctions - stats.activeAuctions} ended`}
          icon="🔥"
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
        />
        <StatsCard
          title="Total Bids"
          value={stats.totalBids}
          icon="💰"
        />
      </div>

      <div className={styles.activitySection}>
        <Card variant="elevated" padding="md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className={styles.emptyState}>No recent activity</p>
            ) : (
              <div className={styles.activityList}>
                {recentActivity.map((activity, index) => (
                  <div key={index} className={styles.activityItem}>
                    <span className={styles.activityDescription}>{activity.description}</span>
                    <span className={styles.activityTime}>
                      {formatDateTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

