'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../../lib/auth';
import { api } from '../../lib/api';
import { Order } from '../../types';
import { Button, Card, Badge, Input } from '@design-system/components';
import { formatCurrency } from '@design-system/utils';
import WorkflowStateBadge from '../../components/WorkflowStateBadge';
import styles from './page.module.css';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    status?: string;
    payment_status?: string;
    shipping_status?: string;
    workflow_state?: string;
    search?: string;
  }>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadOrders();
  }, [router]);

  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const loadOrders = async (filterParams?: typeof filters) => {
    try {
      setLoading(true);
      // No authorization check - admin can access all orders
      const response = await api.getOrders(filterParams || filters);
      const ordersList = Array.isArray(response) ? response : [];
      setAllOrders(ordersList);
      
      // Apply client-side filtering
      let filtered = ordersList;
      
      // Filter by workflow state if specified
      if (filterParams?.workflow_state || filters.workflow_state) {
        const workflowFilter = filterParams?.workflow_state || filters.workflow_state;
        filtered = filtered.filter((order) => {
          return order.auction?.workflow_state === workflowFilter;
        });
      }
      
      // Apply search filtering if search query exists
      if (filterParams?.search || filters.search) {
        const searchTerm = (filterParams?.search || filters.search || '').toLowerCase();
        filtered = filtered.filter((order) => {
          const orderId = order.id.toString().toLowerCase();
          const buyerName = order.buyer?.name?.toLowerCase() || '';
          const buyerEmail = order.buyer?.email?.toLowerCase() || '';
          const sellerName = order.seller?.name?.toLowerCase() || '';
          const sellerEmail = order.seller?.email?.toLowerCase() || '';
          const auctionTitle = order.auction?.title?.toLowerCase() || '';
          
          return (
            orderId.includes(searchTerm) ||
            buyerName.includes(searchTerm) ||
            buyerEmail.includes(searchTerm) ||
            sellerName.includes(searchTerm) ||
            sellerEmail.includes(searchTerm) ||
            auctionTitle.includes(searchTerm)
          );
        });
      }
      
      setOrders(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    loadOrders(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const newFilters = { ...filters, search: query.trim() || undefined };
    setFilters(newFilters);
    loadOrders(newFilters);
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
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Order Management</h1>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => api.closeExpiredAuctions()}>
            Close Expired Auctions
          </Button>
        </div>
      </div>

      {error && (
        <Card variant="outlined" padding="md" className={styles.errorCard}>
          <p>{error}</p>
        </Card>
      )}

      <Card variant="outlined" padding="md" className={styles.filtersCard}>
        <div className={styles.filters}>
          <div className={styles.searchGroup}>
            <Input
              id="order-search"
              label="Search Orders"
              type="text"
              placeholder="Search by order ID, buyer, seller, or auction title..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              fullWidth
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="status-filter" className={styles.filterLabel}>Status:</label>
            <select
              id="status-filter"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="payment-status-filter" className={styles.filterLabel}>Payment Status:</label>
            <select
              id="payment-status-filter"
              value={filters.payment_status || ''}
              onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="shipping-status-filter" className={styles.filterLabel}>Shipping Status:</label>
            <select
              id="shipping-status-filter"
              value={filters.shipping_status || ''}
              onChange={(e) => handleFilterChange('shipping_status', e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="workflow-state-filter" className={styles.filterLabel}>Auction Workflow:</label>
            <select
              id="workflow-state-filter"
              value={filters.workflow_state || ''}
              onChange={(e) => handleFilterChange('workflow_state', e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              <option value="active">Active Bidding</option>
              <option value="pending_sale">Pending Sale</option>
              <option value="shipping">Shipped</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>
      </Card>

      {orders.length === 0 ? (
        <Card variant="outlined" padding="md" className={styles.emptyCard}>
          <p>No orders found.</p>
        </Card>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <Card key={order.id} variant="outlined" padding="md" className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <Link href={`/orders/${order.id}`}>
                    <h3 className={styles.orderTitle}>Order #{order.id}</h3>
                  </Link>
                  {order.auction && (
                    <Link href={`/auctions/${order.auction.id}`}>
                      <p className={styles.auctionTitle}>{order.auction.title}</p>
                    </Link>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', alignItems: 'flex-end' }}>
                  <Badge variant={getStatusBadgeVariant(order.status)} size="md">
                    {order.status}
                  </Badge>
                  {order.auction?.workflow_state && (
                    <WorkflowStateBadge state={order.auction.workflow_state} size="sm" />
                  )}
                </div>
              </div>

              <div className={styles.orderDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total:</span>
                  <span className={styles.detailValue}>{formatCurrency(order.total_amount)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Payment:</span>
                  <Badge variant={getStatusBadgeVariant(order.payment_status)} size="sm">
                    {order.payment_status}
                  </Badge>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Shipping:</span>
                  <Badge variant={getStatusBadgeVariant(order.shipping_status)} size="sm">
                    {order.shipping_status}
                  </Badge>
                </div>
                {order.auction?.workflow_state && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Auction Workflow:</span>
                    <WorkflowStateBadge state={order.auction.workflow_state} size="sm" />
                  </div>
                )}
                {order.buyer && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Buyer:</span>
                    <span className={styles.detailValue}>{order.buyer.name} ({order.buyer.email})</span>
                  </div>
                )}
                {order.seller && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Seller:</span>
                    <span className={styles.detailValue}>{order.seller.name} ({order.seller.email})</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Created:</span>
                  <span className={styles.detailValue}>
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                {order.tracking_url && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Tracking:</span>
                    <a 
                      href={order.tracking_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.trackingLink}
                    >
                      View Tracking
                    </a>
                  </div>
                )}
                {order.shipped_at && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Shipped:</span>
                    <span className={styles.detailValue}>
                      {new Date(order.shipped_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {order.completed_at && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Completed:</span>
                    <span className={styles.detailValue}>
                      {new Date(order.completed_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.orderActions}>
                <Link href={`/orders/${order.id}`}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
