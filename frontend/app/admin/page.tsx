'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

type PendingUser = {
  id: string;
  name: string;
  email: string;
  bar_council_number: string;
  firm_name: string;
  created_at: string;
};

export default function AdminPanel() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/pending`, getAuthHeader());
      setPending(res.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setAuthorized(true);
    fetchPending();
  }, [router]);

  const handleDecision = async (id: string, decision: 'verified' | 'rejected') => {
    let reason = '';
    if (decision === 'rejected') {
      reason = prompt('Reason for rejection (optional):') || 'Not specified';
    }
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/${id}`,
      { decision, reason },
      getAuthHeader()
    );
    fetchPending();
  };

  if (!authorized) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[var(--color-slate)]">Checking access...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <h1 className="font-serif-display text-3xl text-[var(--color-ink)] mb-2">
        Verification queue
      </h1>
      <p className="text-sm text-[var(--color-slate)] mb-8">
        Confirm each lawyer's bar council registration before granting dashboard access.
      </p>

      {loading ? (
        <p className="text-sm text-[var(--color-slate)]">Loading...</p>
      ) : pending.length === 0 ? (
        <p className="text-sm text-[var(--color-slate)]">No pending applications.</p>
      ) : (
        <div className="space-y-4">
          {pending.map((u) => (
            <div key={u.id} className="border border-[var(--color-line)] rounded p-5 flex items-center justify-between bg-white">
              <div>
                <p className="font-medium text-[var(--color-ink)]">{u.name}</p>
                <p className="text-sm text-[var(--color-slate)]">{u.email}</p>
                <p className="text-sm text-[var(--color-slate)]">
                  Bar Council No: {u.bar_council_number} {u.firm_name && `· ${u.firm_name}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDecision(u.id, 'verified')}
                  className="px-4 py-2 rounded text-sm text-white bg-[var(--color-sage)]"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(u.id, 'rejected')}
                  className="px-4 py-2 rounded text-sm text-white bg-[var(--color-rust)]"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}