'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    bar_council_number: '',
    firm_name: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitted' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, form);
      setStatus('submitted');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Signup failed');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 bg-white text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40 focus:border-[var(--color-brass)] transition-all';

  if (status === 'submitted') {
    return (
      <main className="min-h-screen grid md:grid-cols-2">
        <BrandPanel />
        <div className="flex items-center justify-center px-6 py-16">
          <div className="max-w-sm text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--color-sage)]/10 flex items-center justify-center mx-auto mb-6">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="var(--color-sage)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-serif-display text-2xl text-[var(--color-ink)] mb-3">
              Application received
            </h1>
            <p className="text-[var(--color-slate)] text-sm leading-relaxed">
              Your account for <strong className="text-[var(--color-ink)]">{form.name}</strong> is under review.
              A firm administrator will verify your bar council details before your dashboard access is activated.
            </p>
            <Link href="/login" className="inline-block mt-6 text-sm text-[var(--color-brass)] font-medium hover:underline">
              Back to log in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <BrandPanel />

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-serif-display text-3xl text-[var(--color-ink)] mb-1">
            Join EasyLaw
          </h1>
          <p className="text-sm text-[var(--color-slate)] mb-8">
            Access is granted after verification of your bar council registration.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">Full name</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">
                Bar council enrollment number
              </label>
              <input
                name="bar_council_number"
                value={form.bar_council_number}
                onChange={handleChange}
                required
                placeholder="e.g. UP/1234/2020"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">Firm name (optional)</label>
              <input name="firm_name" value={form.firm_name} onChange={handleChange} className={inputClass} />
            </div>

            {errorMsg && (
              <p className="text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-ink)] text-white py-2.5 rounded-lg text-sm font-medium
                         hover:bg-[var(--color-ink)]/90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--color-slate)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--color-brass)] font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function BrandPanel() {
  return (
    <div className="hidden md:flex flex-col justify-between bg-[var(--color-ink)] text-white px-14 py-12 relative overflow-hidden">
      <Link href="/" className="font-serif-display text-2xl relative z-10">
        EasyLaw
      </Link>
      <div className="relative z-10">
        <p className="font-serif-display text-3xl leading-snug mb-4">
          One platform for<br />your entire practice.
        </p>
        <p className="text-sm text-white/60 max-w-xs">
          Intake, drafting, contract review, and case tracking — built for
          Indian law firms.
        </p>
      </div>
      <svg viewBox="0 0 400 400" className="absolute -bottom-24 -right-24 w-96 h-96 opacity-[0.07]">
        <circle cx="200" cy="200" r="150" fill="none" stroke="white" strokeWidth="1" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 200 + 70 * Math.cos(angle);
          const y1 = 200 + 70 * Math.sin(angle);
          const x2 = 200 + 150 * Math.cos(angle);
          const y2 = 200 + 150 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1" />;
        })}
      </svg>
    </div>
  );
}