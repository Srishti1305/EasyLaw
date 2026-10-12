'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

type CaseOption = { id: string; title: string };

export default function NotetakerPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caseId, setCaseId] = useState('');
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/cases?view=mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCases(res.data))
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an audio file');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      if (caseId) formData.append('case_id', caseId);

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/notetaker/transcribe`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    'action item': 'Action items',
    'decision made': 'Decisions made',
    'general discussion': 'General discussion',
    'important date or deadline': 'Important dates',
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-16 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-sm text-[var(--color-brass)] mb-1">AI Meeting Notetaker</p>
          <h1 className="font-serif-display text-3xl text-[var(--color-ink)]">New meeting recording</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-[var(--color-slate)] hover:text-[var(--color-ink)] transition-colors">
          ← Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-line)] rounded-xl p-6 space-y-5 shadow-sm">
        <div>
          <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">
            Link to case <span className="text-[var(--color-slate)] font-normal">(optional)</span>
          </label>
          <select
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            className="w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 bg-white text-sm"
          >
            <option value="">— No case —</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium text-[var(--color-ink)]">Meeting audio</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-[var(--color-line)] rounded-lg px-3.5 py-2.5 bg-white text-sm"
          />
          <p className="mt-1.5 text-xs text-[var(--color-slate)]">
            Upload a recorded meeting. It will be transcribed and sorted into action items, decisions, and dates.
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
          {loading ? 'Transcribing...' : 'Upload and transcribe'}
        </button>
      </form>

      {result && (
        <div className="mt-6 border border-[var(--color-line)] rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--color-sage)]" />
            <h2 className="font-medium text-[var(--color-ink)]">{result.message}</h2>
            {result.new_case && (
            <p className="text-sm text-[var(--color-slate)] mb-4">
              New case created: <span className="text-[var(--color-ink)] font-medium">{result.new_case.title}</span>
            </p>
            )}
          </div>

          <p className="text-sm font-medium text-[var(--color-ink)] mb-1">Transcript</p>
          <p className="text-sm text-[var(--color-slate)] bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg p-3 mb-6">
            {result.meeting_note.transcript}
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(result.classified_breakdown).map(([key, values]: [string, any]) => {
              const list = Array.isArray(values) ? values : [];
              if (list.length === 0) return null;
              return (
                <div key={key} className="border border-[var(--color-line)] rounded-lg p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-slate)] mb-2">
                    {categoryLabels[key] || key}
                  </p>
                  <ul className="space-y-1.5">
                    {list.map((v: string, i: number) => (
                      <li key={i} className="text-sm text-[var(--color-ink)]">• {v}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}