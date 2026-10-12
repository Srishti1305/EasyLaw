'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

const CASE_TYPES = [
  { value: 'civil', label: 'Civil' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'family', label: 'Family' },
  { value: 'property', label: 'Property' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'labour', label: 'Labour' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  title: '',
  client_name: '',
  client_phone: '',
  client_address: '',
  client_aadhaar: '',
  opponent_name: '',
  case_type: 'civil',
  text: '',
};

export default function IntakePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Show Aadhaar as 1234 5678 9012 while typing
  const formatAadhaar = (v: string) =>
    v.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/intake`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 bg-white text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40 focus:border-[var(--color-brass)] transition-all';
  const labelClass = 'block mb-1.5 text-sm font-medium text-[var(--color-ink)]';
  const optional = <span className="text-[var(--color-slate)] font-normal"> (optional)</span>;

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client details */}
        <section className="bg-white border border-[var(--color-line)] rounded-xl p-6 space-y-5 shadow-sm">
          <h2 className="font-serif-display text-lg text-[var(--color-ink)]">Client details</h2>

          <div>
            <label className={labelClass}>Client name</label>
            <input
              type="text"
              required
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
              placeholder="Full name as on ID"
              className={inputClass}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Mobile number{optional}</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.client_phone}
                onChange={(e) => set('client_phone', e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Aadhaar number{optional}</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.client_aadhaar}
                onChange={(e) => set('client_aadhaar', formatAadhaar(e.target.value))}
                placeholder="1234 5678 9012"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--color-slate)]">
                Only the last 4 digits are stored.
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Address{optional}</label>
            <textarea
              value={form.client_address}
              onChange={(e) => set('client_address', e.target.value)}
              placeholder="House no., street, city, state, PIN"
              className={inputClass + ' h-20 resize-none'}
            />
          </div>
        </section>

        {/* Case details */}
        <section className="bg-white border border-[var(--color-line)] rounded-xl p-6 space-y-5 shadow-sm">
          <h2 className="font-serif-display text-lg text-[var(--color-ink)]">Case details</h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Opponent's name{optional}</label>
              <input
                type="text"
                value={form.opponent_name}
                onChange={(e) => set('opponent_name', e.target.value)}
                placeholder="Opposite party"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Type of case</label>
              <select
                value={form.case_type}
                onChange={(e) => set('case_type', e.target.value)}
                className={inputClass}
              >
                {CASE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Case title{optional}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Defaults to “Client vs Opponent”"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Case description{optional}</label>
            <textarea
              value={form.text}
              onChange={(e) => set('text', e.target.value)}
              placeholder="Paste or type the client's case details here..."
              className={inputClass + ' h-36 resize-none'}
            />
            <p className="mt-1.5 text-xs text-[var(--color-slate)]">
              Names, organizations, dates, locations, and amounts will be extracted automatically.
            </p>
          </div>
        </section>

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
            <div>
              <p className="text-[var(--color-slate)]">Opponent</p>
              <p className="text-[var(--color-ink)] font-medium">{result.case.opponent_name || '—'}</p>
            </div>
            <div>
              <p className="text-[var(--color-slate)]">Case type</p>
              <p className="text-[var(--color-ink)] font-medium capitalize">{result.case.case_type}</p>
            </div>
            <div>
              <p className="text-[var(--color-slate)]">Mobile</p>
              <p className="text-[var(--color-ink)] font-medium">{result.case.client_phone || '—'}</p>
            </div>
            <div>
              <p className="text-[var(--color-slate)]">Aadhaar</p>
              <p className="text-[var(--color-ink)] font-medium">
                {result.case.client_aadhaar_last4 ? `XXXX XXXX ${result.case.client_aadhaar_last4}` : '—'}
              </p>
            </div>
          </div>

          {Object.values(result.extracted_entities || {}).some(
            (v: any) => Array.isArray(v) && v.length > 0
          ) && (
            <>
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
            </>
          )}
        </div>
      )}
    </main>
  );
}