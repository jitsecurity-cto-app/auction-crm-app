'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../../lib/auth';
import { api } from '../../lib/api';
import { Order } from '../../types';
import { formatCurrency } from '@design-system/utils';
import WorkflowStateBadge from '../../components/WorkflowStateBadge';

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

  const getStatusClasses = (status: string): string => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'shipped':
      case 'paid':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'pending_payment':
      case 'pending':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'cancelled':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
            <p className="text-slate-500 mt-1">View and manage all platform orders</p>
          </div>
          <button
            onClick={() => api.closeExpiredAuctions()}
            className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Close Expired Auctions
          </button>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label htmlFor="order-search" className="block text-sm font-medium text-slate-700 mb-1.5">
                Search Orders
              </label>
              <input
                id="order-search"
                type="text"
                placeholder="Search by order ID, buyer, seller, or auction..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
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

            <div>
              <label htmlFor="payment-status-filter" className="block text-sm font-medium text-slate-700 mb-1.5">
                Payment
              </label>
              <select
                id="payment-status-filter"
                value={filters.payment_status || ''}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label htmlFor="shipping-status-filter" className="block text-sm font-medium text-slate-700 mb-1.5">
                Shipping
              </label>
              <select
                id="shipping-status-filter"
                value={filters.shipping_status || ''}
                onChange={(e) => handleFilterChange('shipping_status', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="workflow-state-filter" className="block text-sm font-medium text-slate-700 mb-1.5">
              Auction Workflow
            </label>
            <select
              id="workflow-state-filter"
              value={filters.workflow_state || ''}
              onChange={(e) => handleFilterChange('workflow_state', e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white min-w-[200px]"
            >
              <option value="">All</option>
              <option value="active">Active Bidding</option>
              <option value="pending_sale">Pending Sale</option>
              <option value="shipping">Shipped</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Link href={`/orders/${order.id}`} className="text-base font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                      Order #{order.id}
                    </Link>
                    {order.auction && (
                      <Link href={`/auctions/${order.auction.id}`}>
                        <p className="text-sm text-slate-500 mt-1 hover:text-primary-600 transition-colors">{order.auction.title}</p>
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(order.status)}`}>
                      {order.status}
                    </span>
                    {order.auction?.workflow_state && (
                      <WorkflowStateBadge state={order.auction.workflow_state} size="sm" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Total</span>
                    <p className="font-semibold text-slate-900">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment</span>
                    <p className="mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Shipping</span>
                    <p className="mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(order.shipping_status)}`}>
                        {order.shipping_status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Created</span>
                    <p className="text-slate-700">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  {order.buyer && (
                    <div>
                      <span className="text-slate-500">Buyer</span>
                      <p className="text-slate-700">{order.buyer.name} ({order.buyer.email})</p>
                    </div>
                  )}
                  {order.seller && (
                    <div>
                      <span className="text-slate-500">Seller</span>
                      <p className="text-slate-700">{order.seller.name} ({order.seller.email})</p>
                    </div>
                  )}
                  {order.tracking_url && (
                    <div>
                      <span className="text-slate-500">Tracking</span>
                      <p>
                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 transition-colors">
                          View Tracking
                        </a>
                      </p>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div>
                      <span className="text-slate-500">Shipped</span>
                      <p className="text-slate-700">{new Date(order.shipped_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {order.completed_at && (
                    <div>
                      <span className="text-slate-500">Completed</span>
                      <p className="text-slate-700">{new Date(order.completed_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Link href={`/orders/${order.id}`}>
                    <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
