'use client';

import { useState, useEffect } from 'react';
import { Auction } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea } from '@design-system/components';
import styles from './AuctionForm.module.css';

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
    <Card variant="elevated" padding="lg" className={styles.formCard}>
      <CardHeader>
        <CardTitle>
          {auction ? 'Edit Auction' : 'Create New Auction'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <Input
            label="Title"
            id="auction-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />

          <Textarea
            label="Description"
            id="auction-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            helperText="Note: Description will be rendered without sanitization (XSS vulnerability)"
            fullWidth
          />

          <div className={styles.grid}>
            <Input
              label="Starting Price ($)"
              id="auction-price"
              type="number"
              step="0.01"
              min="0"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              required
              fullWidth
            />

            <Input
              label="End Time"
              id="auction-end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              fullWidth
            />
          </div>

          <div className={styles.actions}>
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : auction ? 'Update Auction' : 'Create Auction'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

