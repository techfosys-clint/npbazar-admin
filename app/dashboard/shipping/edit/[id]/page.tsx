'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ShippingZoneForm from '@/components/ShippingZoneForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { ShippingZone } from '@/lib/types';

export default function EditShippingZonePage() {
  const { id } = useParams<{ id: string }>();
  const [zone, setZone] = useState<ShippingZone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ zones: ShippingZone[] }>('/shipping-zones?all=true')
      .then((d) => setZone(d.zones.find((z) => z._id === id) || null))
      .catch((err) => toastError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  if (!zone) return <p className="text-center text-zinc-500">Shipping zone not found.</p>;

  return <ShippingZoneForm zone={zone} />;
}
