'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Auction, User, Dispute } from '../types';
import StatsCard from './StatsCard';
import WorkflowStateBadge from './WorkflowStateBadge';
import { formatDateTime } from '@design-system/utils';
import Link from 'next/link';

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your auction platform</p>
      </div>

      <div className="p-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Auctions" value={stats.totalAuctions} icon="📦" />
          <StatsCard title="Active Auctions" value={stats.activeAuctions} subtitle={`${stats.totalAuctions - stats.activeAuctions} ended`} icon="🔥" />
          <StatsCard title="Total Users" value={stats.totalUsers} icon="👥" />
          <StatsCard title="Total Bids" value={stats.totalBids} icon="💰" />
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Workflow State Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Workflow State Distribution</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <WorkflowStateBadge state="active" size="sm" />
                <span className="text-lg font-bold text-slate-900">{workflowStats.active}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <WorkflowStateBadge state="pending_sale" size="sm" />
                <span className="text-lg font-bold text-slate-900">{workflowStats.pending_sale}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <WorkflowStateBadge state="shipping" size="sm" />
                <span className="text-lg font-bold text-slate-900">{workflowStats.shipping}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <WorkflowStateBadge state="complete" size="sm" />
                <span className="text-lg font-bold text-slate-900">{workflowStats.complete}</span>
              </div>
            </div>
          </div>

          {/* Disputes Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Disputes Overview</h3>
              <Link href="/disputes" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                <span className="text-sm font-medium text-red-700">Open</span>
                <span className="text-lg font-bold text-red-700">{disputeStats.open}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                <span className="text-sm font-medium text-amber-700">In Review</span>
                <span className="text-lg font-bold text-amber-700">{disputeStats.in_review}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                <span className="text-sm font-medium text-emerald-700">Resolved</span>
                <span className="text-lg font-bold text-emerald-700">{disputeStats.resolved}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-sm font-medium text-slate-700">Total</span>
                <span className="text-lg font-bold text-slate-900">{disputeStats.total}</span>
              </div>
            </div>
            {recentDisputes.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Disputes</h4>
                <div className="space-y-2">
                  {recentDisputes.map((dispute) => (
                    <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-medium text-slate-700">#{String(dispute.id).slice(0, 8)}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          dispute.status === 'open'
                            ? 'bg-red-50 text-red-700 ring-red-600/20'
                            : dispute.status === 'in_review'
                            ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        }`}>
                          {dispute.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No recent activity
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'auction' ? 'bg-primary-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-sm text-slate-700">{activity.description}</span>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                    {formatDateTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
