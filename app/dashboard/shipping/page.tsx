'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiSettings } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import type { ShippingZone, StoreSettings } from '@/lib/types';

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [z, s] = await Promise.all([
        api.get<{ zones: ShippingZone[] }>('/shipping-zones?all=true'),
        api.get<{ settings: StoreSettings }>('/settings'),
      ]);
      setZones(z.zones);
      setSettings(s.settings);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (z: ShippingZone) => {
    if (!(await confirmDialog(`Delete the "${z.name}" zone?`))) return;
    try {
      await api.del(`/shipping-zones/${z._id}`);
      toastSuccess('Shipping zone deleted');
      fetchAll();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Shipping Zones</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Set a different shipping cost and free-shipping threshold for each area. Matched by the city the
            customer enters at checkout.
          </p>
        </div>
        <Link
          href="/dashboard/shipping/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <FiPlus size={16} /> Add Zone
        </Link>
      </div>

      {/* Default fallback notice */}
      {settings && (
        <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
          <FiSettings size={18} className="mt-0.5 shrink-0 text-accent" />
          <div className="flex-1 text-sm text-zinc-700">
            <p>
              <strong>Default (other areas):</strong> ৳{settings.shippingCost.toLocaleString()} shipping
              {settings.freeShippingThreshold > 0 && (
                <> · free above ৳{settings.freeShippingThreshold.toLocaleString()}</>
              )}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Any city without a specific zone below uses this default. Change it in{' '}
              <Link href="/dashboard/settings" className="font-medium text-primary hover:underline">
                Settings
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
          </div>
        ) : zones.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-zinc-400">
            <FiMapPin size={36} />
            <p className="text-sm font-medium">No area-specific zones yet — every order uses the default above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Zone</th>
                  <th className="px-6 py-3 font-medium">Area / City</th>
                  <th className="px-6 py-3 font-medium">Shipping Cost</th>
                  <th className="px-6 py-3 font-medium">Free Shipping Above</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {zones.map((z) => (
                  <tr key={z._id} className="transition hover:bg-zinc-50">
                    <td className="px-6 py-4 font-medium text-zinc-900">{z.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <FiMapPin size={11} /> {z.city}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900">৳{z.shippingCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-zinc-600">
                      {z.freeShippingThreshold > 0 ? `৳${z.freeShippingThreshold.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={z.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/shipping/edit/${z._id}`} className="rounded-lg p-2 text-zinc-500 transition hover:bg-blue-50 hover:text-primary">
                          <FiEdit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(z)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
