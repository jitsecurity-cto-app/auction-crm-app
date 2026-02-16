'use client';

import Link from 'next/link';
import { Dispute } from '../types';
import { formatDateTime } from '@design-system/utils';

interface DisputeListProps {
  disputes: Dispute[];
  onStatusChange?: (id: string, status: string) => void;
}

export default function DisputeList({ disputes, onStatusChange }: DisputeListProps) {
  const getStatusClasses = (status: string): string => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'open':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'in_review':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  };

  const getRoleClasses = (role: string): string => {
    return role === 'seller'
      ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
      : 'bg-slate-50 text-slate-700 ring-slate-600/20';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Auction</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Filed By</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {disputes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                  No disputes found
                </td>
              </tr>
            ) : (
              disputes.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/disputes/${dispute.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      #{String(dispute.id).slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {dispute.auction ? (
                      <Link
                        href={`/auctions/${dispute.auction.id}`}
                        className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {dispute.auction.title}
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {dispute.filer ? (
                      <Link
                        href={`/users/${dispute.filed_by}`}
                        className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {dispute.filer.name || dispute.filer.email}
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-400">User {String(dispute.filed_by).slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getRoleClasses(dispute.filed_by_role)}`}>
                      {dispute.filed_by_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[200px]">
                    <span className="text-sm text-slate-700 truncate block">
                      {dispute.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(dispute.status)}`}>
                      {dispute.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(dispute.created_at)}</td>
                  <td className="px-6 py-4">
                    <Link href={`/disputes/${dispute.id}`}>
                      <button className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors">
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
