'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-16 border-b border-[var(--color-line)]">
        <span className="font-serif-display text-2xl text-[var(--color-ink)]">EasyLaw</span>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/login" className="text-[var(--color-slate)] hover:text-[var(--color-ink)] transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-[var(--color-ink)] text-white px-4 py-2 rounded hover:bg-[var(--color-ink)]/90 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-12 items-center px-6 py-20 md:px-16">
        <div>
          <p className="text-sm tracking-wide text-[var(--color-brass)] mb-4">
            Built for Indian law firms
          </p>
          <h1 className="font-serif-display text-4xl md:text-5xl text-[var(--color-ink)] leading-tight mb-6">
            AI-powered practice management, made for Indian legal work.
          </h1>
          <p className="text-[var(--color-slate)] text-base leading-relaxed mb-8 max-w-md">
            EasyLaw brings intake, meeting notes, drafting, contract review,
            and case tracking into one platform — built with an
            understanding of Indian legal workflows and terminology.
          </p>
          <div className="flex gap-4">
            <Link
              href="/signup"
              className="bg-[var(--color-ink)] text-white px-6 py-3 rounded text-sm hover:bg-[var(--color-ink)]/90 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="border border-[var(--color-line)] text-[var(--color-ink)] px-6 py-3 rounded text-sm hover:bg-white transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Hero illustration — scales of justice, brass line art */}
        <div className="flex justify-center">
          <svg viewBox="0 0 400 400" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
            <line x1="200" y1="40" x2="200" y2="320" stroke="#A9782F" strokeWidth="3" />
            <line x1="80" y1="90" x2="320" y2="90" stroke="#A9782F" strokeWidth="3" />
            <circle cx="200" cy="60" r="10" fill="#A9782F" />

            {/* Left pan */}
            <line x1="80" y1="90" x2="50" y2="170" stroke="#A9782F" strokeWidth="1.5" />
            <line x1="80" y1="90" x2="110" y2="170" stroke="#A9782F" strokeWidth="1.5" />
            <path d="M 40 170 Q 80 210 120 170" stroke="#A9782F" strokeWidth="3" fill="none" />

            {/* Right pan */}
            <line x1="320" y1="90" x2="290" y2="170" stroke="#A9782F" strokeWidth="1.5" />
            <line x1="320" y1="90" x2="350" y2="170" stroke="#A9782F" strokeWidth="1.5" />
            <path d="M 280 170 Q 320 210 360 170" stroke="#A9782F" strokeWidth="3" fill="none" />

            {/* Base */}
            <line x1="200" y1="320" x2="200" y2="340" stroke="#A9782F" strokeWidth="3" />
            <path d="M 140 340 L 260 340 L 245 365 L 155 365 Z" fill="#A9782F" opacity="0.15" stroke="#A9782F" strokeWidth="2" />

            {/* Ashoka chakra motif, subtle */}
            <circle cx="200" cy="230" r="45" fill="none" stroke="#1C2128" strokeWidth="1" opacity="0.15" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              const x1 = 200 + 20 * Math.cos(angle);
              const y1 = 230 + 20 * Math.sin(angle);
              const x2 = 200 + 45 * Math.cos(angle);
              const y2 = 230 + 45 * Math.sin(angle);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1C2128" strokeWidth="1" opacity="0.15" />
              );
            })}
          </svg>
        </div>
      </section>

      {/* About */}
      <section className="px-6 py-16 md:px-16 border-t border-[var(--color-line)] bg-white/40">
        <div className="max-w-2xl">
          <h2 className="font-serif-display text-2xl text-[var(--color-ink)] mb-4">
            What is EasyLaw?
          </h2>
          <p className="text-[var(--color-slate)] leading-relaxed">
            EasyLaw is a unified LegalTech platform designed for Indian law
            firms — combining client intake, AI meeting transcription,
            document drafting, contract risk analysis, and real-time case
            collaboration in a single dashboard. It also includes a research
            component exploring court judgment prediction using
            transformer models fine-tuned on Indian legal datasets.
          </p>
        </div>
      </section>

      {/* Modules */}
      <section className="px-6 py-16 md:px-16 border-t border-[var(--color-line)]">
        <h2 className="font-serif-display text-2xl text-[var(--color-ink)] mb-10">
          Five modules, one platform
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
          {[
            {
              title: 'Smart Intake Portal',
              desc: 'Automatically extracts client, case, and party details from raw intake text using named-entity recognition.',
            },
            {
              title: 'AI Meeting Notetaker',
              desc: 'Transcribes client and court meetings, then classifies discussion points into summaries and action items.',
            },
            {
              title: 'AI Document Drafting',
              desc: 'Drafts legal documents grounded in your firm\u2019s own precedents using retrieval-augmented generation.',
            },
            {
              title: 'Contract Risk Analyser',
              desc: 'Flags risky or unusual clauses in contracts using a legal-domain language model.',
            },
            {
              title: 'Unified Dashboard',
              desc: 'A live, real-time view of every case, document, and update across your firm.',
            },
          ].map((m) => (
            <div key={m.title}>
              <div className="h-1.5 w-8 bg-[var(--color-brass)] mb-4" />
              <h3 className="font-medium text-[var(--color-ink)] mb-2">{m.title}</h3>
              <p className="text-sm text-[var(--color-slate)] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-16 md:px-16 border-t border-[var(--color-line)] bg-white/40">
        <h2 className="font-serif-display text-2xl text-[var(--color-ink)] mb-2">
          Built by
        </h2>
        <p className="text-sm text-[var(--color-slate)] mb-10">
          Final-year Computer Science Engineering project — United College of
          Engineering and Research (UCER), Prayagraj, affiliated with AKTU, Lucknow.
        </p>
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {['Srishti Yadav', 'Singh Aman Bidyabhushan', 'Sumit Kesarwani', 'Sudhanshu Upadhyay'].map((name) => (
            <div key={name} className="border-t-2 border-[var(--color-brass)] pt-3">
              <p className="text-[var(--color-ink)] font-medium text-sm">{name}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-[var(--color-slate)]">
          Under the supervision of <strong className="text-[var(--color-ink)]">Mr. Manoj Mishra</strong>, Assistant Professor, Dept. of CSE, UCER
        </p>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 md:px-16 border-t border-[var(--color-line)]">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <span className="font-serif-display text-xl text-[var(--color-ink)]">EasyLaw</span>
            <p className="text-sm text-[var(--color-slate)] mt-2 max-w-xs">
              An AI-powered LegalTech platform for Indian law firms.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)] mb-2">Contact us</p>
            <p className="text-sm text-[var(--color-slate)]">United College of Engineering and Research</p>
            <p className="text-sm text-[var(--color-slate)]">Prayagraj, Uttar Pradesh, India</p>
            <p className="text-sm text-[var(--color-slate)] mt-1">easylaw.project@gmail.com</p>
          </div>
        </div>
        <p className="text-xs text-[var(--color-slate)] mt-10">
          © {new Date().getFullYear()} EasyLaw. Final year project, UCER / AKTU.
        </p>
      </footer>
    </main>
  );
}