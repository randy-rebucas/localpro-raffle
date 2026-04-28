'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaGift,
  FaImage,
  FaInfoCircle,
  FaQuestionCircle,
  FaShieldAlt,
} from 'react-icons/fa';

const steps = [
  { label: 'Raffle Details', helper: 'Basic information' },
  { label: 'Prizes', helper: 'Add prize(s)' },
  { label: 'Tickets', helper: 'Configure ticket settings' },
  { label: 'Schedule', helper: 'Set date and time' },
  { label: 'Review', helper: 'Review and create' },
];

export default function CreateRaffle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requireLogin, setRequireLogin] = useState(false);
  const [displayWinner, setDisplayWinner] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organizerName: '',
    contactEmail: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/raffles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create raffle');
      }

      const raffle = await res.json();
      router.push(`/raffles/${raffle.id}/setup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
          >
            <FaArrowLeft size={12} />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-52 max-w-7xl">
          {[
            ['left-[4%] top-16 bg-blue-300', 'h-2 w-2'],
            ['left-[14%] top-28 bg-emerald-300', 'h-2 w-2'],
            ['left-[23%] top-8 bg-pink-200', 'h-1.5 w-1.5'],
            ['left-[29%] top-20 bg-purple-300', 'h-3 w-3 rotate-45'],
            ['right-[7%] top-24 bg-blue-300', 'h-1.5 w-1.5'],
            ['right-[15%] top-10 bg-slate-300', 'h-1.5 w-1.5'],
            ['right-[22%] top-20 bg-amber-200', 'h-3 w-3 rotate-45'],
            ['right-[31%] top-32 bg-emerald-200', 'h-2.5 w-2.5 rotate-45'],
          ].map(([position, size], index) => (
            <span key={index} className={`absolute rounded-sm ${position} ${size}`} />
          ))}
        </div>

        <section className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-blue-600">
            <FaGift size={40} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">Create New Raffle</h1>
          <p className="mt-4 text-base text-slate-500">Set up the details for your new raffle.</p>
        </section>

        <form onSubmit={handleSubmit} className="relative mx-auto mt-10 grid max-w-7xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:grid-cols-[300px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50/60 p-6 lg:border-b-0 lg:border-r">
            <ol className="space-y-1">
              {steps.map((step, index) => {
                const active = index === 0;

                return (
                  <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
                    {index < steps.length - 1 && (
                      <span className="absolute left-5 top-11 h-[calc(100%-2rem)] w-px bg-slate-200" />
                    )}
                    <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {index + 1}
                    </span>
                    <span>
                      <span className={`block text-sm font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                        {step.label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{step.helper}</span>
                    </span>
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

          <section className="p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-950">Raffle Information</h2>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="mb-3 block text-sm font-semibold text-slate-800">
                  Raffle Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Summer Giveaway 2024"
                  required
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label htmlFor="description" className="block text-sm font-semibold text-slate-800">
                    Description
                  </label>
                  <span className="text-xs text-slate-400">{formData.description.length}/500</span>
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your raffle and what participants can win..."
                  rows={5}
                  maxLength={500}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-800">Raffle Image <span className="font-normal text-slate-500">(Optional)</span></p>
                <div className="relative grid min-h-36 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white sm:grid-cols-[1fr_220px]">
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FaImage className="mb-3 text-slate-400" size={24} />
                    <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                    <p className="mt-2 text-xs text-slate-500">PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                  <div className="hidden items-center justify-center bg-gradient-to-br from-blue-50 to-white sm:flex">
                    <div className="relative h-24 w-24 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm">
                      <div className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-blue-600/80" />
                      <div className="absolute left-0 top-8 h-5 w-full bg-blue-500/70" />
                      <div className="absolute -top-6 left-1/2 h-8 w-14 -translate-x-1/2 rounded-full border-[10px] border-blue-600 border-b-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <h2 className="mb-5 text-lg font-bold text-slate-950">Organizer Information</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="organizerName" className="mb-3 block text-sm font-semibold text-slate-800">
                      Organizer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="organizerName"
                      type="text"
                      name="organizerName"
                      value={formData.organizerName}
                      onChange={handleChange}
                      placeholder="Your organization or business name"
                      className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="mb-3 block text-sm font-semibold text-slate-800">
                      Contact Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">This email will be used for all raffle communications.</p>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <h2 className="mb-5 text-lg font-bold text-slate-950">Additional Settings</h2>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                    <span className="flex items-start gap-4">
                      <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${requireLogin ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                        {requireLogin && <FaCheck size={12} />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-950">Require login to enter</span>
                        <span className="mt-1 block text-xs text-slate-500">Participants must be logged in to enter the raffle.</span>
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={requireLogin}
                      onChange={(event) => setRequireLogin(event.target.checked)}
                      className="sr-only"
                    />
                    <FaInfoCircle className="ml-4 shrink-0 text-slate-400" size={15} />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                    <span className="flex items-start gap-4">
                      <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${displayWinner ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                        {displayWinner && <FaCheck size={12} />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-950">Display winner publicly</span>
                        <span className="mt-1 block text-xs text-slate-500">Winner name will be announced on the platform.</span>
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={displayWinner}
                      onChange={(event) => setDisplayWinner(event.target.checked)}
                      className="sr-only"
                    />
                    <FaInfoCircle className="ml-4 shrink-0 text-slate-400" size={15} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-blue-600 px-8 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Saving...' : 'Save & Continue'}
                  <FaArrowRight size={13} />
                </button>
              </div>
            </div>
          </section>
        </form>

        <div className="mx-auto mt-8 max-w-7xl text-center text-slate-500">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
            <FaShieldAlt size={16} />
            Fair. Random. Transparent.
          </div>
          <p className="mt-2 text-xs">All draws are conducted securely and fairly using a certified random selection process.</p>
        </div>
      </main>
    </div>
  );
}
