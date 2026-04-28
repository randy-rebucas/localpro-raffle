'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaChevronDown,
  FaGift,
  FaHome,
  FaList,
  FaPlus,
  FaShareAlt,
  FaShieldAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';

interface Raffle {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  drawnAt?: string;
  _count: {
    participants: number;
    winners: number;
  };
}

export default function RafflePage() {
  const params = useParams();
  const raffleId = params.id as string;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  const fetchRaffle = useCallback(async () => {
    try {
      const res = await fetch(`/api/raffles/${raffleId}`);
      if (!res.ok) throw new Error('Failed to fetch raffle');
      const data = await res.json();
      setRaffle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [raffleId]);

  useEffect(() => {
    fetchRaffle();
  }, [fetchRaffle]);

  const handleShare = async () => {
    setShareLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/raffles/${raffleId}/share`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to create share link');

      const data = await res.json();
      await navigator.clipboard.writeText(data.shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share raffle');
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-5xl animate-pulse space-y-4">
          <div className="h-8 w-1/4 rounded bg-slate-100" />
          <div className="h-96 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-flex text-blue-600 hover:text-blue-700">
          Back to Raffles
        </Link>
        <div className="rounded-lg bg-red-50 p-6 text-center text-red-600">
          {error || 'Raffle not found'}
        </div>
      </div>
    );
  }

  const getActionButtons = () => {
    const primaryLinkClass = 'inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-blue-600 px-7 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700';
    const successLinkClass = 'inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-emerald-600 px-7 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700';

    switch (raffle.status) {
      case 'DRAFT':
        return (
          <Link href={`/raffles/${raffleId}/setup`} className={primaryLinkClass}>
            Setup & Configure
            <FaArrowRight size={13} />
          </Link>
        );
      case 'ACTIVE':
        return (
          <Link href={`/raffles/${raffleId}/setup`} className={primaryLinkClass}>
            Manage & Draw
            <FaArrowRight size={13} />
          </Link>
        );
      case 'DRAWN':
        return (
          <Link href={`/raffles/${raffleId}/results`} className={successLinkClass}>
            <FaTrophy size={14} />
            View Results
            <FaArrowRight size={13} />
          </Link>
        );
    }
  };

  const displayStatus = raffle.status.charAt(0) + raffle.status.slice(1).toLowerCase();
  const createdDate = new Date(raffle.createdAt).toLocaleDateString('en-GB');
  const drawnDateTime = raffle.drawnAt
    ? new Date(raffle.drawnAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-sm">
              <FaGift size={17} />
            </span>
            <span className="text-lg font-bold tracking-tight">Raffle Pro</span>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/" className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:inline-flex">
              <FaHome size={13} />
              Home
            </Link>
            <Link href="/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              <FaPlus size={12} />
              New Raffle
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-sm font-bold text-purple-600">R</span>
              <span className="text-sm font-medium text-slate-700">Randy Rebucas</span>
              <FaChevronDown size={10} className="text-slate-500" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <FaArrowLeft size={12} />
            Back to Raffles
          </Link>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-8 py-10 sm:px-10">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-70">
                {[
                  ['right-[12%] top-12 bg-purple-300', 'h-3 w-3 rotate-45'],
                  ['right-[20%] top-24 bg-blue-300', 'h-2 w-2'],
                  ['right-[32%] top-16 bg-amber-200', 'h-2.5 w-2.5 rotate-45'],
                  ['right-[8%] bottom-14 bg-emerald-200', 'h-2 w-2'],
                ].map(([position, size], index) => (
                  <span key={index} className={`absolute rounded-sm ${position} ${size}`} />
                ))}
                <div className="absolute -right-12 bottom-0 h-44 w-44 rounded-3xl bg-white/40" />
              </div>

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-8">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-cyan-200 via-blue-300 to-amber-200 shadow-sm">
                    <div className="absolute inset-x-0 bottom-0 h-9 bg-amber-100" />
                    <div className="absolute bottom-8 left-2 h-7 w-20 rounded-full bg-cyan-300/70" />
                    <div className="absolute bottom-9 right-5 h-8 w-1.5 -rotate-12 rounded-full bg-amber-700" />
                    <div className="absolute bottom-[3.75rem] right-2 h-5 w-9 -rotate-12 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-950">{raffle.title}</h1>
                    {raffle.description && <p className="mt-3 text-base text-slate-600">{raffle.description}</p>}
                  </div>
                </div>

                <span className={`self-start rounded-full px-4 py-2 text-sm font-bold ${
                  raffle.status === 'DRAWN'
                    ? 'bg-emerald-100 text-emerald-700'
                    : raffle.status === 'ACTIVE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                }`}
                >
                  {displayStatus}
                </span>
              </div>
            </div>

            <div className="px-8 py-8 sm:px-10">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600">
                    <FaCalendarAlt size={17} />
                  </span>
                  <p className="mt-4 text-sm text-slate-600">Created</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">{createdDate}</p>
                </div>

                <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-purple-600">
                    <FaUsers size={17} />
                  </span>
                  <p className="mt-4 text-sm text-slate-600">Participants</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600">{raffle._count.participants}</p>
                  <p className="mt-3 text-sm text-slate-500">{raffle._count.participants} total participants</p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-600">
                    <FaTrophy size={17} />
                  </span>
                  <p className="mt-4 text-sm text-slate-600">Winners Drawn</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">{raffle._count.winners}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    {drawnDateTime ? `on ${drawnDateTime}` : 'Not drawn yet'}
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-4">
                    {getActionButtons()}
                    {raffle.status !== 'DRAFT' && (
                      <Link
                        href={`/raffles/${raffleId}/setup`}
                        className="inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FaList size={14} />
                        View Details
                      </Link>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
                  >
                    <FaShareAlt size={14} />
                    {shareLoading ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 text-center text-slate-500">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
              <FaShieldAlt size={16} />
              Fair. Random. Transparent.
            </div>
            <p className="mt-2 text-sm">All draws are conducted securely and fairly using a certified random selection process.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
