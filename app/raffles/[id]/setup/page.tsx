'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea } from '@/components';

interface Tier {
  id: string;
  prizeName: string;
  prizeAmount: number;
  winnerCount: number;
  tierOrder: number;
}

interface Participant {
  id: string;
  name: string;
  email?: string;
}

interface Raffle {
  id: string;
  title: string;
  status: string;
  participants: Participant[];
  tiers: Tier[];
}

export default function RaffleSetup() {
  const params = useParams();
  const router = useRouter();
  const raffleId = params.id as string;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'tiers' | 'participants'>('tiers');

  // Tier form state
  const [tierForm, setTierForm] = useState({ prizeName: '', prizeAmount: '', winnerCount: '1' });
  const [tierLoading, setTierLoading] = useState(false);

  // Participant form state
  const [participantForm, setParticipantForm] = useState({ names: '', email: '' });
  const [participantLoading, setParticipantLoading] = useState(false);

  useEffect(() => {
    fetchRaffle();
  }, [raffleId]);

  const fetchRaffle = async () => {
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
  };

  const handleAddTier = async (e: FormEvent) => {
    e.preventDefault();
    setTierLoading(true);
    setError('');

    // Client-side validation
    if (!tierForm.prizeName.trim()) {
      setError('Prize name is required');
      setTierLoading(false);
      return;
    }

    if (!tierForm.winnerCount || parseInt(tierForm.winnerCount) < 1) {
      setError('Winner count must be at least 1');
      setTierLoading(false);
      return;
    }

    try {
      const prizeAmount = tierForm.prizeAmount ? parseFloat(tierForm.prizeAmount) : 0;
      if (isNaN(prizeAmount)) {
        setError('Prize amount must be a valid number');
        setTierLoading(false);
        return;
      }

      const winnerCount = parseInt(tierForm.winnerCount);
      if (isNaN(winnerCount)) {
        setError('Winner count must be a valid number');
        setTierLoading(false);
        return;
      }

      const res = await fetch(`/api/raffles/${raffleId}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prizeName: tierForm.prizeName.trim(),
          prizeAmount,
          winnerCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add tier');
      }

      setTierForm({ prizeName: '', prizeAmount: '', winnerCount: '1' });
      await fetchRaffle();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMsg);
      console.error('Tier creation error:', err);
    } finally {
      setTierLoading(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;

    try {
      const res = await fetch(`/api/raffles/${raffleId}/tiers?tierId=${tierId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete tier');
      fetchRaffle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tier');
    }
  };

  const handleAddParticipants = async (e: FormEvent) => {
    e.preventDefault();
    setParticipantLoading(true);
    setError('');

    try {
      // Parse names from text area (newline or comma separated)
      const names = participantForm.names
        .split(/[\n,]/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      if (names.length === 0) {
        setError('Please enter at least one participant name');
        setParticipantLoading(false);
        return;
      }

      const participants = names.map((name) => ({
        name,
        email: participantForm.email || undefined,
      }));

      const res = await fetch(`/api/raffles/${raffleId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add participants');
      }

      setParticipantForm({ names: '', email: '' });
      fetchRaffle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setParticipantLoading(false);
    }
  };

  const handleStartDraw = async () => {
    if (!raffle || raffle.tiers.length === 0 || raffle.participants.length === 0) {
      setError('Add at least one tier and participants before drawing');
      return;
    }

    if (!confirm('Are you sure you want to draw winners? This action cannot be undone.')) return;

    try {
      router.push(`/raffles/${raffleId}/draw`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start draw');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">{error || 'Raffle not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          ← Back to Raffles
        </Link>
        {raffle.status === 'DRAWN' && (
          <Link href={`/raffles/${raffleId}/analytics`}>
            <Button variant="primary">📊 View Analytics</Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">{raffle.title}</h1>
          <p className="text-blue-100">Status: <span className="font-semibold">{raffle.status}</span></p>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
          {/* Tiers Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prize Tiers</h2>

              <form onSubmit={handleAddTier} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <Input
                  label="Prize Name"
                  type="text"
                  value={tierForm.prizeName}
                  onChange={(e) => setTierForm({ ...tierForm, prizeName: e.target.value })}
                  placeholder="e.g., First Prize"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Amount (₱)"
                    type="number"
                    value={tierForm.prizeAmount}
                    onChange={(e) => setTierForm({ ...tierForm, prizeAmount: e.target.value })}
                    placeholder="5000"
                    step="0.01"
                  />
                  <Input
                    label="Winners"
                    type="number"
                    value={tierForm.winnerCount}
                    onChange={(e) => setTierForm({ ...tierForm, winnerCount: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                <Button type="submit" disabled={tierLoading} width="full" loading={tierLoading}>
                  {tierLoading ? 'Adding...' : '+ Add Tier'}
                </Button>
              </form>

              <div className="space-y-2">
                {raffle.tiers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tiers added yet</p>
                ) : (
                  raffle.tiers.map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{tier.prizeName}</p>
                        <div className="text-xs text-gray-600 space-x-3">
                          <span>₱{Number(tier.prizeAmount).toFixed(2)}</span>
                          <span>{tier.winnerCount} winner{tier.winnerCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTier(tier.id)}
                        className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Participants ({raffle.participants.length})</h2>

              <form onSubmit={handleAddParticipants} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <Textarea
                  label="Names (one per line or comma-separated)"
                  value={participantForm.names}
                  onChange={(e) => setParticipantForm({ ...participantForm, names: e.target.value })}
                  placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson"
                  rows={4}
                />

                <Button type="submit" disabled={participantLoading} width="full" loading={participantLoading}>
                  {participantLoading ? 'Adding...' : '+ Add Participants'}
                </Button>
              </form>

              <div className="max-h-96 overflow-y-auto">
                {raffle.participants.length === 0 ? (
                  <p className="text-gray-500 text-sm">No participants added yet</p>
                ) : (
                  <div className="grid gap-2">
                    {raffle.participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50 text-sm">
                        <span className="text-gray-900">{p.name}</span>
                        {p.email && <span className="text-xs text-gray-500">{p.email}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 px-8 py-6 flex gap-3 justify-end">
          <Link href="/">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button onClick={handleStartDraw} disabled={raffle.tiers.length === 0 || raffle.participants.length === 0} variant="success">
            Start Draw →
          </Button>
        </div>
      </div>
    </div>
  );
}
