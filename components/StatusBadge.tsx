'use client';

const STYLES: Record<string, string> = {
  // Order status
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  // Payment status
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  // Generic
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  inactive: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  hidden: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  featured: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  unverified: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  staff: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  cod: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  online: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  // Shipment status (pending/delivered/cancelled reuse the order-status colors above)
  picked_up: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  in_transit: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
  out_for_delivery: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
  returned: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  // Courier account state
  connected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  not_connected: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  sandbox: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        STYLES[status] || STYLES.inactive
      }`}
    >
      {(label || status).replace(/_/g, ' ')}
    </span>
  );
}
