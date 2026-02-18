'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AuditEvent } from '../../types';

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityTypeFilter) params.append('entity_type', entityTypeFilter);
      if (actionFilter) params.append('action', actionFilter);
      params.append('limit', '100');

      let url = '/audit';
      if (actorFilter) {
        url = `/audit/actor/${actorFilter}`;
      } else if (params.toString()) {
        url = `/audit?${params.toString()}`;
      }

      const data = await api.get<AuditEvent[]>(url);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [entityTypeFilter, actionFilter, actorFilter]);

  const getActionBadgeClasses = (action: string) => {
    switch (action) {
      case 'create': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'update': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delete': return 'bg-red-50 text-red-700 border-red-200';
      case 'close': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'auction': return '🏷️';
      case 'bid': return '💰';
      case 'order': return '📦';
      case 'user': return '👤';
      case 'dispute': return '⚖️';
      default: return '📋';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">View all system activity and changes</p>
      </div>

      <div className="p-8 space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="auction">Auctions</option>
              <option value="bid">Bids</option>
              <option value="order">Orders</option>
              <option value="user">Users</option>
              <option value="dispute">Disputes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="close">Close</option>
              <option value="resolve">Resolve</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Actor ID</label>
            <input
              type="text"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Filter by user ID..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading audit events...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No audit events found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Changes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="mr-1">{getEntityIcon(event.entity_type)}</span>
                      <span className="text-slate-700 font-medium">{event.entity_type}</span>
                      <span className="text-slate-400 ml-1">#{event.entity_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${getActionBadgeClasses(event.action)}`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div>{event.actor_email || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">ID: {event.actor_id}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {event.new_values && Object.keys(event.new_values).length > 0 ? (
                        <span title={JSON.stringify(event.new_values)}>
                          {Object.keys(event.new_values).join(', ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {event.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
