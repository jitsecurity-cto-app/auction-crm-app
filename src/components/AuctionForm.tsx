'use client';

import { useState } from 'react';
import { Auction } from '../types';

interface AuctionFormProps {
  auction?: Auction;
  onSubmit: (data: {
    title: string;
    description: string;
    starting_price: number;
    end_time: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export default function AuctionForm({ auction, onSubmit, onCancel }: AuctionFormProps) {
  const [title, setTitle] = useState(auction?.title || '');
  const [description, setDescription] = useState(auction?.description || '');
  const [startingPrice, setStartingPrice] = useState(auction?.starting_price?.toString() || '');
  const [endTime, setEndTime] = useState(
    auction?.end_time
      ? new Date(auction.end_time).toISOString().slice(0, 16)
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Intentionally no input validation (security vulnerability)
      await onSubmit({
        title,
        description,
        starting_price: parseFloat(startingPrice),
        end_time: new Date(endTime).toISOString(),
      });
    } catch (err) {
      // Intentionally verbose error messages (security vulnerability)
      setError(err instanceof Error ? err.message : 'Failed to save auction');
      console.error('Auction form error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          {auction ? 'Edit Auction' : 'Create New Auction'}
        </h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="auction-title" className="block text-sm font-medium text-slate-700 mb-1.5">
              Title
            </label>
            <input
              id="auction-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="auction-description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              id="auction-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-vertical"
            />
            <p className="mt-1 text-xs text-slate-400">
              Note: Description will be rendered without sanitization (XSS vulnerability)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="auction-price" className="block text-sm font-medium text-slate-700 mb-1.5">
                Starting Price ($)
              </label>
              <input
                id="auction-price"
                type="number"
                step="0.01"
                min="0"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="auction-end-time" className="block text-sm font-medium text-slate-700 mb-1.5">
                End Time
              </label>
              <input
                id="auction-end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : auction ? 'Update Auction' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
