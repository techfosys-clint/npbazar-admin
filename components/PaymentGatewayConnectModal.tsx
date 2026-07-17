'use client';

import { useState } from 'react';
import { FiEye, FiEyeOff, FiCopy } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import Modal from '@/components/Modal';
import type { PaymentGatewayAccount, PaymentProviderDef } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-50';
const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

interface Props {
  open: boolean;
  onClose: () => void;
  provider: PaymentProviderDef;
  account?: PaymentGatewayAccount;
  onSaved: () => void;
}

export default function PaymentGatewayConnectModal({ open, onClose, provider, account, onSaved }: Props) {
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>(account?.environment || 'sandbox');
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = provider.credentialFields.find((f) => !values[f.key]?.trim());
    if (missing) {
      toastError(`Please fill in ${missing.label}`);
      return;
    }
    setSaving(true);
    try {
      if (account) {
        await api.patch(`/payment-gateways/accounts/${account._id}`, { environment, credentials: values });
        toastSuccess('Payment gateway updated');
      } else {
        await api.post('/payment-gateways/accounts', { provider: provider.key, environment, credentials: values });
        toastSuccess('Payment gateway connected');
      }
      onSaved();
      onClose();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const copyIpnUrl = () => {
    if (!account?.ipnUrl) return;
    navigator.clipboard.writeText(account.ipnUrl);
    toastSuccess('IPN URL copied');
  };

  return (
    <Modal open={open} title={`${account ? 'Edit' : 'Connect'} ${provider.label}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {account && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            Re-enter every credential field below to update this connection — saving replaces all of them, it doesn&apos;t merge.
          </p>
        )}

        <div>
          <label className={labelCls}>Environment</label>
          <select value={environment} onChange={(e) => setEnvironment(e.target.value as 'sandbox' | 'live')} className={inputCls}>
            <option value="sandbox">Sandbox (testing)</option>
            <option value="live">Live</option>
          </select>
        </div>

        {provider.credentialFields.map((field) => (
          <div key={field.key}>
            <label className={labelCls}>{field.label}</label>
            {field.secret ? (
              <div className="relative">
                <input
                  type={showSecret[field.key] ? 'text' : 'password'}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret({ ...showSecret, [field.key]: !showSecret[field.key] })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  {showSecret[field.key] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={values[field.key] || ''}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                className={inputCls}
              />
            )}
          </div>
        ))}

        {account && (
          <div>
            <label className={labelCls}>IPN URL</label>
            <div className="flex items-center gap-2">
              <input readOnly value={account.ipnUrl} className={`${inputCls} bg-zinc-50 dark:bg-zinc-950`} />
              <button
                type="button"
                onClick={copyIpnUrl}
                className="shrink-0 rounded-xl border border-zinc-200 p-2.5 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <FiCopy size={16} />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Paste this into {provider.label}&apos;s merchant portal as the IPN/webhook URL to receive payment confirmations.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-70"
        >
          {saving ? 'Saving...' : account ? 'Update Connection' : 'Connect'}
        </button>
      </form>
    </Modal>
  );
}
