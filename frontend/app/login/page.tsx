'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      {/* Left panel — brand side */}
      <div className="hidden md:flex flex-col justify-between bg-[var(--color-ink)] text-white px-14 py-12 relative overflow-hidden">
        <Link href="/" className="font-serif-display text-2xl relative z-10">
          EasyLaw
        </Link>

        <div className="relative z-10">
          <p className="font-serif-display text-3xl leading-snug mb-4">
            "Justice delayed is<br />justice denied."
          </p>
          <p className="text-sm text-white/60">
            Practice management built for the pace Indian courts demand.
          </p>
        </div>

        {/* Decorative chakra motif */}
        <svg
          viewBox="0 0 400 400"
          className="absolute -bottom-24 -right-24 w-96 h-96 opacity-[0.07]"
        >
          <circle cx="200" cy="200" r="150" fill="none" stroke="white" strokeWidth="1" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x1 = (200 + 70 * Math.cos(angle)).toFixed(2);
            const y1 = (200 + 70 * Math.sin(angle)).toFixed(2);
            const x2 = (200 + 150 * Math.cos(angle)).toFixed(2);
            const y2 = (200 + 150 * Math.sin(angle)).toFixed(2);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1" />;
         })}
        </svg>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif-display text-3xl text-[var(--color-ink)] mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--color-slate)] mb-8">
            Log in to your EasyLaw dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">
                Email
              </label>
              <input
                type="email"
                required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40 focus:border-[var(--color-brass)]
                           transition-all"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">
                Password
              </label>
              <input
                type="password"
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40 focus:border-[var(--color-brass)]
                           transition-all"
              />
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
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--color-slate)]">
            No account?{' '}
            <Link href="/signup" className="text-[var(--color-brass)] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}