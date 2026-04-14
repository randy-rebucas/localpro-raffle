'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [phase, setPhase] = useState<DrawPhase>('loading');
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const [winnersThisTier, setWinnersThisTier] = useState(0);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [allWinners, setAllWinners] = useState<Winner[]>([]);
  const [spinningIndices, setSpinningIndices] = useState<number[]>([]);

  useEffect(() => {
    fetchRaffle();
  }, [raffleId]);

  const fetchRaffle = async () => {
    try {
      const res = await fetch(`/api/raffles/${raffleId}`);
      if (!res.ok) throw new Error('Failed to fetch raffle');
      const data = await res.json();
      setRaffle(data);
      setPhase('selecting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const pickWinner = async () => {
    if (!raffle) return;

    const currentTier = raffle.tiers[currentTierIndex];
    
    setPhase('spinning');

    // Get list of eligible participants (not already selected in this tier)
    const eligibleIndices = raffle.participants
      .map((_, idx) => idx)
      .filter(idx => !allWinners.some(w => 
        w.participantId === raffle.participants[idx].id && 
        w.tierId === currentTier.id
      ));

    if (eligibleIndices.length === 0) {
      moveToNextTier();
      return;
    }

    // Animate spinning with simple highlight
    const spinDuration = 1500;
    const spinInterval = setInterval(() => {
      setSpinningIndices([
        eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)]
      ]);
    }, 100);

    // Select winner after spin
    setTimeout(() => {
      clearInterval(spinInterval);
      const winnerIdx = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
      const winner = raffle.participants[winnerIdx];

      setSelectedWinnerId(winner.id);
      setSpinningIndices([]);
      setPhase('won');

      // Add to winners list
      const newWinner: Winner = {
        participantId: winner.id,
        tierId: currentTier.id,
        tierName: currentTier.prizeName,
        participantName: winner.name,
      };
      setAllWinners([...allWinners, newWinner]);
      setWinnersThisTier(winnersThisTier + 1);
    }, spinDuration);
  };

  const moveToNextTier = async () => {
    if (!raffle) return;

    if (currentTierIndex >= raffle.tiers.length - 1) {
      // All tiers complete - save to database
      submitDrawResults();
    } else {
      setCurrentTierIndex(currentTierIndex + 1);
      setWinnersThisTier(0);
      setSelectedWinnerId(null);
      setPhase('selecting');
    }
  };

  const submitDrawResults = async () => {
    setPhase('complete');
    try {
      const res = await fetch(`/api/raffles/${raffleId}/draw`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save results');
      }

      // Redirect to results after delay
      setTimeout(() => {
        router.push(`/raffles/${raffleId}/results`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save results');
      setPhase('selecting');
    }
  };

  if (!raffle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading raffle...</p>
        </div>
      </div>
    );
  }

  const currentTier = raffle.tiers[currentTierIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <Link href={`/raffles/${raffleId}`} className="text-blue-100 hover:text-white transition">
            ← Back
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center flex-1">{raffle.title}</h1>
          <div className="w-12"></div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Controls & Progress */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tier Card */}
          <div className="bg-white bg-opacity-95 rounded-2xl p-6 shadow-xl">
            <p className="text-gray-600 text-sm font-medium mb-2">Tier {currentTierIndex + 1} of {raffle.tiers.length}</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{currentTier.prizeName}</h2>
            <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-4">
              ₱{Number(currentTier.prizeAmount).toFixed(2)}
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Winners</p>
                <p className="text-lg font-bold text-gray-900">{winnersThisTier} / {currentTier.winnerCount}</p>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${(winnersThisTier / currentTier.winnerCount) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-6">
              <p className="text-xs text-gray-600 mb-2">Overall Progress</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                  style={{
                    width: `${((currentTierIndex + winnersThisTier / currentTier.winnerCount) / raffle.tiers.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Action Button */}
            {phase === 'selecting' && (
              <Button
                onClick={pickWinner}
                width="full"
                size="lg"
                variant="warning"
              >
                🎲 Pick Winner
              </Button>
            )}

            {phase === 'spinning' && (
              <div className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold text-lg text-center animate-pulse">
                ⏳ Picking...
              </div>
            )}

            {phase === 'complete' && (
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 mb-2">✓ Complete!</p>
                <p className="text-sm text-gray-600">Redirecting...</p>
              </div>
            )}
          </div>

          {/* Participants Count */}
          <div className="bg-white bg-opacity-90 rounded-2xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm mb-1">Total Participants</p>
            <p className="text-3xl font-bold text-gray-900">{raffle.participants.length}</p>
          </div>

          {/* Tiers List */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-4 border border-white border-opacity-20">
            <h3 className="text-white font-bold text-sm mb-3">All Tiers</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {raffle.tiers.map((tier, idx) => (
                <div
                  key={tier.id}
                  className={`p-3 rounded-lg transition ${
                    idx === currentTierIndex
                      ? 'bg-white bg-opacity-20 border border-white'
                      : 'bg-white bg-opacity-10 border border-white border-opacity-20'
                  }`}
                >
                  <p className="text-white font-semibold text-sm">{tier.prizeName}</p>
                  <p className="text-blue-100 text-xs">₱{Number(tier.prizeAmount).toFixed(0)} • {tier.winnerCount}x</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Participants & Winners */}
        <div className="lg:col-span-3 space-y-6">
          {/* Participants Grid */}
          <div className="bg-black bg-opacity-20 rounded-2xl backdrop-blur-md border-2 border-white border-opacity-30 p-6 sm:p-8">
            <h3 className="text-white font-bold mb-4 text-sm">Participants ({raffle.participants.length})</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {raffle.participants.map((participant, idx) => {
                const isSpinning = spinningIndices.includes(idx);
                const isWinner = allWinners.some(
                  w => w.participantId === participant.id && w.tierId === currentTier.id
                );

                // Skip winners from display
                if (isWinner) return null;

                return (
                  <div
                    key={participant.id}
                    className={`relative aspect-square rounded-xl p-3 font-semibold text-center flex flex-col items-center justify-center transition-all duration-200 cursor-default overflow-hidden ${
                      isSpinning
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 ring-4 ring-yellow-500 shadow-lg scale-105 animate-pulse'
                        : 'bg-gradient-to-br from-slate-300 to-slate-400 text-gray-900 hover:from-slate-200 hover:to-slate-300 shadow-md'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold truncate w-full relative z-10">
                      {participant.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Winners List */}
          {allWinners.length > 0 && (
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20">
              <h3 className="text-white font-bold mb-4">Winners ({allWinners.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allWinners.map((winner, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate text-sm">{winner.participantName}</p>
                      <p className="text-blue-200 text-xs">{winner.tierName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Winner Modal */}
      {phase === 'won' && selectedWinnerId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full transform animate-in">
            {/* Confetti elements */}
            <div className="absolute top-8 left-1/4 text-6xl animate-bounce">🎉</div>
            <div className="absolute top-12 right-1/4 text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</div>
            <div className="absolute bottom-20 left-1/3 text-5xl animate-bounce" style={{ animationDelay: '0.4s' }}>✨</div>

            {/* Content */}
            <div className="text-center relative z-10">
              <p className="text-gray-600 text-sm font-medium mb-3">🏆 WINNER 🏆</p>
              <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
                {raffle.participants.find(p => p.id === selectedWinnerId)?.name}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                  <p className="text-gray-600 text-sm mb-2">Prize</p>
                  <p className="text-2xl font-bold text-gray-900">{currentTier.prizeName}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                  <p className="text-gray-600 text-sm mb-2">Amount</p>
                  <p className="text-2xl font-bold text-green-600">₱{Number(currentTier.prizeAmount).toFixed(2)}</p>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => {
                  if (winnersThisTier >= currentTier.winnerCount) {
                    setTimeout(moveToNextTier, 0);
                  } else {
                    setPhase('selecting');
                  }
                }}
                width="full"
                size="lg"
              >
                {winnersThisTier >= currentTier.winnerCount ? '➜ Next Tier' : '➜ Next Pick'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
