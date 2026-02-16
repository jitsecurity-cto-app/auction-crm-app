'use client';

import Link from 'next/link';
import { Auction } from '../types';
import { formatCurrency, formatDateTime } from '@design-system/utils';
import WorkflowStateBadge from './WorkflowStateBadge';

interface AuctionTableProps {
  auctions: Auction[];
  onDelete?: (id: string) => void;
}

export default function AuctionTable({ auctions, onDelete }: AuctionTableProps) {
  const getStatusClasses = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'cancelled':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Workflow</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Starting Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Bid</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {auctions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                  No auctions found
                </td>
              </tr>
            ) : (
              auctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/auctions/${auction.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {auction.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(auction.status)}`}>
                      {auction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <WorkflowStateBadge state={auction.workflow_state} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{formatCurrency(auction.starting_price)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(auction.current_bid || auction.starting_price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(auction.end_time)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/auctions/${auction.id}`}>
                        <button className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors">
                          Edit
                        </button>
                      </Link>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(auction.id)}
                          className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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
