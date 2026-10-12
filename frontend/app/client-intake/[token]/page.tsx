'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

const CASE_TYPES = [
  { value: 'civil', label: 'Civil' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'family', label: 'Family' },
  { value: 'property', label: 'Property' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'labour', label: 'Labour' },
  { value: 'other', label: 'Other / not sure' },
];

const emptyForm = {
  client_name: '',
  client_phone: '',
  client_address: '',
  client_aadhaar: '',
  opponent_name: '',
  case_type: 'civil',
  text: '',
};

export default function ClientIntakePage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<'checking' | 'invalid' | 'form' | 'done'>('checking');
  const [lawyerName, setLawyerName] = useState('');
  const [invalidMsg, setInvalidMsg] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    axios
      .get(`${API}/api/public/invite/${token}`)
      .then((res) => {
        setLawyerName(res.data.lawyer_name);
        setState('form');
      })
      .catch((err) => {
        setInvalidMsg(err.response?.data?.error || 'This link is not valid.');
        setState('invalid');
      });
  }, [API, token]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const formatAadhaar = (v: string) =>
    v.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/api/public/invite/${token}`, form);
      setState('done');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 bg-white text-base ' +
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40 focus:border-[var(--color-brass)] transition-all';
  const labelClass = 'block mb-1.5 text-sm font-medium text-[var(--color-ink)]';
  const optional = <span className="text-[var(--color-slate)] font-normal"> (optional)</span>;

  return (
    <main className="min-h-screen px-5 py-8 max-w-xl mx-auto">
      <p className="font-serif-display text-2xl text-[var(--color-ink)] mb-1">EasyLaw</p>

      {state === 'checking' && (
        <p className="text-sm text-[var(--color-slate)] mt-8">
          Checking your link… this can take up to a minute the first time.
        </p>
      )}

      {state === 'invalid' && (
        <div className="mt-8 bg-white border border-[var(--color-line)] rounded-xl p-6">
          <h1 className="font-serif-display text-xl text-[var(--color-ink)] mb-2">Link unavailable</h1>
          <p className="text-sm text-[var(--color-slate)]">{invalidMsg}</p>
          <p className="text-sm text-[var(--color-slate)] mt-3">
            Please ask your lawyer to send you a new link.
          </p>
        </div>
      )}

      {state === 'done' && (
        <div className="mt-8 bg-white border border-[var(--color-line)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-sage)]" />
            <h1 className="font-serif-display text-xl text-[var(--color-ink)]">Details submitted</h1>
          </div>
          <p className="text-sm text-[var(--color-slate)]">
            Thank you. Your details have been sent to {lawyerName}. You can close this page.
          </p>
        </div>
      )}

      {state === 'form' && (
        <>
          <h1 className="font-serif-display text-2xl text-[var(--color-ink)] mt-6 mb-1">Your details</h1>
          <p className="text-sm text-[var(--color-slate)] mb-6">
            Please fill in this form for {lawyerName}. It can be submitted only once.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white border border-[var(--color-line)] rounded-xl p-5 space-y-4">
              <div>
                <label className={labelClass}>Your full name</label>
                <input
                  type="text"
                  required
                  value={form.client_name}
                  onChange={(e) => set('client_name', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mobile number{optional}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.client_phone}
                  onChange={(e) => set('client_phone', e.target.value.replace(/\D/g, ''))}
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
                  Only the last 4 digits are saved.
                </p>
              </div>
              <div>
                <label className={labelClass}>Address{optional}</label>
                <textarea
                  value={form.client_address}
                  onChange={(e) => set('client_address', e.target.value)}
                  className={inputClass + ' h-20 resize-none'}
                />
              </div>
            </div>

            <div className="bg-white border border-[var(--color-line)] rounded-xl p-5 space-y-4">
              <div>
                <label className={labelClass}>Opposite party's name{optional}</label>
                <input
                  type="text"
                  value={form.opponent_name}
                  onChange={(e) => set('opponent_name', e.target.value)}
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
              <div>
                <label className={labelClass}>Briefly describe your issue{optional}</label>
                <textarea
                  value={form.text}
                  onChange={(e) => set('text', e.target.value)}
                  className={inputClass + ' h-32 resize-none'}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-ink)] text-white px-5 py-3 rounded-lg text-base font-medium
                         hover:bg-[var(--color-ink)]/90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit details'}
            </button>
          </form>
        </>
      )}
    </main>
  );
}