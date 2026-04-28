'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FaCalendarAlt,
  FaCheck,
  FaDownload,
  FaGift,
  FaHome,
  FaPaperPlane,
  FaPlus,
  FaRandom,
  FaSearch,
  FaShareAlt,
  FaShieldAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';

interface WinnerByTier {
  id: string;
  prizeName: string;
  prizeAmount: number;
  winners: Array<{
    id: string;
    name: string;
    email?: string;
    drawnAt: string;
  }>;
}

interface ResultsData {
  raffle: {
    id: string;
    title: string;
    drawnAt: string;
    status: string;
  };
  winnersByTier: WinnerByTier[];
  totalWinners: number;
}

interface RaffleParticipant {
  id: string;
  name: string;
  email?: string;
}

interface RaffleDetails {
  participants: RaffleParticipant[];
}

export default function RaffleResults() {
  const params = useParams();
  const raffleId = params.id as string;

  const [results, setResults] = useState<ResultsData | null>(null);
  const [raffleDetails, setRaffleDetails] = useState<RaffleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      const [winnersRes, raffleRes] = await Promise.all([
        fetch(`/api/raffles/${raffleId}/winners`),
        fetch(`/api/raffles/${raffleId}`),
      ]);

      if (!winnersRes.ok || !raffleRes.ok) throw new Error('Failed to fetch results');

      const [winnersData, raffleData] = await Promise.all([
        winnersRes.json(),
        raffleRes.json(),
      ]);

      setResults(winnersData);
      setRaffleDetails(raffleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [raffleId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/raffles/${raffleId}/export`);
      if (!res.ok) throw new Error('Failed to export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raffle-${raffleId}-winners.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setDownloading(false);
    }
  };

  const handleShareResults = async () => {
    setSharingLoading(true);
    try {
      const res = await fetch(`/api/raffles/${raffleId}/share`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to create share link');
      const data = await res.json();
      setShareUrl(data.shareUrl);
      setShowShareModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setSharingLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const handleSendWinnerEmails = async () => {
    setSendingEmails(true);
    try {
      const res = await fetch(`/api/raffles/${raffleId}/send-emails`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to send emails');
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ Sent ${data.emailsSent} winner notification${data.emailsSent !== 1 ? 's' : ''}`);
      } else {
        alert(`⚠️ ${data.message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send emails');
    } finally {
      setSendingEmails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-3xl animate-pulse space-y-4">
          <div className="h-10 w-1/3 rounded bg-slate-100" />
          <div className="h-80 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">
          {error || 'Results not found'}
        </div>
      </div>
    );
  }

  const winnerCards = results.winnersByTier.flatMap((tier, tierIndex) =>
    tier.winners.map((winner, winnerIndex) => ({
      ...winner,
      tierId: tier.id,
      tierName: tier.prizeName,
      prizeAmount: tier.prizeAmount,
      place: tierIndex === 0 ? '1st Place' : tierIndex === 1 ? '2nd Place' : tierIndex === 2 ? '3rd Place' : 'Consolation Prize',
      order: winnerIndex + 1,
    }))
  );
  const participants = raffleDetails?.participants ?? winnerCards.map((winner) => ({
    id: winner.id,
    name: winner.name,
    email: winner.email,
  }));
  const participantRows = participants.slice(0, 5);
  const winnerByParticipant = new Map(winnerCards.map((winner) => [winner.id, winner]));
  const drawnDate = results.raffle.drawnAt ? new Date(results.raffle.drawnAt).toLocaleString() : 'Recently completed';
  const totalPrizes = results.winnersByTier.length;

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

          <div className="flex items-center gap-3">
            <Link href="/" className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:inline-flex">
              <FaHome size={13} />
              Home
            </Link>
            <Link href="/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              <FaPlus size={12} />
              New Raffle
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)]">
        <section className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 px-4 py-10 text-white sm:px-8 lg:px-10">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {[
                ['left-[62%] top-12 bg-white/20', 'h-2 w-2'],
                ['left-[68%] top-24 bg-amber-300/80', 'h-2.5 w-2.5 rotate-45'],
                ['right-[9%] top-16 bg-cyan-300/80', 'h-2 w-2'],
                ['right-[18%] top-28 bg-pink-300/80', 'h-2 w-2 rotate-45'],
              ].map(([position, size], index) => (
                <span key={index} className={`absolute rounded-sm ${position} ${size}`} />
              ))}
            </div>

            <div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Completed
                </span>
                <h1 className="mt-4 text-4xl font-bold tracking-tight">Raffle Results</h1>
                <p className="mt-3 text-lg font-semibold text-blue-50">{results.raffle.title}</p>
                <p className="mt-4 flex items-center gap-2 text-sm text-blue-50">
                  <FaCalendarAlt size={14} />
                  Draw completed on {drawnDate}
                </p>
              </div>

              <div className="hidden h-36 w-36 items-center justify-center rounded-full bg-amber-300 text-amber-700 shadow-[0_18px_45px_rgba(15,23,42,0.25)] lg:flex">
                <FaTrophy size={82} />
              </div>
            </div>
          </div>

          <div className="mx-auto -mt-8 max-w-6xl px-4 pb-10 sm:px-8 lg:px-10">
            <div className="relative grid gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total Participants', value: participants.length, icon: FaUsers, bg: 'bg-purple-50', color: 'text-purple-600' },
                { label: 'Eligible Participants', value: participants.length, icon: FaCheck, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                { label: 'Total Prizes', value: totalPrizes, icon: FaGift, bg: 'bg-purple-50', color: 'text-purple-600' },
                { label: 'Draw Method', value: 'Random', icon: FaRandom, bg: 'bg-blue-50', color: 'text-blue-600' },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div key={stat.label} className="flex items-center gap-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleShareResults}
                disabled={sharingLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
              >
                <FaShareAlt size={13} />
                {sharingLoading ? 'Generating...' : 'Share Results'}
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={downloading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                <FaDownload size={13} />
                {downloading ? 'Downloading...' : 'Download Results'}
              </button>
              <button
                type="button"
                onClick={handleSendWinnerEmails}
                disabled={sendingEmails}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <FaPaperPlane size={13} />
                {sendingEmails ? 'Sending...' : 'Send Emails'}
              </button>
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-950">Winners</h2>
              <p className="mt-1 text-sm text-slate-500">Winners are drawn randomly for each prize tier.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {winnerCards.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 xl:col-span-4">
                    No winners found for this raffle.
                  </div>
                ) : (
                  winnerCards.slice(0, 4).map((winner, index) => (
                    <div key={`${winner.tierId}-${winner.id}-${winner.order}`} className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <FaTrophy size={18} />
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-950">{winner.place}</p>
                      <div className="mx-auto mt-5 flex h-24 w-28 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-center text-white shadow-sm">
                        <span className="text-lg font-bold">₱{Number(winner.prizeAmount).toFixed(0)}</span>
                      </div>
                      <p className="mt-4 text-sm font-bold text-slate-950">{winner.tierName}</p>
                      <span className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-600">
                        {winner.name.slice(0, 2).toUpperCase()}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{winner.name}</p>
                      {winner.email && <p className="mt-1 truncate text-xs text-slate-500">{winner.email}</p>}
                      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">Ticket ID: #{index + 241}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">All Participants</h2>
                  <p className="mt-1 text-sm text-slate-500">{participants.length} total participants</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Search participants..."
                      className="h-10 w-56 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    <FaDownload size={12} />
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Participant</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Entries</th>
                      <th className="px-4 py-3">Ticket ID</th>
                      <th className="px-4 py-3">Joined At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participantRows.map((participant, index) => {
                      const winner = winnerByParticipant.get(participant.id);

                      return (
                        <tr key={participant.id}>
                          <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                                {participant.name.slice(0, 2).toUpperCase()}
                              </span>
                              <span className="font-semibold text-slate-950">{participant.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{participant.email || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${winner ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {winner ? 'Winner' : 'Eligible'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                          <td className="px-4 py-3 text-slate-600">#{index + 241}</td>
                          <td className="px-4 py-3 text-slate-600">Recently added</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Showing {participantRows.length} of {participants.length} participants</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((page) => (
                    <button key={page} type="button" className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold ${page === 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-500'}`}>
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-950">Draw completed successfully!</p>
                  <p className="mt-1 text-sm text-slate-600">Thank you for using Raffle Pro. We hope your giveaway was a success.</p>
                </div>
                <Link href="/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
                  <FaPlus size={12} />
                  Create Another Raffle
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center text-slate-500">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
                <FaShieldAlt size={16} />
                Fair. Random. Transparent.
              </div>
              <p className="mt-2 text-xs">All draws are conducted securely and fairly using a certified random selection process.</p>
            </div>
          </div>
        </section>
      </main>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="share-results-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 id="share-results-title" className="text-lg font-bold text-slate-950">Share Raffle Results</h3>
            <p className="mt-2 text-sm text-slate-500">Share this link to let others view the results.</p>
            <div className="mt-5 flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
