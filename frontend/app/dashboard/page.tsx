'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { io } from 'socket.io-client';

type CaseRow = {
  id: string;
  title: string;
  client_name: string;
  case_type: string;
  status: string;
  created_at: string;
  document_count: number;
  lawyer_name?: string;
};

type Stats = {
  total_cases: number;
  total_documents: number;
  open_cases: number;
};

type MeetingNote = {
  id: string;
  case_title: string | null;
  summary: string;
  created_at: string;
};

const statusStyle: Record<string, { dot: string; label: string }> = {
  open: { dot: 'bg-[var(--color-sage)]', label: 'Open' },
  closed: { dot: 'bg-[var(--color-slate)]', label: 'Closed' },
  flagged: { dot: 'bg-[var(--color-rust)]', label: 'Flagged' },
};


export default function Dashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'mine' | 'all'>('mine');
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);

  // Auth check + figure out if this user is an admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      try {
        setIsAdmin(JSON.parse(userStr).role === 'admin');
      } catch {
        setIsAdmin(false);
      }
    }
  }, [router]);

  // Fetch cases + stats — re-runs whenever viewMode changes (My cases / Firm-wide)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [casesRes, statsRes, meetingsRes] = await Promise.all([
  axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/cases?view=${viewMode}`, { headers }),
  axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stats?view=${viewMode}`, { headers }),
  axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notetaker/notes?view=${viewMode}`, { headers }),
]);
setCases(casesRes.data);
setStats(statsRes.data);
setMeetings(meetingsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [viewMode]);

  // Live updates via Socket.io
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL);

    socket.on('new_case', (payload) => {
      // Only prepend live if it matches what this view would show
      // (simplest approach: just refetch cleanly instead of guessing)
      setCases((prev) => [{ ...payload.case, document_count: 1 }, ...prev]);
      setStats((prev) =>
        prev
          ? {
              total_cases: prev.total_cases + 1,
              open_cases: prev.open_cases + 1,
              total_documents: prev.total_documents + 1,
            }
          : prev
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      {/* Header */}
      <div className="mb-6 flex items-baseline justify-between border-b border-[var(--color-line)] pb-6">
        <div>
          <h1 className="font-serif-display text-3xl text-[var(--color-ink)]">
            EasyLaw
          </h1>
          <p className="mt-1 text-sm text-[var(--color-slate)]">
            Case register —{' '}
            {new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {isAdmin && (
            <a
              href="/admin"
              className="text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors"
            >
              Admin
            </a>
          )}
          <a
            href="/intake"
            className="text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors"
          >
            New intake
          </a>
         
          <a
            href="/notetaker"
            className="text-sm text-[var(--color-brass)] hover:text-[var(--color-brass-light)] transition-colors"
          >
            New meeting
          </a>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      {/* View toggle — admin only */}
      {isAdmin && (
        <div className="mb-6 flex gap-4 text-sm">
          <button
            onClick={() => setViewMode('mine')}
            className={
              viewMode === 'mine'
                ? 'text-[var(--color-ink)] font-medium'
                : 'text-[var(--color-slate)] hover:text-[var(--color-ink)]'
            }
          >
            My cases
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={
              viewMode === 'all'
                ? 'text-[var(--color-ink)] font-medium'
                : 'text-[var(--color-slate)] hover:text-[var(--color-ink)]'
            }
          >
            Firm-wide
          </button>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="mb-12 grid grid-cols-3 gap-8 border-b border-[var(--color-line)] pb-8">
          <div>
            <div className="font-serif-display text-4xl text-[var(--color-ink)]">
              {stats.total_cases}
            </div>
            <div className="mt-1 text-sm text-[var(--color-slate)]">Total cases</div>
          </div>
          <div>
            <div className="font-serif-display text-4xl text-[var(--color-ink)]">
              {stats.open_cases}
            </div>
            <div className="mt-1 text-sm text-[var(--color-slate)]">Open</div>
          </div>
          <div>
            <div className="font-serif-display text-4xl text-[var(--color-ink)]">
              {stats.total_documents}
            </div>
            <div className="mt-1 text-sm text-[var(--color-slate)]">Documents on file</div>
          </div>
        </div>
      )}

      {/* Case register table */}
      <div>
        <h2 className="font-serif-display text-xl text-[var(--color-ink)] mb-4">
          Cases
        </h2>

        {loading ? (
          <p className="text-[var(--color-slate)] text-sm">Loading register...</p>
        ) : cases.length === 0 ? (
          <p className="text-[var(--color-slate)] text-sm">
            No cases yet. Submit an intake to see it appear here.
          </p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-ink)] text-sm text-[var(--color-slate)]">
                <th className="pb-3 font-medium">Case</th>
                <th className="pb-3 font-medium">Client</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Docs</th>
                <th className="pb-3 font-medium">Filed</th>
                {viewMode === 'all' && <th className="pb-3 font-medium">Lawyer</th>}
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const status = statusStyle[c.status] || statusStyle.open;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--color-line)] hover:bg-white/60 transition-colors"
                  >
                    <td className="py-4 pr-4 text-[var(--color-ink)]">{c.title}</td>
                    <td className="py-4 pr-4 text-[var(--color-slate)]">{c.client_name}</td>
                    <td className="py-4 pr-4 text-[var(--color-slate)] capitalize">{c.case_type}</td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center gap-2 text-sm text-[var(--color-ink)]">
                        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-[var(--color-slate)]">{c.document_count}</td>
                    <td className="py-4 pr-4 text-[var(--color-slate)]">{formatDate(c.created_at)}</td>
                    {viewMode === 'all' && (
                      <td className="py-4 pr-4 text-[var(--color-slate)]">{c.lawyer_name || '—'}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Recent meetings */}
<div className="mt-12">
  <h2 className="font-serif-display text-xl text-[var(--color-ink)] mb-4">
    Recent meetings
  </h2>

  {meetings.length === 0 ? (
    <p className="text-[var(--color-slate)] text-sm">
      No meeting recordings yet. Use "New meeting" to transcribe one.
    </p>
  ) : (
    <div className="space-y-3">
      {meetings.map((m) => (
        <div
          key={m.id}
          className="border border-[var(--color-line)] rounded-lg p-4 bg-white"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-[var(--color-ink)]">
              {m.case_title || 'Unlinked meeting'}
            </p>
            <p className="text-xs text-[var(--color-slate)]">{formatDate(m.created_at)}</p>
          </div>
          <p className="text-sm text-[var(--color-slate)]">{m.summary}</p>
        </div>
      ))}
    </div>
  )}
</div>

    </main>
  );
}