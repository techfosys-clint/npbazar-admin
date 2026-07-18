'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiShoppingBag,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiAlertTriangle,
  FiPackage,
  FiShoppingCart,
  FiStar,
  FiMessageSquare,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import type { Order, Product } from '@/lib/types';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  bestSellingProducts: number;
  lowStock: number;
  outOfStock: number;
  totalCustomers: number;
  pendingReviews: number;
  totalRevenue: number;
  todayRevenue: number;
  totalProfit: number;
  activeCarts: number;
  cartItems: number;
}

interface SalesPoint {
  _id: string;
  revenue: number;
  orders: number;
}

const RANGE_OPTIONS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24',
  processing: 'var(--color-primary)',
  shipped: '#6366f1',
  delivered: '#10b981',
  cancelled: '#f87171',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [lowStockList, setLowStockList] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get<{ stats: Stats }>('/dashboard/stats'),
      api.get<{ products: Product[] }>('/dashboard/top-products'),
      api.get<{ products: Product[] }>('/dashboard/low-stock'),
      api.get<{ orders: Order[] }>('/admin-orders?limit=6'),
      api.get<{ breakdown: Record<string, number> }>('/dashboard/order-status'),
    ]).then(([s, tp, ls, ro, ob]) => {
      if (s.status === 'fulfilled') setStats(s.value.stats);
      if (tp.status === 'fulfilled') setTopProducts(tp.value.products.slice(0, 5));
      if (ls.status === 'fulfilled') setLowStockList(ls.value.products.slice(0, 5));
      if (ro.status === 'fulfilled') setRecentOrders(ro.value.orders);
      if (ob.status === 'fulfilled') setStatusBreakdown(ob.value.breakdown);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    api
      .get<{ data: SalesPoint[] }>(`/dashboard/sales?days=${days}`)
      .then((d) => setSales(d.data))
      .catch(() => {});
  }, [days]);

  const CARDS = stats
    ? [
        {
          label: 'Total Revenue',
          value: `৳${stats.totalRevenue.toLocaleString()}`,
          sub: `৳${stats.todayRevenue.toLocaleString()} today`,
          icon: FiDollarSign,
          color: 'text-emerald-600 bg-emerald-50',
        },
        {
          label: 'Total Profit',
          value: `৳${(stats.totalProfit || 0).toLocaleString()}`,
          sub: 'revenue − buying cost',
          icon: FiTrendingUp,
          color: 'text-emerald-600 bg-emerald-50',
        },
        {
          label: 'Total Orders',
          value: stats.totalOrders.toLocaleString(),
          sub: `${stats.todayOrders} today · ${stats.pendingOrders} pending`,
          icon: FiShoppingBag,
          color: 'text-primary bg-primary/10',
        },
        {
          label: 'Active Carts',
          value: stats.activeCarts.toLocaleString(),
          sub: `${stats.cartItems} products waiting`,
          icon: FiShoppingCart,
          color: 'text-accent bg-accent/10',
        },
        {
          label: 'Customers',
          value: stats.totalCustomers.toLocaleString(),
          sub: 'registered accounts',
          icon: FiUsers,
          color: 'text-indigo-600 bg-indigo-50',
        },
        {
          label: 'Products',
          value: stats.totalProducts.toLocaleString(),
          sub: `${stats.activeProducts} active · ${stats.featuredProducts} featured · ${stats.bestSellingProducts} best`,
          icon: FiPackage,
          color: 'text-zinc-600 bg-zinc-100',
        },
        {
          label: 'Stock Alerts',
          value: (stats.lowStock + stats.outOfStock).toLocaleString(),
          sub: `${stats.outOfStock} out · ${stats.lowStock} low (≤5)`,
          icon: FiAlertTriangle,
          color: 'text-red-600 bg-red-50',
        },
        {
          label: 'Pending Orders',
          value: stats.pendingOrders.toLocaleString(),
          sub: 'need action',
          icon: FiClock,
          color: 'text-amber-600 bg-amber-50',
        },
        {
          label: 'Hidden Reviews',
          value: stats.pendingReviews.toLocaleString(),
          sub: 'awaiting approval',
          icon: FiMessageSquare,
          color: 'text-purple-600 bg-purple-50',
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  const totalStatusCount = STATUS_ORDER.reduce((s, k) => s + (statusBreakdown[k] || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard Overview</h1>
        <p className="text-sm text-zinc-500">Welcome to your Ecomus control panel.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{stat.sub}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order status breakdown */}
      {totalStatusCount > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <FiPackage className="text-[var(--color-primary)]" /> Order Status Breakdown
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Overview of your order pipeline</p>
            </div>
            <Link href="/dashboard/orders" className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors bg-primary/5 px-3 py-1.5 rounded-lg">
              Manage orders
            </Link>
          </div>
          <div className="flex flex-col items-center gap-8 sm:flex-row p-6">
            <div className="h-64 w-64 shrink-0 relative flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-zinc-900">{totalStatusCount}</span>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Total</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STATUS_ORDER.filter((s) => statusBreakdown[s]).map((s) => ({
                      name: s,
                      value: statusBreakdown[s] || 0,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    cornerRadius={5}
                  >
                    {STATUS_ORDER.filter((s) => statusBreakdown[s]).map((s) => (
                      <Cell key={s} fill={STATUS_COLORS[s]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    itemStyle={{ fontWeight: 600 }}
                    formatter={(value, name) => [
                      `${value} (${(((value as number) / totalStatusCount) * 100).toFixed(0)}%)`,
                      String(name).charAt(0).toUpperCase() + String(name).slice(1),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col gap-3 w-full">
              {STATUS_ORDER.map((s) => {
                const count = statusBreakdown[s] || 0;
                const percentage = totalStatusCount ? ((count / totalStatusCount) * 100).toFixed(0) : 0;
                return (
                  <div key={s} className="group flex items-center justify-between gap-3 text-sm p-3 rounded-lg border border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-700 capitalize">{s}</span>
                        <span className="text-xs font-medium text-zinc-400">{count} orders</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-900 text-base">
                        {percentage}%
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${percentage}%`, backgroundColor: STATUS_COLORS[s] }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sales Chart + Top Products */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Revenue Overview</h2>
            <div className="flex gap-1 rounded-lg border border-zinc-200 p-1">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    days === r.days ? 'bg-primary text-white' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-72">
            {sales.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50">
                <p className="text-sm text-zinc-500">No sales data yet for this period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#036bfc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#036bfc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a22" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#71717a" />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'revenue' ? [`৳${Number(value ?? 0).toLocaleString()}`, 'Revenue'] : [String(value ?? ''), 'Orders']
                    }
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#036bfc" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Top sellers */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <FiTrendingUp size={18} className="text-accent" /> Top Products
            </h2>
            <div className="mt-4 space-y-4">
              {topProducts.length === 0 && <p className="text-sm text-zinc-500">No products yet.</p>}
              {topProducts.map((p) => (
                <div key={p._id} className="flex items-center gap-3">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                      <FiPackage size={16} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-medium text-zinc-900">
                      {p.name}
                      {p.isBestSelling && <FiStar size={11} className="shrink-0 fill-accent text-accent" />}
                    </p>
                    <p className="text-xs text-zinc-500">৳{p.price?.toLocaleString()} · stock {p.stock === null ? 'Unlimited' : p.stock}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                    {p.sold || 0} sold
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <FiAlertTriangle size={18} className="text-red-500" /> Restock Needed
            </h2>
            <div className="mt-4 space-y-3">
              {lowStockList.length === 0 && <p className="text-sm text-zinc-500">All products are well stocked. 🎉</p>}
              {lowStockList.map((p) => (
                <Link
                  key={p._id}
                  href={`/dashboard/products/edit/${p.slug}`}
                  className="flex items-center gap-3 rounded-lg p-1 transition hover:bg-zinc-50"
                >
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt={p.name} className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                      <FiPackage size={14} />
                    </div>
                  )}
                  <p className="min-w-0 flex-1 truncate text-sm text-zinc-700">{p.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    {p.stock === 0 ? 'OUT' : `${p.stock} left`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Payment Type</th>
                <th className="px-6 py-3 font-medium">Payment Status</th>
                <th className="px-6 py-3 font-medium">Order Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No orders yet.
                  </td>
                </tr>
              )}
              {recentOrders.map((o) => (
                <tr key={o._id} className="transition hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/orders/${o._id}`} className="font-medium text-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-zinc-700">{o.user?.name || '—'}</td>
                  <td className="px-6 py-4 font-medium text-zinc-900">৳{o.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                      {o.paymentMethod === 'cod' ? 'COD' : o.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={o.paymentStatus} /></td>
                  <td className="px-6 py-4"><StatusBadge status={o.orderStatus} /></td>
                  <td className="px-6 py-4 text-zinc-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
