'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StaffForm from '@/components/StaffForm';
import api from '@/lib/api';
import { toastError } from '@/lib/toast';
import type { AdminUser } from '@/lib/types';

export default function EditStaffPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ admins: AdminUser[] }>('/admin')
      .then((d) => setMember(d.admins.find((a) => a.id === id) || null))
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

  if (!member) return <p className="text-center text-zinc-500">Member not found.</p>;
  if (member.isSuperAdmin) {
    return <p className="text-center text-zinc-500">The super admin account cannot be modified.</p>;
  }

  return <StaffForm member={member} />;
}
