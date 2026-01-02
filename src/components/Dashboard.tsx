'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Auction, User, Bid, Dispute } from '../types';
import StatsCard from './StatsCard';
import WorkflowStateBadge from './WorkflowStateBadge';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@design-system/components';
import { formatDateTime } from '@design-system/utils';
import Link from 'next/link';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalUsers: 0,
    totalBids: 0,
  });
  const [workflowStats, setWorkflowStats] = useState({
    active: 0,
    pending_sale: 0,
    shipping: 0,
    complete: 0,
  });
  const [disputeStats, setDisputeStats] = useState({
    open: 0,
    in_review: 0,
    resolved: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: string;
    description: string;
    timestamp: string;
  }>>([]);
  const [recentDisputes, setRecentDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [auctionsRes, usersRes, disputesRes] = await Promise.all([
        api.getAuctions(),
        api.getUsers(),
        api.getDisputes({ limit: 5 }).catch(() => []),
      ]);

      // API returns arrays directly, not wrapped in { data: [...] }
      const auctions: Auction[] = Array.isArray(auctionsRes) ? auctionsRes : [];
      const users: User[] = Array.isArray(usersRes) ? usersRes : [];
      
      // Calculate stats
      const totalAuctions = auctions.length;
      const activeAuctions = auctions.filter(a => a.status === 'active').length;
      const totalUsers = users.length;

      // Calculate workflow state distribution
      const workflowDistribution = {
        active: auctions.filter(a => a.workflow_state === 'active').length,
        pending_sale: auctions.filter(a => a.workflow_state === 'pending_sale').length,
        shipping: auctions.filter(a => a.workflow_state === 'shipping').length,
        complete: auctions.filter(a => a.workflow_state === 'complete').length,
      };
      setWorkflowStats(workflowDistribution);

      // Calculate dispute stats
      const disputes: Dispute[] = Array.isArray(disputesRes) ? disputesRes : [];
      const disputeDistribution = {
        open: disputes.filter(d => d.status === 'open').length,
        in_review: disputes.filter(d => d.status === 'in_review').length,
        resolved: disputes.filter(d => d.status === 'resolved' || d.status === 'closed').length,
        total: disputes.length,
      };
      setDisputeStats(disputeDistribution);
      setRecentDisputes(disputes.slice(0, 5));
      
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

      <div className={styles.widgetsGrid}>
        <Card variant="elevated" padding="md">
          <CardHeader>
            <CardTitle>Workflow State Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.workflowStats}>
              <div className={styles.workflowStatItem}>
                <WorkflowStateBadge state="active" size="sm" />
                <span className={styles.workflowCount}>{workflowStats.active}</span>
              </div>
              <div className={styles.workflowStatItem}>
                <WorkflowStateBadge state="pending_sale" size="sm" />
                <span className={styles.workflowCount}>{workflowStats.pending_sale}</span>
              </div>
              <div className={styles.workflowStatItem}>
                <WorkflowStateBadge state="shipping" size="sm" />
                <span className={styles.workflowCount}>{workflowStats.shipping}</span>
              </div>
              <div className={styles.workflowStatItem}>
                <WorkflowStateBadge state="complete" size="sm" />
                <span className={styles.workflowCount}>{workflowStats.complete}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" padding="md">
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>Disputes Overview</CardTitle>
              <Link href="/disputes">
                <Button variant="secondary" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.disputeStats}>
              <div className={styles.disputeStatItem}>
                <span className={styles.disputeLabel}>Open:</span>
                <Badge variant="error" size="sm">{disputeStats.open}</Badge>
              </div>
              <div className={styles.disputeStatItem}>
                <span className={styles.disputeLabel}>In Review:</span>
                <Badge variant="warning" size="sm">{disputeStats.in_review}</Badge>
              </div>
              <div className={styles.disputeStatItem}>
                <span className={styles.disputeLabel}>Resolved:</span>
                <Badge variant="success" size="sm">{disputeStats.resolved}</Badge>
              </div>
              <div className={styles.disputeStatItem}>
                <span className={styles.disputeLabel}>Total:</span>
                <span className={styles.disputeTotal}>{disputeStats.total}</span>
              </div>
            </div>
            {recentDisputes.length > 0 && (
              <div className={styles.recentDisputes}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-2)' }}>
                  Recent Disputes
                </h4>
                {recentDisputes.map((dispute) => (
                  <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
                    <div className={styles.disputeItem}>
                      <span className={styles.disputeId}>#{String(dispute.id).slice(0, 8)}</span>
                      <Badge variant={dispute.status === 'open' ? 'error' : dispute.status === 'in_review' ? 'warning' : 'success'} size="sm">
                        {dispute.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

