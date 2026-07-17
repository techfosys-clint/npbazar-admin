'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BannerForm from '@/components/BannerForm';
import type { BannerPlacement } from '@/lib/types';

function NewBannerInner() {
  const params = useSearchParams();
  const placement = (params.get('placement') as BannerPlacement) || undefined;
  return <BannerForm defaultPlacement={placement} />;
}

export default function NewBannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
        </div>
      }
    >
      <NewBannerInner />
    </Suspense>
  );
}
