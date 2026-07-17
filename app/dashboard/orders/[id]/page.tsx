'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  FiArrowLeft,
  FiPackage,
  FiMapPin,
  FiUser,
  FiClock,
  FiFileText,
  FiSend,
  FiDownload,
  FiTruck,
  FiExternalLink,
  FiRefreshCw,
} from 'react-icons/fi';
import api, { API_BASE } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { toastSuccess, toastError } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { Order, CourierAccount } from '@/lib/types';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const cardCls =
  'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50';
const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [newPayment, setNewPayment] = useState('');
  const [note, setNote] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const [courierAccounts, setCourierAccounts] = useState<CourierAccount[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [refreshingShipment, setRefreshingShipment] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await api.get<{ order: Order }>(`/admin-orders/${id}`);
      setOrder(data.order);
      setNewStatus(data.order.orderStatus);
      setNewPayment(data.order.paymentStatus);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id, fetchOrder]);

  useEffect(() => {
    api
      .get<{ accounts: CourierAccount[] }>('/courier/accounts')
      .then((data) => {
        const active = data.accounts.filter((a) => a.isActive && a.hasCredentials);
        setCourierAccounts(active);
        const def = active.find((a) => a.isDefault);
        setSelectedCourierId(def?._id || active[0]?._id || '');
      })
      .catch(() => {});
  }, []);

  const handleCreateShipment = async () => {
    setCreatingShipment(true);
    try {
      await api.post(`/admin-orders/${id}/shipment`, selectedCourierId ? { courierId: selectedCourierId } : {});
      toastSuccess('Shipment created');
      fetchOrder();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setCreatingShipment(false);
    }
  };

  const handleRefreshShipment = async () => {
    setRefreshingShipment(true);
    try {
      await api.post(`/admin-orders/${id}/shipment/refresh`);
      toastSuccess('Shipment status refreshed');
      fetchOrder();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setRefreshingShipment(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin-orders/${id}/status`, {
        orderStatus: newStatus !== order?.orderStatus ? newStatus : undefined,
        paymentStatus: newPayment !== order?.paymentStatus ? newPayment : undefined,
        note: note || undefined,
      });
      toastSuccess('Order updated');
      setNote('');
      fetchOrder();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const downloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const res = await fetch(`${API_BASE}/admin-orders/${id}/invoice`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Could not generate the invoice');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const sendInvoice = async () => {
    let email = order?.customerEmail || order?.user?.email || '';
    if (!email) {
      const { value } = await Swal.fire({
        title: 'Send invoice to which email?',
        input: 'email',
        inputPlaceholder: 'customer@example.com',
        showCancelButton: true,
        confirmButtonText: 'Send',
        confirmButtonColor: '#036bfc',
      });
      if (!value) return;
      email = value;
    }
    setSendingInvoice(true);
    try {
      const res = await api.post<{ message: string }>(`/admin-orders/${id}/send-invoice`, { email });
      toastSuccess(res.message);
      fetchOrder();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSendingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-zinc-500 dark:text-zinc-400">Order not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{order.orderNumber}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.source === 'admin' && <StatusBadge status="admin" label="manual order" />}
          <StatusBadge status={order.orderStatus} />
          <StatusBadge status={order.paymentStatus} />
          <StatusBadge status={order.paymentMethod} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items + totals */}
        <div className="space-y-6 lg:col-span-2">
          <div className={`${cardCls} !p-0 overflow-hidden`}>
            <h2 className="border-b border-zinc-200 px-6 py-4 text-lg font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
              Items ({order.items.length})
            </h2>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail} alt={item.name} className="h-14 w-14 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                      <FiPackage size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
                    {item.variant && Object.keys(item.variant).length > 0 && (
                      <p className="text-xs text-zinc-500">
                        {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">৳{item.price.toLocaleString()} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>Subtotal</span><span>৳{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-৳{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>Shipping</span><span>৳{order.shippingCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
                <span>Total</span><span>৳{order.total.toLocaleString()}</span>
              </div>
              {order.items.some((i) => (i.costPrice || 0) > 0) && (
                <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  <span>Estimated Profit (items)</span>
                  <span>
                    ৳
                    {order.items
                      .reduce((s, i) => s + (i.price - (i.costPrice || 0)) * i.quantity, 0)
                      .toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status history */}
          <div className={cardCls}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <FiClock size={18} /> Status History
            </h2>
            <div className="space-y-4">
              {(order.statusHistory || []).slice().reverse().map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-900 dark:bg-white" />
                  <div>
                    <p className="text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">{h.status}</p>
                    {h.note && <p className="text-sm text-zinc-500">{h.note}</p>}
                    <p className="text-xs text-zinc-400">{new Date(h.at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: customer, address, update */}
        <div className="space-y-6">
          <div className={cardCls}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Update Order</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className={labelCls}>Order Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={inputCls}>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Payment Status</label>
                <select value={newPayment} onChange={(e) => setNewPayment(e.target.value)} className={inputCls}>
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Note (optional)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Handed to courier" />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? 'Updating...' : 'Update Order'}
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <FiTruck size={18} /> Shipment
            </h2>

            {order.shipment?.consignmentId ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
                    {order.shipment.provider}
                  </span>
                  {order.shipment.status && <StatusBadge status={order.shipment.status} />}
                </div>
                <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950">
                  <p className="text-xs text-zinc-500">Tracking Code</p>
                  <p className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{order.shipment.trackingCode}</p>
                </div>
                {order.shipment.trackingUrl && (
                  <a
                    href={order.shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <FiExternalLink size={13} /> Track on courier site
                  </a>
                )}
                {order.shipment.lastSyncedAt && (
                  <p className="text-xs text-zinc-400">
                    Last synced {new Date(order.shipment.lastSyncedAt).toLocaleString()}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleRefreshShipment}
                  disabled={refreshingShipment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-70 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <FiRefreshCw size={15} className={refreshingShipment ? 'animate-spin' : ''} />
                  {refreshingShipment ? 'Refreshing...' : 'Refresh Status'}
                </button>

                {(order.shipment.trackingHistory?.length || 0) > 0 && (
                  <div className="space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {order.shipment.trackingHistory!.slice().reverse().map((h, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-400" />
                        <div>
                          <p className="text-xs font-medium capitalize text-zinc-700 dark:text-zinc-300">
                            {h.status.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[11px] text-zinc-400">{new Date(h.at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : courierAccounts.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No courier connected yet.{' '}
                <Link href="/dashboard/courier" className="text-primary hover:underline">
                  Connect one
                </Link>{' '}
                to create shipments from here.
              </p>
            ) : (
              <div className="space-y-3">
                {courierAccounts.length > 1 && (
                  <select value={selectedCourierId} onChange={(e) => setSelectedCourierId(e.target.value)} className={inputCls}>
                    {courierAccounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.provider.charAt(0).toUpperCase() + a.provider.slice(1)} {a.isDefault ? '(default)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={handleCreateShipment}
                  disabled={creatingShipment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
                >
                  <FiTruck size={15} /> {creatingShipment ? 'Creating...' : 'Create Shipment'}
                </button>
              </div>
            )}
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <FiFileText size={18} /> Invoice
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadInvoice}
                disabled={downloadingInvoice}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-70"
              >
                <FiDownload size={15} /> {downloadingInvoice ? 'Preparing...' : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={sendInvoice}
                disabled={sendingInvoice}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
              >
                <FiSend size={15} /> {sendingInvoice ? 'Sending...' : 'Send Invoice'}
              </button>
            </div>
            {order.invoiceSentAt && (
              <p className="mt-2 text-xs text-zinc-400">Last sent {new Date(order.invoiceSentAt).toLocaleString()}</p>
            )}
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <FiUser size={18} /> Customer
            </h2>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{order.user?.name || '—'}</p>
              <p className="text-zinc-500">{order.user?.mobile}</p>
              <p className="text-zinc-500">{order.user?.email}</p>
              {order.user && (
                <Link href={`/dashboard/customers/${order.user._id}`} className="inline-block pt-1 text-blue-600 hover:underline dark:text-blue-400">
                  View profile →
                </Link>
              )}
            </div>
          </div>

          <div className={cardCls}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <FiMapPin size={18} /> Shipping Address
            </h2>
            <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.phone}</p>
              <p>{order.shippingAddress?.addressLine}</p>
              <p>
                {[order.shippingAddress?.area, order.shippingAddress?.city, order.shippingAddress?.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
