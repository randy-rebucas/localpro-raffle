'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components';

interface Analytics {
  raffle: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    drawnAt: string | null;
  };
  summary: {
    totalParticipants: number;
    totalWinners: number;
    totalPrizePool: number;
    participationRate: string;
    averagePrizePerWinner: string;
  };
  winnersByTier: Array<{
    id: string;
    prizeName: string;
    prizeAmount: number;
    expectedWinners: number;
    actualWinners: number;
    totalPrizeForTier: number;
  }>;
  winnerTimeline: Array<{
    name: string;
    tier: string;
    amount: number;
    drawnAt: string;
  }>;
  prizeDistribution: Array<{
    name: string;
    value: number;
    amount: number;
  }>;
}

export default function RaffleAnalytics() {
  const params = useParams();
  const router = useRouter();
  const raffleId = params.id as string;

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [raffleId]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/raffles/${raffleId}/analytics`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">
          {error || 'Analytics not available'}
        </div>
      </div>
    );
  }

  const maxTierWinners = Math.max(...analytics.winnersByTier.map((t) => t.actualWinners), 1);
  const maxPrizeAmount = Math.max(...analytics.prizeDistribution.map((p) => p.amount), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        ← Back to Home
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 {analytics.raffle.title}</h1>
          <p className="text-purple-100 text-lg">Analytics & Statistics</p>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <div className="p-8">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 font-semibold">👥 Participants</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {analytics.summary.totalParticipants}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 font-semibold">🏆 Winners</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {analytics.summary.totalWinners}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 font-semibold">💰 Total Pool</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                ₱{analytics.summary.totalPrizePool.toLocaleString('en-PH')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600 font-semibold">📈 Win Rate</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {analytics.summary.participationRate}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600 font-semibold">Avg Prize</p>
              <p className="text-xl font-bold text-red-600 mt-2 break-words">
                {analytics.summary.averagePrizePerWinner}
              </p>
            </div>
          </div>

          {/* Winners by Tier Table */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Winners by Tier</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Prize Tier</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Prize Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Winners</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Prize</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.winnersByTier.map((tier) => (
                    <tr key={tier.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{tier.prizeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        ₱{tier.prizeAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                          {tier.actualWinners}/{tier.expectedWinners}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₱{tier.totalPrizeForTier.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${(tier.actualWinners / maxTierWinners) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">
                            {((tier.actualWinners / Math.max(analytics.summary.totalWinners, 1)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prize Distribution */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💎 Prize Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bar Chart */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Prize Amount by Tier</h3>
                <div className="space-y-4">
                  {analytics.prizeDistribution.map((prize) => (
                    <div key={prize.name}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">{prize.name}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          ₱{prize.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${(prize.amount / maxPrizeAmount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Highest Prize</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₱{Math.max(...analytics.prizeDistribution.map((p) => p.amount)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Lowest Prize</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₱{Math.min(...analytics.prizeDistribution.map((p) => p.amount)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Winner Timeline */}
          {analytics.winnerTimeline.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Winner Timeline</h2>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {analytics.winnerTimeline.map((winner, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{winner.name}</p>
                          <p className="text-sm text-gray-600">{winner.tier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ₱{winner.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(winner.drawnAt).toLocaleTimeString('en-PH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between pt-8 border-t border-gray-200">
            <Link href={`/raffles/${raffleId}/results`}>
              <Button variant="secondary">View Results</Button>
            </Link>
            <Button
              onClick={() => window.print()}
              variant="primary"
            >
              🖨️ Print Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
