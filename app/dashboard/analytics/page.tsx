'use client';

import { useEffect, useState } from 'react';
import {
  FiTrendingUp,
  FiUsers,
  FiPackage,
  FiShoppingBag,
  FiPercent,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  FunnelChart,
  Funnel,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type {
  AnalyticsSummary,
  SalesPoint,
  AovPoint,
  SessionsPoint,
  ConversionPoint,
  ChannelSales,
  ProductSales,
  CollectionSales,
  SellThroughItem,
  DeviceBreakdown,
  ReferrerBreakdown,
  LandingPage,
  ConversionFunnel,
} from '@/lib/types';

const RANGE_OPTIONS = [
  { label: 'Today', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

const cardCls =
  'group relative rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-zinc-200 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1';
const fmt = (n: number) => `৳${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PALETTE = ['#036bfc', '#f48721', '#10b981', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50">
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

function EmptySection({ label = 'No data for this date range' }: { label?: string }) {
  return (
    <div className="flex h-56 items-center justify-center">
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(new Date());

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [aov, setAov] = useState<AovPoint[]>([]);
  const [sessions, setSessions] = useState<SessionsPoint[]>([]);
  const [conversion, setConversion] = useState<ConversionPoint[]>([]);
  const [channels, setChannels] = useState<ChannelSales[]>([]);
  const [byProduct, setByProduct] = useState<ProductSales[]>([]);
  const [byCollection, setByCollection] = useState<CollectionSales[]>([]);
  const [sellThrough, setSellThrough] = useState<SellThroughItem[]>([]);
  const [devices, setDevices] = useState<DeviceBreakdown[]>([]);
  const [referrers, setReferrers] = useState<ReferrerBreakdown[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = `?days=${days}`;
    Promise.allSettled([
      api.get<{ summary: AnalyticsSummary }>(`/analytics/summary${q}`),
      api.get<{ data: SalesPoint[] }>(`/analytics/sales-over-time${q}`),
      api.get<{ data: AovPoint[] }>(`/analytics/aov-over-time${q}`),
      api.get<{ data: SessionsPoint[] }>(`/analytics/sessions-over-time${q}`),
      api.get<{ data: ConversionPoint[] }>(`/analytics/conversion-over-time${q}`),
      api.get<{ data: ChannelSales[] }>(`/analytics/by-channel${q}`),
      api.get<{ data: ProductSales[] }>(`/analytics/by-product${q}`),
      api.get<{ data: CollectionSales[] }>(`/analytics/by-collection${q}`),
      api.get<{ data: SellThroughItem[] }>('/analytics/products-sell-through'),
      api.get<{ data: DeviceBreakdown[] }>(`/analytics/device-breakdown${q}`),
      api.get<{ data: ReferrerBreakdown[] }>(`/analytics/referrer-breakdown${q}`),
      api.get<{ data: LandingPage[] }>(`/analytics/landing-pages${q}`),
      api.get<{ funnel: ConversionFunnel }>(`/analytics/funnel${q}`),
    ]).then((results) => {
      const [s, so, ao, se, co, ch, bp, bc, st, dv, rf, lp, fn] = results;
      if (s.status === 'fulfilled') setSummary(s.value.summary);
      else toastError('Could not load the summary');
      if (so.status === 'fulfilled') setSales(so.value.data);
      if (ao.status === 'fulfilled') setAov(ao.value.data);
      if (se.status === 'fulfilled') setSessions(se.value.data);
      if (co.status === 'fulfilled') setConversion(co.value.data);
      if (ch.status === 'fulfilled') setChannels(ch.value.data);
      if (bp.status === 'fulfilled') setByProduct(bp.value.data);
      if (bc.status === 'fulfilled') setByCollection(bc.value.data);
      if (st.status === 'fulfilled') setSellThrough(st.value.data);
      if (dv.status === 'fulfilled') setDevices(dv.value.data);
      if (rf.status === 'fulfilled') setReferrers(rf.value.data);
      if (lp.status === 'fulfilled') setLandingPages(lp.value.data);
      if (fn.status === 'fulfilled') setFunnel(fn.value.funnel);
      setRefreshedAt(new Date());
      setLoading(false);
    });
  }, [days]);

  if (loading && !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  const KPI_CARDS = summary
    ? [
        { label: 'Gross Sales', value: fmt(summary.grossSales), icon: FiTrendingUp, color: 'text-emerald-500 bg-emerald-50' },
        { label: 'Returning Customer Rate', value: `${summary.returningCustomerRate}%`, icon: FiUsers, color: 'text-blue-500 bg-blue-50' },
        { label: 'Orders Fulfilled', value: summary.ordersFulfilled.toLocaleString(), icon: FiPackage, color: 'text-orange-500 bg-orange-50' },
        { label: 'Orders', value: summary.orders.toLocaleString(), icon: FiShoppingBag, color: 'text-purple-500 bg-purple-50' },
      ]
    : [];

  const BREAKDOWN_ROWS = summary
    ? [
        { label: 'Gross sales', value: summary.grossSales },
        { label: 'Discounts', value: -summary.discounts },
        { label: 'Returns', value: -summary.returns },
        { label: 'Net sales', value: summary.netSales, bold: true },
        { label: 'Shipping charges', value: summary.shippingCharges },
        { label: 'Return fees', value: -summary.returnFees },
        { label: 'Taxes', value: summary.taxes },
        { label: 'Total sales', value: summary.totalSales, bold: true, total: true },
      ]
    : [];

  const funnelData = funnel
    ? [
        { name: 'Sessions', value: funnel.sessions, fill: PALETTE[0] },
        { name: 'Added to cart', value: funnel.addedToCart, fill: PALETTE[1] },
        { name: 'Completed checkout', value: funnel.completedCheckout, fill: PALETTE[2] },
      ]
    : [];

  const sellThroughData = sellThrough.slice(0, 6).map((p, i) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    rate: p.sellThroughRate,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">Last refreshed: {refreshedAt.toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-zinc-200 p-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                days === r.days ? 'bg-primary text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((c) => (
          <div key={c.label} className={cardCls}>
            <div className="flex items-start justify-between">
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm font-medium text-zinc-500">{c.label}</p>
                <p className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">{c.value}</p>
              </div>
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${c.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <c.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total sales over time (Area) + breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${cardCls} lg:col-span-2`}>
          <h2 className="text-base font-semibold text-zinc-900">Total sales over time</h2>
          <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">{fmt(summary?.totalSales || 0)}</p>
          <div className="mt-4 h-64">
            {sales.every((s) => s.sales === 0) ? (
              <EmptyChart label="No sales yet in this date range" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#036bfc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#036bfc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a22" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#71717a" />
                  <Tooltip formatter={(v) => [fmt(Number(v)), 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="#036bfc" strokeWidth={2} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Total sales breakdown</h2>
          <div className="space-y-2">
            {BREAKDOWN_ROWS.map((r) => (
              <div
                key={r.label}
                className={`flex justify-between text-sm ${
                  r.total ? 'border-t border-zinc-200 pt-2 font-bold text-zinc-900' : r.bold ? 'font-semibold text-zinc-800' : 'text-zinc-600'
                }`}
              >
                <span>{r.label}</span>
                <span className={r.value < 0 ? 'text-red-500' : ''}>{r.value < 0 ? `-${fmt(Math.abs(r.value))}` : fmt(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions (Bar) + channel (Donut) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${cardCls} flex flex-col`}>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Sessions over time</h2>
            <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">{sessions.reduce((s, p) => s + p.sessions, 0).toLocaleString()}</p>
          </div>
          <div className="mt-6 flex-1 min-h-[240px] w-full">
            {sessions.every((s) => s.sessions === 0) ? (
              <EmptyChart label="No sessions tracked yet — connect the storefront tracking snippet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a22" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#71717a" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#f48721" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Total sales by sales channel</h2>
          {channels.length === 0 || channels.every((c) => c.sales === 0) ? (
            <EmptySection />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channels} dataKey="sales" nameKey="channel" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {channels.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [fmt(Number(v)), 'Sales']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* AOV (Line) + Conversion (Bar) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${cardCls} flex flex-col`}>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Average order value over time</h2>
            <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
              {fmt(aov.length ? aov.reduce((s, p) => s + p.aov, 0) / aov.length : 0)}
            </p>
          </div>
          <div className="mt-6 flex-1 min-h-[240px] w-full">
            {aov.every((a) => a.aov === 0) ? (
              <EmptyChart label="No orders yet in this date range" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aov} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a22" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#71717a" />
                  <Tooltip formatter={(v) => [fmt(Number(v)), 'AOV']} />
                  <Line type="monotone" dataKey="aov" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={`${cardCls} flex flex-col`}>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Conversion rate over time</h2>
            <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
              {conversion.length ? (conversion.reduce((s, p) => s + p.rate, 0) / conversion.length).toFixed(1) : 0}%
            </p>
          </div>
          <div className="mt-6 flex-1 min-h-[240px] w-full">
            {conversion.every((c) => c.rate === 0) ? (
              <EmptyChart label="No sessions tracked yet to compute conversion" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversion} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a22" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#71717a" unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Conversion']} />
                  <Bar dataKey="rate" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* By product (horizontal Bar) + by collection (Donut) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Total sales by product</h2>
          {byProduct.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProduct} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a22" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#71717a" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="#71717a"
                    width={110}
                    tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 16) + '…' : v)}
                  />
                  <Tooltip formatter={(v) => [fmt(Number(v)), 'Sales']} />
                  <Bar dataKey="sales" fill="#036bfc" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Total sales by collection</h2>
          {byCollection.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCollection} dataKey="sales" nameKey="name" outerRadius={90} label={(e) => e.name}>
                    {byCollection.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [fmt(Number(v)), 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Sessions by device (Donut) / referrer (horizontal Bar) / landing page (list) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Sessions by device type</h2>
          {devices.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devices} dataKey="sessions" nameKey="device" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {devices.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Sessions by referrer</h2>
          {referrers.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referrers} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a22" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#71717a" allowDecimals={false} />
                  <YAxis type="category" dataKey="referrer" tick={{ fontSize: 11 }} stroke="#71717a" width={90} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Sessions by landing page</h2>
          {landingPages.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="space-y-3">
              {landingPages.map((l) => (
                <div key={l.path} className="flex items-center justify-between text-sm">
                  <span className="truncate text-zinc-700">{l.path}</span>
                  <span className="font-semibold text-zinc-900">{l.sessions}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sell-through (RadialBar) + conversion funnel (Funnel) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Products by sell-through rate</h2>
          {sellThroughData.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  data={sellThroughData}
                  innerRadius="20%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="rate" cornerRadius={8} label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Sell-through']} />
                  <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={cardCls}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <FiPercent size={18} /> Conversion rate breakdown
          </h2>
          {!funnel || funnel.sessions === 0 ? (
            <EmptySection label="No tracked sessions yet in this date range" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" dataKey="name" fill="#3f3f46" stroke="none" fontSize={12} />
                    <LabelList position="left" dataKey="value" fill="#3f3f46" stroke="none" fontSize={12} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-zinc-400">
        Sales metrics are live from your orders. Session/traffic metrics (sessions, device, referrer, landing page,
        conversion) will populate once the storefront calls{' '}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5">POST /api/analytics/track</code> on each page load.
      </p>
    </div>
  );
}
