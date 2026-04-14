'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components';

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

export default function RaffleResults() {
  const params = useParams();
  const router = useRouter();
  const raffleId = params.id as string;

  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [raffleId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/raffles/${raffleId}/winners`);
      if (!res.ok) throw new Error('Failed to fetch results');
      const data = await res.json();
      setResults(data);
      // Expand first tier by default
      if (data.winnersByTier.length > 0) {
        setExpandedTiers(new Set([data.winnersByTier[0].id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">{error || 'Results not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        ← Back to Raffles
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎉 {results.raffle.title}</h1>
          <p className="text-green-100 text-lg">
            Winners drawn on {new Date(results.raffle.drawnAt).toLocaleString()}
          </p>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <div className="p-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Prize Tiers</p>
              <p className="text-3xl font-bold text-blue-600">{results.winnersByTier.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Winners</p>
              <p className="text-3xl font-bold text-green-600">{results.totalWinners}</p>
            </div>
          </div>

          {/* Winners by Tier */}
          <div className="space-y-4 mb-8">
            {results.winnersByTier.map((tier) => (
              <div
                key={tier.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
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

                {expandedTiers.has(tier.id) && (
                  <div className="p-4 bg-white border-t border-gray-200 space-y-2">
                    {tier.winners.map((winner, index) => (
                      <div
                        key={winner.id}
                        className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-semibold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-semibold text-gray-900">{winner.name}</p>
                          {winner.email && (
                            <p className="text-sm text-gray-600">{winner.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between pt-8 border-t border-gray-200">
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
            <div className="flex gap-4">
              <Link href={`/raffles/${raffleId}/analytics`}>
                <Button variant="primary">📊 Analytics</Button>
              </Link>
              <Button
                onClick={handleSendWinnerEmails}
                disabled={sendingEmails}
                variant="warning"
                loading={sendingEmails}
              >
                {sendingEmails ? 'Sending...' : '📧 Send Emails'}
              </Button>
              <Button
                onClick={handleShareResults}
                disabled={sharingLoading}
                variant="success"
                loading={sharingLoading}
              >
                {sharingLoading ? 'Generating...' : '🔗 Share Results'}
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={downloading}
                variant="primary"
                loading={downloading}
              >
                {downloading ? 'Exporting...' : '📥 Export CSV'}
              </Button>
            </div>
          </div>

          {/* Share Modal */}
          {showShareModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-2">Share Raffle Results</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Share this link to let others view the results:
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="primary"
                    size="sm"
                  >
                    📋 Copy
                  </Button>
                </div>
                <Button
                  onClick={() => setShowShareModal(false)}
                  variant="secondary"
                  width="full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
