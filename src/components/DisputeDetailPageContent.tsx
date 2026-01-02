'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { Dispute } from '../types';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Textarea, Input } from '@design-system/components';
import { formatDateTime } from '@design-system/utils';
import styles from '../app/disputes/[id]/page.module.css';

interface DisputeDetailPageContentProps {
  id: string;
}

export default function DisputeDetailPageContent({ id }: DisputeDetailPageContentProps) {
  const router = useRouter();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchDispute();
  }, [id, router]);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDisputeById(id);
      const disputeData = response.data || response;
      setDispute(disputeData);
      setStatus(disputeData.status || 'open');
      setResolution(disputeData.resolution || '');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dispute';
      setError(errorMessage);
      console.error('Failed to fetch dispute:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!dispute) return;

    try {
      setUpdating(true);
      await api.updateDispute(id, { status });
      await fetchDispute();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update dispute';
      setError(errorMessage);
      console.error('Failed to update dispute:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!dispute || !resolution.trim()) {
      alert('Please provide a resolution before resolving the dispute.');
      return;
    }

    try {
      setUpdating(true);
      await api.resolveDispute(id, resolution);
      await fetchDispute();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve dispute';
      setError(errorMessage);
      console.error('Failed to resolve dispute:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'success';
      case 'open':
        return 'error';
      case 'in_review':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading dispute...</p>
        </div>
      </div>
    );
  }

  if (error && !dispute) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <Button variant="primary" onClick={fetchDispute}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <p>Dispute not found.</p>
          <Link href="/disputes">
            <Button variant="primary">Back to Disputes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/disputes">
          <Button variant="secondary" size="sm">
            ← Back to Disputes
          </Button>
        </Link>
        <h1 className={styles.title}>Dispute #{String(dispute.id).slice(0, 8)}</h1>
        <Badge variant={getStatusVariant(dispute.status)} size="lg">
          {dispute.status}
        </Badge>
      </div>

      {error && (
        <Card variant="outlined" padding="md" className={styles.errorCard}>
          <p>{error}</p>
        </Card>
      )}

      <div className={styles.content}>
        <div className={styles.mainSection}>
          {dispute.auction && (
            <Card variant="outlined" padding="md" className={styles.section}>
              <h2 className={styles.sectionTitle}>Auction Details</h2>
              <Link href={`/auctions/${dispute.auction.id}`}>
                <h3 className={styles.auctionTitle}>{dispute.auction.title}</h3>
              </Link>
              <p className={styles.auctionDescription}>{dispute.auction.description}</p>
            </Card>
          )}

          <Card variant="outlined" padding="md" className={styles.section}>
            <h2 className={styles.sectionTitle}>Dispute Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Filed By:</span>
                <span className={styles.infoValue}>
                  {dispute.filer ? (
                    <Link href={`/users/${dispute.filed_by}`}>
                      {dispute.filer.name || dispute.filer.email}
                    </Link>
                  ) : (
                    `User ${String(dispute.filed_by).slice(0, 8)}`
                  )}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Role:</span>
                <Badge variant={dispute.filed_by_role === 'seller' ? 'info' : 'default'} size="sm">
                  {dispute.filed_by_role}
                </Badge>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Status:</span>
                <Badge variant={getStatusVariant(dispute.status)} size="sm">
                  {dispute.status}
                </Badge>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Created:</span>
                <span className={styles.infoValue}>
                  {formatDateTime(dispute.created_at)}
                </span>
              </div>
              {dispute.updated_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Last Updated:</span>
                  <span className={styles.infoValue}>
                    {formatDateTime(dispute.updated_at)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card variant="outlined" padding="md" className={styles.section}>
            <h2 className={styles.sectionTitle}>Reason</h2>
            <p className={styles.reasonText}>{dispute.reason}</p>
          </Card>

          {dispute.resolution && (
            <Card variant="outlined" padding="md" className={styles.section}>
              <h2 className={styles.sectionTitle}>Resolution</h2>
              <p className={styles.resolutionText}>{dispute.resolution}</p>
            </Card>
          )}

          <Card variant="outlined" padding="md" className={styles.section}>
            <CardHeader>
              <CardTitle as="h2">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.adminForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="status-select">Status:</label>
                  <select
                    id="status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={styles.select}
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleUpdateStatus}
                  disabled={updating || status === dispute.status}
                  isLoading={updating}
                >
                  Update Status
                </Button>

                <div className={styles.formGroup}>
                  <label htmlFor="resolution">Resolution Notes:</label>
                  <Textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={6}
                    placeholder="Enter resolution details..."
                    fullWidth
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={handleResolve}
                  disabled={updating || !resolution.trim()}
                  isLoading={updating}
                >
                  Resolve Dispute
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
