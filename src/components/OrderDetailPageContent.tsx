'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../lib/auth';
import { api } from '../lib/api';
import { Order } from '../types';
import { formatCurrency } from '@design-system/utils';
import WorkflowStateBadge from './WorkflowStateBadge';

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
          <p className="text-slate-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600">Error: {error}</p>
        <button onClick={fetchOrder} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500">Order not found.</p>
        <Link href="/orders">
          <button className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            Back to Orders
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/orders" className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Order #{order.id}</h1>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(order.status)}`}>
              {order.status}
            </span>
          </div>
          <Link href="/orders">
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Back to Orders
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auction Details */}
            {order.auction && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Auction Details</h3>
                <Link href={`/auctions/${order.auction.id}`} className="text-lg font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  {order.auction.title}
                </Link>
                <p className="text-sm text-slate-500 mt-2">{order.auction.description}</p>
                {order.auction.workflow_state && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm font-medium text-slate-500">Workflow:</span>
                    <WorkflowStateBadge state={order.auction.workflow_state} size="sm" />
                  </div>
                )}
              </div>
            )}

            {/* Order Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Order Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Total Amount</span>
                  <p className="text-lg font-semibold text-slate-900">{formatCurrency(order.total_amount)}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Payment Status</span>
                  <p className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Shipping Status</span>
                  <p className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(order.shipping_status)}`}>
                      {order.shipping_status}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Created</span>
                  <p className="text-sm text-slate-900">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                {order.updated_at && (
                  <div>
                    <span className="text-sm text-slate-500">Last Updated</span>
                    <p className="text-sm text-slate-900">{new Date(order.updated_at).toLocaleString()}</p>
                  </div>
                )}
                {order.shipped_at && (
                  <div>
                    <span className="text-sm text-slate-500">Shipped At</span>
                    <p className="text-sm text-slate-900">{new Date(order.shipped_at).toLocaleString()}</p>
                  </div>
                )}
                {order.completed_at && (
                  <div>
                    <span className="text-sm text-slate-500">Completed At</span>
                    <p className="text-sm text-slate-900">{new Date(order.completed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Shipping Information</h3>
              {order.shipping_address && (
                <div className="mb-3">
                  <span className="text-sm text-slate-500">Address</span>
                  <p className="text-sm text-slate-900">{order.shipping_address}</p>
                </div>
              )}
              {order.tracking_number && (
                <div className="mb-3">
                  <span className="text-sm text-slate-500">Tracking Number</span>
                  <p className="text-sm font-mono text-slate-900">{order.tracking_number}</p>
                </div>
              )}
              {order.tracking_url && (
                <div>
                  <span className="text-sm text-slate-500">Tracking URL</span>
                  <p>
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:text-primary-700 transition-colors">
                      {order.tracking_url}
                    </a>
                  </p>
                </div>
              )}
              {!order.shipping_address && !order.tracking_number && !order.tracking_url && (
                <p className="text-sm text-slate-400">No shipping information available</p>
              )}
            </div>

            {/* Admin Actions */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-900">Admin Actions</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="tracking-number" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tracking Number
                  </label>
                  <input
                    id="tracking-number"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="tracking-url" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tracking URL
                  </label>
                  <input
                    id="tracking-url"
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://tracking.example.com/..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shipping-status" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Shipping Status
                    </label>
                    <select
                      id="shipping-status"
                      value={shippingStatus}
                      onChange={(e) => setShippingStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="payment-status" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Payment Status
                    </label>
                    <select
                      id="payment-status"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {order.buyer && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Buyer Contact</h3>
                <p className="text-sm font-medium text-slate-900">{order.buyer.name}</p>
                <p className="text-sm text-slate-500 mt-1">{order.buyer.email}</p>
                {order.buyer.phone && <p className="text-sm text-slate-500 mt-1">Phone: {order.buyer.phone}</p>}
                {order.buyer.address && <p className="text-sm text-slate-500 mt-1">Address: {order.buyer.address}</p>}
              </div>
            )}

            {order.seller && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Seller Contact</h3>
                <p className="text-sm font-medium text-slate-900">{order.seller.name}</p>
                <p className="text-sm text-slate-500 mt-1">{order.seller.email}</p>
                {order.seller.phone && <p className="text-sm text-slate-500 mt-1">Phone: {order.seller.phone}</p>}
                {order.seller.address && <p className="text-sm text-slate-500 mt-1">Address: {order.seller.address}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
