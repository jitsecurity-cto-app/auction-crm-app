'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface RevenueData {
  date: string;
  revenue: number;
  order_count: number;
}

interface BidData {
  date: string;
  bid_count: number;
  total_volume: number;
  avg_bid: number;
}

interface TopAuction {
  id: string;
  title: string;
  final_price: number;
  status: string;
  total_bids: string;
  highest_bid: number;
}

interface DashboardStats {
  total_auctions: number;
  active_auctions: number;
  total_users: number;
  total_bids: number;
  total_orders: number;
  total_revenue: number;
  conversion_rate: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [bids, setBids] = useState<BidData[]>([]);
  const [topAuctions, setTopAuctions] = useState<TopAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [athenaQuery, setAthenaQuery] = useState('');
  const [athenaResults, setAthenaResults] = useState<{ columns: string[]; rows: string[][] } | null>(null);
  const [athenaLoading, setAthenaLoading] = useState(false);
  const [athenaError, setAthenaError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [statsData, revenueData, bidsData, topData] = await Promise.all([
        api.get<DashboardStats>('/analytics/stats'),
        api.get<RevenueData[]>(`/analytics/revenue?days=${days}`),
        api.get<BidData[]>(`/analytics/bids?days=${days}`),
        api.get<TopAuction[]>('/analytics/top-auctions?limit=10'),
      ]);
      setStats(statsData);
      setRevenue(revenueData);
      setBids(bidsData);
      setTopAuctions(topData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAthenaQuery = async () => {
    if (!athenaQuery.trim()) return;
    setAthenaLoading(true);
    setAthenaError(null);
    try {
      const result = await api.post<{ columns: string[]; rows: string[][] }>(
        '/analytics/query',
        { sql: athenaQuery },
        true
      );
      setAthenaResults(result);
    } catch (err) {
      setAthenaError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setAthenaLoading(false);
    }
  };

  const exportCSV = () => {
    if (!athenaResults) return;
    const header = athenaResults.columns.join(',');
    const rows = athenaResults.rows.map(r => r.join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => `$${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Revenue trends, bid activity, and ad-hoc queries</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(stats.total_revenue), color: 'text-emerald-600' },
            { label: 'Total Auctions', value: stats.total_auctions.toLocaleString(), color: 'text-blue-600' },
            { label: 'Total Bids', value: stats.total_bids.toLocaleString(), color: 'text-purple-600' },
            { label: 'Conversion Rate', value: `${stats.conversion_rate}%`, color: 'text-amber-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Revenue Over Time</h2>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No revenue data</div>
          )}
        </div>

        {/* Bid Activity Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Bid Activity</h2>
          {bids.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bids}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bid_count" stroke="#8b5cf6" name="Bids" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No bid data</div>
          )}
        </div>
      </div>

      {/* Top Auctions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Top Auctions by Bid Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Bids</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topAuctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">#{auction.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 max-w-xs truncate">{auction.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      auction.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                    }`}>{auction.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">{auction.total_bids}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(auction.final_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ad-hoc SQL Query Interface */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Ad-hoc SQL Query (Athena)</h2>
          <p className="text-xs text-slate-400 mt-1">Run SQL queries against the data lake. Warning: no input sanitization (intentional vulnerability).</p>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            value={athenaQuery}
            onChange={(e) => setAthenaQuery(e.target.value)}
            placeholder="SELECT * FROM auctions LIMIT 10"
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-vertical"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleAthenaQuery}
              disabled={athenaLoading || !athenaQuery.trim()}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {athenaLoading ? 'Running...' : 'Run Query'}
            </button>
            {athenaResults && (
              <button
                onClick={exportCSV}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Export CSV
              </button>
            )}
          </div>

          {athenaError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{athenaError}</div>
          )}

          {athenaResults && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {athenaResults.columns.map((col, i) => (
                      <th key={i} className="px-3 py-2 text-left text-xs font-medium text-slate-500">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {athenaResults.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-slate-600 font-mono text-xs">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 bg-slate-50 text-xs text-slate-400 border-t border-slate-200">
                {athenaResults.rows.length} rows
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
