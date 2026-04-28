'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaClock,
  FaDownload,
  FaEllipsisV,
  FaEye,
  FaGift,
  FaPlus,
  FaQuestionCircle,
  FaSearch,
  FaShieldAlt,
  FaSlash,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';

const steps = [
  { label: 'Raffle Details', helper: 'Basic information' },
  { label: 'Raffle Setup', helper: 'Prizes & Participants' },
  { label: 'Ticket Settings', helper: 'Configure how participants join' },
  { label: 'Schedule', helper: 'Set date and time' },
  { label: 'Review', helper: 'Review and create' },
];

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

  // Tier form state
  const [tierForm, setTierForm] = useState({ prizeName: '', prizeAmount: '', winnerCount: '1' });
  const [tierLoading, setTierLoading] = useState(false);

  // Participant form state
  const [participantForm, setParticipantForm] = useState({ names: '', email: '' });
  const [participantLoading, setParticipantLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [ticketSettings, setTicketSettings] = useState({
    entryMode: 'manual',
    entriesPerParticipant: '1',
    requireEmail: true,
    allowDuplicates: false,
    approvalMode: 'automatic',
    entryInstructions: '',
  });
  const [scheduleSettings, setScheduleSettings] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: 'Asia/Manila',
    reminderEmail: true,
    publishResults: true,
  });

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

  const handleStepBack = () => {
    setError('');
    setActiveStep((step) => Math.max(1, step - 1));
  };

  const handleStepContinue = () => {
    setError('');

    if (activeStep < steps.length - 1) {
      setActiveStep((step) => step + 1);
      return;
    }

    handleStartDraw();
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

  const totalWinners = raffle.tiers.reduce((sum, tier) => sum + tier.winnerCount, 0);
  const eligibleParticipants = raffle.participants.length;
  const pendingParticipants = 0;
  const removedParticipants = 0;
  const participantRows = raffle.participants.slice(0, 5);
  const currentStep = steps[activeStep];
  const isReviewStep = activeStep === steps.length - 1;
  const canStartDraw = raffle.tiers.length > 0 && raffle.participants.length > 0;

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 text-blue-600">
              <FaGift size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight">Lucky Draw</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 sm:inline-flex"
            >
              <FaArrowLeft size={12} />
              Back to Dashboard
            </Link>
            {raffle.status === 'DRAWN' && (
              <Link
                href={`/raffles/${raffleId}/analytics`}
                className="hidden h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
              >
                <FaEye size={13} />
                Preview Raffle
              </Link>
            )}
            <button
              type="button"
              onClick={handleStepContinue}
              disabled={isReviewStep && !canStartDraw}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReviewStep ? 'Start Draw' : 'Save & Continue'}
              <FaArrowRight size={12} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 h-64 w-full">
          {[
            ['left-[4%] top-16 bg-blue-300', 'h-2 w-2'],
            ['left-[12%] top-28 bg-emerald-300', 'h-2 w-2'],
            ['left-[22%] top-8 bg-pink-200', 'h-1.5 w-1.5'],
            ['left-[27%] top-20 bg-purple-300', 'h-3 w-3 rotate-45'],
          ].map(([position, size], index) => (
            <span key={index} className={`absolute rounded-sm ${position} ${size}`} />
          ))}
        </div>

        <div className="mx-auto grid max-w-7xl lg:grid-cols-[300px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50/60 p-6 lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r">
            <ol className="space-y-1">
              {steps.map((step, index) => {
                const active = index === activeStep;
                const done = index < activeStep;

                return (
                  <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
                    {index < steps.length - 1 && (
                      <span className="absolute left-5 top-11 h-[calc(100%-2rem)] w-px bg-slate-200" />
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveStep(Math.max(1, index))}
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${active ? 'bg-blue-600 text-white' : done ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                      aria-label={`Go to ${step.label}`}
                    >
                      {done ? <FaCheck size={12} /> : index + 1}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(Math.max(1, index))}
                      className={`rounded-lg px-2 py-1 text-left transition ${active ? 'bg-blue-50' : 'hover:bg-slate-100'}`}
                    >
                      <span className={`block text-sm font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                        {step.label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{step.helper}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 rounded-xl bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <FaQuestionCircle className="mt-1 shrink-0 text-blue-600" size={18} />
                <div>
                  <p className="text-sm font-bold text-slate-950">Need help?</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Visit our <span className="font-semibold text-blue-600">Help Center</span> for tips and guidance.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="px-4 py-8 sm:px-8 lg:px-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">{currentStep.label}</h1>
              <p className="mt-2 text-sm text-slate-500">{currentStep.helper}</p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-8">
              {activeStep === 1 && (
                <>
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Prize Tiers</h2>
                    <p className="mt-1 text-sm text-slate-500">Add one or more prize tiers. Winners will be drawn for each tier.</p>
                  </div>
                  <form onSubmit={handleAddTier} className="grid gap-2 sm:grid-cols-[160px_120px_90px_auto]">
                    <input
                      type="text"
                      value={tierForm.prizeName}
                      onChange={(e) => setTierForm({ ...tierForm, prizeName: e.target.value })}
                      placeholder="Prize name"
                      className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      required
                    />
                    <input
                      type="number"
                      value={tierForm.prizeAmount}
                      onChange={(e) => setTierForm({ ...tierForm, prizeAmount: e.target.value })}
                      placeholder="Amount"
                      step="0.01"
                      className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                      type="number"
                      value={tierForm.winnerCount}
                      onChange={(e) => setTierForm({ ...tierForm, winnerCount: e.target.value })}
                      min="1"
                      className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      required
                    />
                    <button
                      type="submit"
                      disabled={tierLoading}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
                    >
                      <FaPlus size={12} />
                      {tierLoading ? 'Adding...' : 'Add Prize Tier'}
                    </button>
                  </form>
                </div>

                <div className="space-y-3">
                  {raffle.tiers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      No tiers added yet. Add your first prize tier above.
                    </div>
                  ) : (
                    raffle.tiers.map((tier, index) => (
                      <div key={tier.id} className="grid items-center gap-4 rounded-lg border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-[28px_40px_1fr_90px_1fr_24px]">
                        <span className="cursor-grab text-slate-300">⋮⋮</span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <FaTrophy size={17} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">{index === 0 ? 'Grand Prize' : tier.prizeName}</p>
                          <p className="mt-1 text-xs text-slate-500">{tier.prizeName}</p>
                        </div>
                        <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {tier.winnerCount} Winner{tier.winnerCount !== 1 ? 's' : ''}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">₱{Number(tier.prizeAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                          <p className="mt-1 text-xs text-slate-500">Prize value</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(tier.id)}
                          className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${tier.prizeName}`}
                        >
                          <FaEllipsisV size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                  <FaQuestionCircle size={13} />
                  {totalWinners} winner{totalWinners !== 1 ? 's are' : ' is'} drawn from all eligible participants across prize tiers.
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Participants</h2>
                    <p className="mt-1 text-sm text-slate-500">Manage how participants are added to this raffle.</p>
                  </div>
                  <form onSubmit={handleAddParticipants} className="grid gap-2 sm:grid-cols-[220px_190px_auto]">
                    <input
                      type="text"
                      value={participantForm.names}
                      onChange={(e) => setParticipantForm({ ...participantForm, names: e.target.value })}
                      placeholder="Names, comma separated"
                      className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                      type="email"
                      value={participantForm.email}
                      onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
                      placeholder="Optional shared email"
                      className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="submit"
                      disabled={participantLoading}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
                    >
                      <FaPlus size={12} />
                      {participantLoading ? 'Adding...' : 'Add Participants'}
                    </button>
                  </form>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Total Participants', value: raffle.participants.length, helper: 'All time', icon: FaUsers, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Eligible Participants', value: eligibleParticipants, helper: 'Ready to win', icon: FaCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending Participants', value: pendingParticipants, helper: 'Awaiting approval', icon: FaClock, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Removed Participants', value: removedParticipants, helper: 'This raffle', icon: FaSlash, color: 'text-red-600', bg: 'bg-red-50' },
                  ].map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div key={stat.label} className="rounded-xl border border-slate-100 p-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}>
                            <Icon size={16} />
                          </span>
                          <div>
                            <p className="text-xs text-slate-500">{stat.label}</p>
                            <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
                            <p className="mt-1 text-xs text-slate-400">{stat.helper}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-4 flex flex-wrap gap-6 border-b border-slate-100 text-sm font-semibold">
                  {['All Participants', 'Eligible', 'Pending', 'Removed'].map((tab, index) => (
                    <button
                      key={tab}
                      type="button"
                      className={`border-b-2 pb-3 ${index === 0 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                    >
                      {tab} {index === 0 ? `(${raffle.participants.length})` : index === 1 ? `(${eligibleParticipants})` : '(0)'}
                    </button>
                  ))}
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search participants..."
                      className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <select className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                    <option>All Status</option>
                    <option>Eligible</option>
                    <option>Pending</option>
                  </select>
                  <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
                    <FaDownload size={13} />
                    Import CSV
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-100">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all participants" /></th>
                        <th className="px-4 py-3">Participant</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Entries</th>
                        <th className="px-4 py-3">Joined At</th>
                        <th className="w-10 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {participantRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            No participants added yet.
                          </td>
                        </tr>
                      ) : (
                        participantRows.map((participant, index) => (
                          <tr key={participant.id} className="text-slate-700">
                            <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${participant.name}`} /></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                                  {participant.name.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="font-medium text-slate-950">{participant.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">{participant.email || '—'}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Eligible</span>
                            </td>
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3">Recently added</td>
                            <td className="px-4 py-3 text-slate-400"><FaEllipsisV size={12} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>Showing {participantRows.length} of {raffle.participants.length} participants</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((page) => (
                      <button key={page} type="button" className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold ${page === 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-500'}`}>
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
                </>
              )}

              {activeStep === 2 && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-950">Ticket Settings</h2>
                    <p className="mt-1 text-sm text-slate-500">Decide how participants can enter and how entries are counted.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="mb-3 text-sm font-semibold text-slate-800">Entry Method</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          { value: 'manual', title: 'Manual Entry', text: 'Add participants yourself.' },
                          { value: 'public', title: 'Public Link', text: 'Let people join from a share link.' },
                          { value: 'csv', title: 'CSV Import', text: 'Upload entries in bulk.' },
                        ].map((option) => (
                          <label key={option.value} className={`cursor-pointer rounded-xl border p-4 transition ${ticketSettings.entryMode === option.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <input
                              type="radio"
                              name="entryMode"
                              value={option.value}
                              checked={ticketSettings.entryMode === option.value}
                              onChange={(event) => setTicketSettings((settings) => ({ ...settings, entryMode: event.target.value }))}
                              className="sr-only"
                            />
                            <span className="block text-sm font-bold text-slate-950">{option.title}</span>
                            <span className="mt-2 block text-xs leading-5 text-slate-500">{option.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="entriesPerParticipant" className="mb-3 block text-sm font-semibold text-slate-800">
                          Entries Per Participant
                        </label>
                        <input
                          id="entriesPerParticipant"
                          type="number"
                          min="1"
                          value={ticketSettings.entriesPerParticipant}
                          onChange={(event) => setTicketSettings((settings) => ({ ...settings, entriesPerParticipant: event.target.value }))}
                          className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label htmlFor="approvalMode" className="mb-3 block text-sm font-semibold text-slate-800">
                          Approval Mode
                        </label>
                        <select
                          id="approvalMode"
                          value={ticketSettings.approvalMode}
                          onChange={(event) => setTicketSettings((settings) => ({ ...settings, approvalMode: event.target.value }))}
                          className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="automatic">Automatically approve entries</option>
                          <option value="manual">Review entries before approval</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          key: 'requireEmail',
                          title: 'Require participant email',
                          text: 'Collect an email address for each participant so winners can be contacted.',
                        },
                        {
                          key: 'allowDuplicates',
                          title: 'Allow duplicate names',
                          text: 'Use this only when multiple people may share the same display name.',
                        },
                      ].map((setting) => {
                        const key = setting.key as 'requireEmail' | 'allowDuplicates';

                        return (
                          <label key={setting.key} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                            <span>
                              <span className="block text-sm font-semibold text-slate-950">{setting.title}</span>
                              <span className="mt-1 block text-xs text-slate-500">{setting.text}</span>
                            </span>
                            <span className={`relative h-6 w-11 rounded-full transition ${ticketSettings[key] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                              <input
                                type="checkbox"
                                checked={ticketSettings[key]}
                                onChange={(event) => setTicketSettings((settings) => ({ ...settings, [key]: event.target.checked }))}
                                className="sr-only"
                              />
                              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${ticketSettings[key] ? 'left-6' : 'left-1'}`} />
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div>
                      <label htmlFor="entryInstructions" className="mb-3 block text-sm font-semibold text-slate-800">
                        Entry Instructions
                      </label>
                      <textarea
                        id="entryInstructions"
                        value={ticketSettings.entryInstructions}
                        onChange={(event) => setTicketSettings((settings) => ({ ...settings, entryInstructions: event.target.value }))}
                        placeholder="Explain how participants qualify for this raffle..."
                        rows={4}
                        className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </section>
              )}

              {activeStep === 3 && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-950">Schedule</h2>
                    <p className="mt-1 text-sm text-slate-500">Set the entry window and choose when results should be shared.</p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 p-5">
                      <h3 className="text-sm font-bold text-slate-950">Entry Opens</h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="startDate" className="mb-2 block text-xs font-semibold text-slate-600">Date</label>
                          <input
                            id="startDate"
                            type="date"
                            value={scheduleSettings.startDate}
                            onChange={(event) => setScheduleSettings((settings) => ({ ...settings, startDate: event.target.value }))}
                            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label htmlFor="startTime" className="mb-2 block text-xs font-semibold text-slate-600">Time</label>
                          <input
                            id="startTime"
                            type="time"
                            value={scheduleSettings.startTime}
                            onChange={(event) => setScheduleSettings((settings) => ({ ...settings, startTime: event.target.value }))}
                            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-5">
                      <h3 className="text-sm font-bold text-slate-950">Entry Closes</h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="endDate" className="mb-2 block text-xs font-semibold text-slate-600">Date</label>
                          <input
                            id="endDate"
                            type="date"
                            value={scheduleSettings.endDate}
                            onChange={(event) => setScheduleSettings((settings) => ({ ...settings, endDate: event.target.value }))}
                            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label htmlFor="endTime" className="mb-2 block text-xs font-semibold text-slate-600">Time</label>
                          <input
                            id="endTime"
                            type="time"
                            value={scheduleSettings.endTime}
                            onChange={(event) => setScheduleSettings((settings) => ({ ...settings, endTime: event.target.value }))}
                            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="timezone" className="mb-3 block text-sm font-semibold text-slate-800">Timezone</label>
                      <select
                        id="timezone"
                        value={scheduleSettings.timezone}
                        onChange={(event) => setScheduleSettings((settings) => ({ ...settings, timezone: event.target.value }))}
                        className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="Asia/Manila">Asia/Manila</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      { key: 'reminderEmail', title: 'Send reminder email before draw', text: 'Notify participants before the raffle closes.' },
                      { key: 'publishResults', title: 'Publish results after draw', text: 'Make winner results available from the public share page.' },
                    ].map((setting) => {
                      const key = setting.key as 'reminderEmail' | 'publishResults';

                      return (
                        <label key={setting.key} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                          <span>
                            <span className="block text-sm font-semibold text-slate-950">{setting.title}</span>
                            <span className="mt-1 block text-xs text-slate-500">{setting.text}</span>
                          </span>
                          <span className={`relative h-6 w-11 rounded-full transition ${scheduleSettings[key] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            <input
                              type="checkbox"
                              checked={scheduleSettings[key]}
                              onChange={(event) => setScheduleSettings((settings) => ({ ...settings, [key]: event.target.checked }))}
                              className="sr-only"
                            />
                            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${scheduleSettings[key] ? 'left-6' : 'left-1'}`} />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              )}

              {activeStep === 4 && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-950">Review Raffle</h2>
                    <p className="mt-1 text-sm text-slate-500">Confirm everything before moving to the draw experience.</p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-3">
                    {[
                      { label: 'Prize Tiers', value: raffle.tiers.length, helper: `${totalWinners} total winner${totalWinners !== 1 ? 's' : ''}` },
                      { label: 'Participants', value: raffle.participants.length, helper: 'Eligible to enter' },
                      { label: 'Entries Each', value: ticketSettings.entriesPerParticipant || 1, helper: ticketSettings.entryMode },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-slate-100 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                        <p className="mt-3 text-3xl font-bold text-slate-950">{item.value}</p>
                        <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 p-5">
                      <h3 className="text-sm font-bold text-slate-950">Raffle Summary</h3>
                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Name</dt>
                          <dd className="font-semibold text-slate-950">{raffle.title}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Status</dt>
                          <dd className="font-semibold text-slate-950">{raffle.status}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Approval</dt>
                          <dd className="font-semibold capitalize text-slate-950">{ticketSettings.approvalMode}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-5">
                      <h3 className="text-sm font-bold text-slate-950">Schedule Summary</h3>
                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Opens</dt>
                          <dd className="font-semibold text-slate-950">{scheduleSettings.startDate || 'Not set'} {scheduleSettings.startTime}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Closes</dt>
                          <dd className="font-semibold text-slate-950">{scheduleSettings.endDate || 'Not set'} {scheduleSettings.endTime}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Timezone</dt>
                          <dd className="font-semibold text-slate-950">{scheduleSettings.timezone}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {!canStartDraw && (
                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                      Add at least one prize tier and one participant before starting the draw.
                    </div>
                  )}
                </section>
              )}

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <button
                  type="button"
                  onClick={handleStepBack}
                  disabled={activeStep === 1}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStepContinue}
                  disabled={isReviewStep && !canStartDraw}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isReviewStep ? 'Start Draw' : 'Save & Continue'}
                  <FaArrowRight size={12} />
                </button>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600">
                      <FaQuestionCircle size={17} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-950">Tips for success</p>
                      <p className="mt-1 text-sm text-slate-600">Offer attractive prizes, make entry easy, and promote your raffle to reach more people.</p>
                    </div>
                  </div>
                  <button type="button" className="hidden rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 sm:inline-flex">
                    Learn more
                  </button>
                </div>
              </div>

              <div className="text-center text-slate-500">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
                  <FaShieldAlt size={16} />
                  Fair. Random. Transparent.
                </div>
                <p className="mt-2 text-xs">All draws are conducted securely and fairly using a certified random selection process.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
