'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import api from '@/lib/api';
import { toastSuccess, toastError, confirmDialog } from '@/lib/toast';
import StatusBadge from '@/components/StatusBadge';
import PaymentGatewayConnectModal from '@/components/PaymentGatewayConnectModal';
import type { PaymentGatewayAccount, PaymentProviderDef } from '@/lib/types';

const cardCls = 'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50';

export default function PaymentGatewaysPage() {
  const [providers, setProviders] = useState<PaymentProviderDef[]>([]);
  const [accounts, setAccounts] = useState<PaymentGatewayAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalProvider, setModalProvider] = useState<PaymentProviderDef | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        api.get<{ providers: PaymentProviderDef[] }>('/payment-gateways/providers'),
        api.get<{ accounts: PaymentGatewayAccount[] }>('/payment-gateways/accounts'),
      ]);
      setProviders(p.providers);
      setAccounts(a.accounts);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const accountFor = (providerKey: string) => accounts.find((a) => a.provider === providerKey);

  const handleTest = async (account: PaymentGatewayAccount) => {
    setTestingId(account._id);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/payment-gateways/accounts/${account._id}/test`);
      if (res.success) toastSuccess(res.message);
      else toastError(res.message);
      fetchAll();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (account: PaymentGatewayAccount) => {
    try {
      await api.patch(`/payment-gateways/accounts/${account._id}`, { isActive: !account.isActive });
      toastSuccess(account.isActive ? 'Hidden from checkout' : 'Now visible at checkout');
      fetchAll();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const handleDisconnect = async (account: PaymentGatewayAccount) => {
    if (!(await confirmDialog('Disconnect this payment gateway?', 'You can reconnect it later, but you\'ll need to re-enter credentials.', 'Yes, disconnect'))) return;
    try {
      await api.del(`/payment-gateways/accounts/${account._id}`);
      toastSuccess('Payment gateway disconnected');
      fetchAll();
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Payment Gateways</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connect bKash, Nagad, EPS, and SSLCommerz so customers can pay online at checkout — turn any of them on or off without visiting each gateway&apos;s dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {providers.map((provider) => {
          const account = accountFor(provider.key);
          const connected = !!account?.hasCredentials;
          return (
            <div key={provider.key} className={cardCls}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FiCreditCard size={20} />
                </div>
              </div>

              <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">{provider.label}</h2>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusBadge status={connected ? 'connected' : 'not_connected'} />
                {connected && <StatusBadge status={account!.environment} />}
                {connected && (
                  <StatusBadge status={account!.isActive ? 'active' : 'inactive'} label={account!.isActive ? 'Live at checkout' : 'Hidden'} />
                )}
              </div>

              {account?.lastVerifyMessage && (
                <p className="mt-2 truncate text-xs text-zinc-400" title={account.lastVerifyMessage}>
                  {account.lastVerifyMessage}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => setModalProvider(provider)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {connected ? 'Edit Connection' : 'Connect'}
                </button>

                {connected && (
                  <>
                    <button
                      onClick={() => handleTest(account!)}
                      disabled={testingId === account!._id}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <FiCheckCircle size={13} /> {testingId === account!._id ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={() => handleToggleActive(account!)}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {account!.isActive ? 'Hide from Checkout' : 'Show at Checkout'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(account!)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalProvider && (
        <PaymentGatewayConnectModal
          open={!!modalProvider}
          onClose={() => setModalProvider(null)}
          provider={modalProvider}
          account={accountFor(modalProvider.key)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
