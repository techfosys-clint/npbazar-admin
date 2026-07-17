'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CouponForm from '@/components/CouponForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { Coupon } from '@/lib/types';

export default function EditCouponPage() {
  const { id } = useParams<{ id: string }>();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ coupons: Coupon[] }>('/coupons')
      .then((d) => setCoupon(d.coupons.find((c) => c._id === id) || null))
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

  if (!coupon) return <p className="text-center text-zinc-500">Coupon not found.</p>;

  return <CouponForm coupon={coupon} />;
}
