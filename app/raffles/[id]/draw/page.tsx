'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaGift,
  FaShieldAlt,
  FaSpinner,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';

interface Participant {
  id: string;
  name: string;
  email?: string;
}

interface Tier {
  id: string;
  prizeName: string;
  prizeAmount: number;
  winnerCount: number;
}

interface Winner {
  participantId: string;
  tierId: string;
  tierName: string;
  participantName: string;
}

interface PersistedWinner {
  participantId: string;
  participant: {
    name: string;
  };
  tierId: string;
  tier: {
    prizeName: string;
  };
}

interface Raffle {
  id: string;
  title: string;
  participants: Participant[];
  tiers: Tier[];
}

type DrawPhase = 'loading' | 'selecting' | 'spinning' | 'won' | 'complete';

export default function RaffleDrawPage() {
  const params = useParams();
  const router = useRouter();
  const raffleId = params.id as string;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [error, setError] = useState('');
  
  const [phase, setPhase] = useState<DrawPhase>('loading');
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const [winnersThisTier, setWinnersThisTier] = useState(0);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [allWinners, setAllWinners] = useState<Winner[]>([]);
  const [serverWinners, setServerWinners] = useState<Winner[]>([]);
  const [spinningIndices, setSpinningIndices] = useState<number[]>([]);

  const fetchRaffle = useCallback(async () => {
    try {
      const res = await fetch(`/api/raffles/${raffleId}`);
      if (!res.ok) throw new Error('Failed to fetch raffle');
      const data = await res.json();
      setRaffle(data);
      setPhase('selecting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }, [raffleId]);

  useEffect(() => {
    fetchRaffle();
  }, [fetchRaffle]);

  const pickWinner = async () => {
    if (!raffle || phase !== 'selecting') return;

    try {
      let winnerQueue = serverWinners;

      if (winnerQueue.length === 0) {
        setPhase('spinning');
        const res = await fetch(`/api/raffles/${raffleId}/draw`, {
          method: 'POST',
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to save results');
        }

        winnerQueue = data.winners.map((winner: PersistedWinner) => ({
          participantId: winner.participantId,
          participantName: winner.participant.name,
          tierId: winner.tierId,
          tierName: winner.tier.prizeName,
        }));
        setServerWinners(winnerQueue);
      }

      revealWinner(winnerQueue, allWinners.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to draw winners');
      setPhase('selecting');
    }
  };

  const revealWinner = (winnerQueue: Winner[], nextIndex: number) => {
    if (!raffle) return;

    const nextWinner = winnerQueue[nextIndex];
    if (!nextWinner) {
      redirectToResults();
      return;
    }

    const nextTierIndex = raffle.tiers.findIndex((tier) => tier.id === nextWinner.tierId);
    if (nextTierIndex === -1) {
      setError('Draw result references an unknown prize tier');
      setPhase('selecting');
      return;
    }

    const winnersBeforeThisTier = allWinners.filter((winner) => winner.tierId === nextWinner.tierId).length;
    const eligibleIndices = raffle.participants
      .map((participant, idx) => ({ participant, idx }))
      .filter(({ participant }) => !allWinners.some((winner) => winner.participantId === participant.id))
      .map(({ idx }) => idx);
    const targetIndex = raffle.participants.findIndex((participant) => participant.id === nextWinner.participantId);

    setCurrentTierIndex(nextTierIndex);
    setPhase('spinning');

    const spinDuration = 1500;
    const spinInterval = setInterval(() => {
      const randomIndex = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)] ?? targetIndex;
      setSpinningIndices([randomIndex]);
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);
      setSelectedWinnerId(nextWinner.participantId);
      setSpinningIndices([]);
      setPhase('won');
      setAllWinners((prev) => [...prev, nextWinner]);
      setWinnersThisTier(winnersBeforeThisTier + 1);
    }, spinDuration);
  };

  const redirectToResults = () => {
    setPhase('complete');
    setTimeout(() => {
      router.push(`/raffles/${raffleId}/results`);
    }, 1200);
  };

  if (!raffle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="mx-auto mb-4 flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Loading raffle...</p>
        </div>
      </div>
    );
  }

  const currentTier = raffle.tiers[currentTierIndex];
  const totalWinners = raffle.tiers.reduce((sum, tier) => sum + tier.winnerCount, 0);
  const overallProgress = totalWinners > 0 ? (allWinners.length / totalWinners) * 100 : 0;
  const tierProgress = currentTier ? (winnersThisTier / currentTier.winnerCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 text-blue-600">
              <FaGift size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight">Lucky Draw</span>
          </Link>

          <Link
            href={`/raffles/${raffleId}/setup`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
          >
            <FaArrowLeft size={12} />
            Back to Setup
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-52 max-w-7xl">
          {[
            ['left-[4%] top-16 bg-blue-300', 'h-2 w-2'],
            ['left-[14%] top-28 bg-emerald-300', 'h-2 w-2'],
            ['left-[23%] top-8 bg-pink-200', 'h-1.5 w-1.5'],
            ['left-[29%] top-20 bg-purple-300', 'h-3 w-3 rotate-45'],
            ['right-[12%] top-16 bg-amber-200', 'h-3 w-3 rotate-45'],
          ].map(([position, size], index) => (
            <span key={index} className={`absolute rounded-sm ${position} ${size}`} />
          ))}
        </div>

        <section className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FaTrophy size={26} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Live Draw</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{raffle.title}</h1>
          <p className="mt-4 text-sm text-slate-500">Pick winners from your eligible participants using the saved server-side draw order.</p>
        </section>

        {error && (
          <div className="relative mx-auto mt-8 max-w-7xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="relative mx-auto mt-10 grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-medium text-slate-500">Tier {currentTierIndex + 1} of {raffle.tiers.length}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{currentTier.prizeName}</h2>
              <p className="mt-3 text-4xl font-bold text-blue-600">
                ₱{Number(currentTier.prizeAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-slate-500">Tier winners</p>
                  <p className="text-sm font-bold text-slate-950">{winnersThisTier} / {currentTier.winnerCount}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-slate-500">Overall progress</p>
                  <p className="text-sm font-bold text-slate-950">{allWinners.length} / {totalWinners}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              {phase === 'selecting' && (
                <button
                  type="button"
                  onClick={pickWinner}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)] transition hover:bg-blue-700"
                >
                  <FaTrophy size={14} />
                  Pick Winner
                </button>
              )}

              {phase === 'spinning' && (
                <div className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                  <FaSpinner className="animate-spin" size={15} />
                  Picking...
                </div>
              )}

              {phase === 'complete' && (
                <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-center">
                  <p className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-700">
                    <FaCheck size={14} />
                    Complete
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Redirecting to results...</p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                  <FaUsers size={16} />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Total Participants</p>
                  <p className="text-2xl font-bold text-slate-950">{raffle.participants.length}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <h3 className="text-sm font-bold text-slate-950">Prize Tiers</h3>
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {raffle.tiers.map((tier, idx) => (
                  <div
                    key={tier.id}
                    className={`rounded-lg border p-3 transition ${
                      idx === currentTierIndex
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-950">{tier.prizeName}</p>
                    <p className="mt-1 text-xs text-slate-500">₱{Number(tier.prizeAmount).toFixed(0)} • {tier.winnerCount} winner{tier.winnerCount !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Participants</h3>
                  <p className="mt-1 text-sm text-slate-500">{raffle.participants.length} eligible entries in this draw</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {phase === 'spinning' ? 'Drawing' : 'Ready'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                {raffle.participants.map((participant, idx) => {
                  const isSpinning = spinningIndices.includes(idx);
                  const isWinner = allWinners.some((winner) => winner.participantId === participant.id);

                  if (isWinner) return null;

                  return (
                    <div
                      key={participant.id}
                      className={`relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border p-3 text-center transition-all duration-200 ${
                        isSpinning
                          ? 'scale-105 border-amber-300 bg-amber-50 text-amber-900 shadow-lg ring-4 ring-amber-100'
                          : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <span className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${isSpinning ? 'bg-amber-200 text-amber-900' : 'bg-white text-blue-600'}`}>
                        {participant.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="relative z-10 w-full truncate text-xs font-bold sm:text-sm">
                        {participant.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {allWinners.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <h3 className="text-lg font-bold text-slate-950">Winners ({allWinners.length})</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {allWinners.map((winner, idx) => (
                    <div key={`${winner.participantId}-${winner.tierId}`} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">{winner.participantName}</p>
                        <p className="text-xs text-slate-500">{winner.tierName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="mx-auto mt-8 max-w-7xl text-center text-slate-500">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
            <FaShieldAlt size={16} />
            Fair. Random. Transparent.
          </div>
          <p className="mt-2 text-xs">All draws are conducted securely and fairly using a certified random selection process.</p>
        </div>
      </main>

      {phase === 'won' && selectedWinnerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-8 shadow-2xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-blue-50 to-transparent" />
            <div className="relative z-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <FaTrophy size={30} />
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">Winner</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                {raffle.participants.find((participant) => participant.id === selectedWinnerId)?.name}
              </h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-blue-50 p-6">
                  <p className="text-sm text-slate-500">Prize</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{currentTier.prizeName}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-6">
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">₱{Number(currentTier.prizeAmount).toFixed(2)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const isLastWinner = allWinners.length >= serverWinners.length;

                  if (isLastWinner) {
                    redirectToResults();
                  } else {
                    setSelectedWinnerId(null);
                    revealWinner(serverWinners, allWinners.length);
                  }
                }}
                className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)] transition hover:bg-blue-700"
              >
                {allWinners.length >= serverWinners.length ? 'View Results' : 'Next Pick'}
                <FaArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
