'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function IntakePage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/intake`,
        { text, title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setText('');
      setTitle('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 bg-white text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40 focus:border-[var(--color-brass)] transition-all';

  const entityLabels: Record<string, string> = {
    people: 'People',
    organizations: 'Organizations',
    dates: 'Dates',
    locations: 'Locations',
    money: 'Amounts',
    misc: 'Other',
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-16 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-sm text-[var(--color-brass)] mb-1">Smart Intake Portal</p>
          <h1 className="font-serif-display text-3xl text-[var(--color-ink)]">New case intake</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] transition-colors">
          ← Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-line)] rounded-xl p-6 space-y-5 shadow-sm">
        <div>
          <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">
            Case title <span className="text-[var(--color-slate)] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Rajesh Kumar vs ABC Textiles"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">Intake description</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type the client's case details here..."
            required
            className={inputClass + ' h-40 resize-none'}
          />
          <p className="mt-1.5 text-xs text-[var(--color-slate)]">
            Names, organizations, dates, locations, and amounts will be extracted automatically.
          </p>
        </div>

        {error && (
          <p className="text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--color-ink)] text-white px-5 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-[var(--color-ink)]/90 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Submit intake'}
        </button>
      </form>

      {result && (
        <div className="mt-6 border border-[var(--color-line)] rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--color-sage)]" />
            <h2 className="font-medium text-[var(--color-ink)]">{result.message}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-[var(--color-slate)]">Case</p>
              <p className="text-[var(--color-ink)] font-medium">{result.case.title}</p>
            </div>
            <div>
              <p className="text-[var(--color-slate)]">Client</p>
              <p className="text-[var(--color-ink)] font-medium">{result.case.client_name}</p>
            </div>
          </div>

          <p className="text-sm font-medium text-[var(--color-ink)] mb-3">Extracted entities</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(result.extracted_entities).map(([key, values]: [string, any]) => {
              const list = Array.isArray(values) ? values : [];
              if (list.length === 0) return null;
              return (
                <div key={key} className="border border-[var(--color-line)] rounded-lg p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-slate)] mb-2">
                    {entityLabels[key] || key}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((v: any, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-[var(--color-paper)] border border-[var(--color-line)] rounded-full px-2.5 py-1 text-[var(--color-ink)]"
                      >
                        {typeof v === 'string' ? v : v.text}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}