'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { Order } from '../types';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import WorkflowStateBadge from './WorkflowStateBadge';
import styles from '../app/orders/[id]/page.module.css';

interface OrderDetailPageContentProps {
  id: string;
}

export default function OrderDetailPageContent({ id }: OrderDetailPageContentProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [shippingStatus, setShippingStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchOrder();
  }, [id, router]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // No authorization check - admin can access any order
      const response = await api.getOrderById(id);
      const orderData = response.data || response;
      setOrder(orderData);
      setTrackingNumber(orderData.tracking_number || '');
      setTrackingUrl(orderData.tracking_url || '');
      setShippingStatus(orderData.shipping_status || 'pending');
      setPaymentStatus(orderData.payment_status || 'pending');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      setError(errorMessage);
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      // No authorization check - admin can update any order
      await api.updateOrder(id, {
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        shipping_status: shippingStatus,
        payment_status: paymentStatus,
      });
      await fetchOrder();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      setError(errorMessage);
      console.error('Failed to update order:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'success';
      case 'shipped':
      case 'paid':
        return 'info';
      case 'pending_payment':
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <Button variant="primary" onClick={fetchOrder}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <p>Order not found.</p>
          <Link href="/orders">
            <Button variant="primary">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/orders">
          <Button variant="secondary" size="sm">
            ← Back to Orders
          </Button>
        </Link>
        <h1 className={styles.title}>Order #{order.id}</h1>
        <Badge variant={getStatusBadgeVariant(order.status)} size="lg">
          {order.status}
        </Badge>
      </div>

      {error && (
        <Card variant="outlined" padding="md" className={styles.errorCard}>
          <p>{error}</p>
        </Card>
      )}

      <div className={styles.content}>
        <div className={styles.mainSection}>
          {order.auction && (
            <Card variant="outlined" padding="md" className={styles.section}>
              <h2 className={styles.sectionTitle}>Auction Details</h2>
              <Link href={`/auctions/${order.auction.id}`}>
                <h3 className={styles.auctionTitle}>{order.auction.title}</h3>
              </Link>
              <p className={styles.auctionDescription}>{order.auction.description}</p>
              {order.auction.workflow_state && (
                <div style={{ marginTop: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)' }}>
                    Workflow State:
                  </span>
                  <WorkflowStateBadge state={order.auction.workflow_state} size="sm" />
                </div>
              )}
            </Card>
          )}

          <Card variant="outlined" padding="md" className={styles.section}>
            <h2 className={styles.sectionTitle}>Order Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Amount:</span>
                <span className={styles.infoValue}>{formatCurrency(order.total_amount)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Payment Status:</span>
                <Badge variant={getStatusBadgeVariant(order.payment_status)} size="sm">
                  {order.payment_status}
                </Badge>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Shipping Status:</span>
                <Badge variant={getStatusBadgeVariant(order.shipping_status)} size="sm">
                  {order.shipping_status}
                </Badge>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Created:</span>
                <span className={styles.infoValue}>
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
              {order.updated_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Last Updated:</span>
                  <span className={styles.infoValue}>
                    {new Date(order.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
              {order.shipped_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Shipped At:</span>
                  <span className={styles.infoValue}>
                    {new Date(order.shipped_at).toLocaleString()}
                  </span>
                </div>
              )}
              {order.completed_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Completed At:</span>
                  <span className={styles.infoValue}>
                    {new Date(order.completed_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card variant="outlined" padding="md" className={styles.section}>
            <h2 className={styles.sectionTitle}>Shipping Information</h2>
            {order.shipping_address && (
              <div className={styles.shippingAddress}>
                <p className={styles.addressLabel}>Shipping Address:</p>
                <p className={styles.addressValue}>{order.shipping_address}</p>
              </div>
            )}
            {order.tracking_number && (
              <div className={styles.trackingInfo}>
                <p className={styles.trackingLabel}>Tracking Number:</p>
                <p className={styles.trackingValue}>{order.tracking_number}</p>
              </div>
            )}
            {order.tracking_url && (
              <div className={styles.trackingInfo}>
                <p className={styles.trackingLabel}>Tracking URL:</p>
                <a 
                  href={order.tracking_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.trackingLink}
                >
                  {order.tracking_url}
                </a>
              </div>
            )}
          </Card>

          <Card variant="outlined" padding="md" className={styles.section}>
            <CardHeader>
              <CardTitle as="h2">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.adminForm}>
                <Input
                  id="tracking-number"
                  label="Tracking Number"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  fullWidth
                />

                <Input
                  id="tracking-url"
                  label="Tracking URL"
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://tracking.example.com/..."
                  fullWidth
                />

                <div className={styles.formGroup}>
                  <label htmlFor="shipping-status">Shipping Status:</label>
                  <select
                    id="shipping-status"
                    value={shippingStatus}
                    onChange={(e) => setShippingStatus(e.target.value)}
                    className={styles.select}
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="payment-status">Payment Status:</label>
                  <select
                    id="payment-status"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className={styles.select}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <Button
                  variant="primary"
                  onClick={handleUpdate}
                  disabled={updating}
                  isLoading={updating}
                >
                  Update Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={styles.sidebar}>
          {order.buyer && (
            <Card variant="outlined" padding="md" className={styles.contactCard}>
              <h3 className={styles.contactTitle}>Buyer Contact</h3>
              <p className={styles.contactName}>{order.buyer.name}</p>
              <p className={styles.contactEmail}>{order.buyer.email}</p>
              {order.buyer.phone && (
                <p className={styles.contactPhone}>Phone: {order.buyer.phone}</p>
              )}
              {order.buyer.address && (
                <p className={styles.contactAddress}>Address: {order.buyer.address}</p>
              )}
            </Card>
          )}

          {order.seller && (
            <Card variant="outlined" padding="md" className={styles.contactCard}>
              <h3 className={styles.contactTitle}>Seller Contact</h3>
              <p className={styles.contactName}>{order.seller.name}</p>
              <p className={styles.contactEmail}>{order.seller.email}</p>
              {order.seller.phone && (
                <p className={styles.contactPhone}>Phone: {order.seller.phone}</p>
              )}
              {order.seller.address && (
                <p className={styles.contactAddress}>Address: {order.seller.address}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
