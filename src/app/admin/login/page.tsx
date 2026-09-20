'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Unable to sign in.');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Unable to reach the server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--desk)] px-4 py-12 sm:py-16">
      <div className="w-full max-w-md bg-[var(--paper)] px-6 py-8 sm:px-10 sm:py-10 paper-shadow animate-[paper-in_0.6s_ease]">
        {/* masthead */}
        <div className="flex items-center justify-between gap-4">
          <img
            src="/GEA - logo.png"
            alt="GEA"
            className="h-10 w-auto"
            width={3480}
            height={1588}
          />
          <p className="label text-[var(--muted)]">Internal use</p>
        </div>
        <div className="mt-4 h-px bg-[var(--line-strong)]" role="presentation" />

        {/* heading */}
        <h1 className="mt-8 font-serif text-4xl text-[var(--ink)] balance">Administration</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in to edit products and sections.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 border border-[#c9b0a6] bg-[#f6ece6] px-4 py-3 text-sm text-[#8a2f1b]"
          >
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-[var(--muted)]">Double-check the email and password, then try again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--ink-2)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full bg-transparent border-0 border-b-2 border-[var(--line-strong)] px-0 py-2 text-[var(--ink)] placeholder:text-[var(--muted-2)] transition-colors focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--ink-2)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full bg-transparent border-0 border-b-2 border-[var(--line-strong)] px-0 py-2 text-[var(--ink)] placeholder:text-[var(--muted-2)] transition-colors focus:border-[var(--accent)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--ink)] px-4 py-3 text-sm font-semibold tracking-wide text-[var(--paper)] shadow-sm transition-colors hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-10 flex items-center justify-between">
          <Link
            href="/catalogue"
            className="text-sm font-medium text-[var(--accent)] underline decoration-[var(--line-strong)] underline-offset-4 transition-colors hover:text-[var(--ink)]"
          >
            Return to the catalogue
          </Link>
          <span className="label text-[var(--muted-2)]">Admin</span>
        </div>
        <div className="mt-3 h-px bg-[var(--line)]" role="presentation" />
      </div>
    </main>
  );
}