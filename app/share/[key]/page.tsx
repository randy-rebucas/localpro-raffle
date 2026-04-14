'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Winner {
  id: string;
  participantName: string;
  tierName: string;
  prizeAmount: number;
  drawnAt: string;
}

interface TierResults {
  id: string;
  prizeName: string;
  prizeAmount: number;
  winners: Winner[];
}

interface ShareData {
  raffle: {
    id: string;
    title: string;
    description?: string;
    drawnAt: string;
  };
  resultsByTier: TierResults[];
  totalWinners: number;
}

export default function PublicSharePage() {
  const params = useParams();
  const shareKey = params.key as string;

  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchShareData();
  }, [shareKey]);

  const fetchShareData = async () => {
    try {
      const res = await fetch(`/api/raffles/share/${shareKey}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Share link not found' : 'Failed to load results');
      }
      const result = await res.json();
      setData(result);
      // Expand first tier by default
      if (result.resultsByTier.length > 0) {
        setExpandedTiers(new Set([result.resultsByTier[0].id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleTier = (tierId: string) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(tierId)) {
      newExpanded.delete(tierId);
    } else {
      newExpanded.add(tierId);
    }
    setExpandedTiers(newExpanded);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-gray-600">No results available</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{data.raffle.title}</h1>
        {data.raffle.description && (
          <p className="text-gray-600 text-lg mb-4">{data.raffle.description}</p>
        )}
        <p className="text-gray-500">
          Drawn on {new Date(data.raffle.drawnAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Total Winners</p>
          <p className="text-3xl font-bold text-blue-600">{data.totalWinners}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Prize Tiers</p>
          <p className="text-3xl font-bold text-purple-600">{data.resultsByTier.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Total Prize Pool</p>
          <p className="text-3xl font-bold text-green-600">
            ₱{(data.resultsByTier.reduce((sum, tier) => sum + tier.prizeAmount * tier.winners.length, 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Results by Tier */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Results</h2>

        {data.resultsByTier.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No winners yet</p>
          </div>
        ) : (
          data.resultsByTier.map((tier) => (
            <div key={tier.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* Tier Header */}
              <button
                onClick={() => toggleTier(tier.id)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition"
              >
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{tier.prizeName}</h3>
                  <p className="text-sm text-gray-600">
                    ₱{Number(tier.prizeAmount).toFixed(2)} × {tier.winners.length} winner{tier.winners.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-2xl text-gray-400 ml-4">
                  {expandedTiers.has(tier.id) ? '▼' : '▶'}
                </div>
              </button>

              {/* Winners List */}
              {expandedTiers.has(tier.id) && (
                <div className="divide-y divide-gray-100">
                  {tier.winners.map((winner, idx) => (
                    <div key={winner.id} className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{winner.participantName}</p>
                          <p className="text-sm text-gray-500">
                            Won ₱{Number(winner.prizeAmount).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Winner
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
        <p className="mb-2">🎰 Powered by Raffle Pro</p>
        <p className="text-xs">Results shared publicly • © 2026</p>
      </div>
    </div>
  );
}
