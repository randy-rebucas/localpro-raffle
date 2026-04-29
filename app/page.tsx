'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components';
import {
  FaChartBar,
  FaChevronDown,
  FaEllipsisV,
  FaGem,
  FaGift,
  FaPlus,
  FaRegCalendarAlt,
  FaSearch,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';

interface Tier {
  id: string;
  winnerCount: number;
}

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'DRAWN';
  createdAt: string;
  drawnAt: string | null;
  imageUrl?: string;
  tiers?: Tier[];
  _count: {
    participants: number;
    winners: number;
  };
}

interface Stats {
  totalRaffles: number;
  totalParticipants: number;
  totalWinners: number;
  totalPrizes: number;
}

export default function Home() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRaffles: 0,
    totalParticipants: 0,
    totalWinners: 0,
    totalPrizes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortBy, setSortBy] = useState('Newest First');

  const statCards = [
    {
      label: 'Total Raffles',
      value: stats.totalRaffles,
      icon: FaGem,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Total Participants',
      value: stats.totalParticipants,
      icon: FaUsers,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Total Winners',
      value: stats.totalWinners,
      icon: FaTrophy,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Total Prizes',
      value: stats.totalPrizes,
      icon: FaChartBar,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  ];

  const fallbackImages = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=360&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=360&q=80',
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=360&q=80',
  ];

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      const res = await fetch('/api/raffles?limit=20');
      if (!res.ok) throw new Error('Failed to fetch raffles');
      const data = await res.json();
      setRaffles(data.data);
      
      // Calculate stats
      const totalParticipants = data.data.reduce((sum: number, r: Raffle) => sum + r._count.participants, 0);
      const totalWinners = data.data.reduce((sum: number, r: Raffle) => sum + r._count.winners, 0);
      const totalPrizes = data.data.reduce((sum: number, r: Raffle) => {
        return sum + (r.tiers || []).reduce((tierSum, tier) => tierSum + tier.winnerCount, 0);
      }, 0);
      
      setStats({
        totalRaffles: data.data.length,
        totalParticipants,
        totalWinners,
        totalPrizes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="warning" size="sm" className="border border-yellow-100 bg-yellow-50 text-yellow-700">Draft</Badge>;
      case 'ACTIVE':
        return <Badge variant="primary" size="sm" className="border border-blue-100 bg-blue-50 text-blue-700">Active</Badge>;
      case 'DRAWN':
        return <Badge variant="success" size="sm" className="border border-emerald-100 bg-emerald-50 text-emerald-700">Drawn</Badge>;
    }
  };

  const getPrizeCount = (raffle: Raffle) => {
    const prizeCount = (raffle.tiers || []).reduce((sum, tier) => sum + tier.winnerCount, 0);
    return prizeCount || '—';
  };

  const getRaffleImage = (raffle: Raffle, index: number) => {
    return raffle.imageUrl || fallbackImages[index % fallbackImages.length];
  };

  const formatCreatedDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredRaffles = raffles.filter((raffle) => {
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || raffle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedRaffles = [...filteredRaffles].sort((a, b) => {
    if (sortBy === 'Newest First') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">Your Raffles</h2>
            <p className="mt-2 text-sm text-slate-500">Create and manage raffles with multiple prize tiers</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <FaPlus size={12} />
                New Raffle
              </Link>
            </div>
          </div>

          {!loading && (
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="flex h-[92px] items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-xl font-bold leading-none text-slate-950">{stat.value}</p>
                      <p className="mt-2 text-xs text-slate-400">All time</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-4 flex flex-col gap-4 md:flex-row">
          <div className="flex-1 relative">
            <label htmlFor="raffle-search" className="sr-only">Search raffles</label>
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              id="raffle-search"
              type="text"
              placeholder="Search raffles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Status filter</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 min-w-40 appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option>All Status</option>
                <option>DRAFT</option>
                <option>ACTIVE</option>
                <option>DRAWN</option>
              </select>
              <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            </label>
            <label className="relative block">
              <span className="sr-only">Sort raffles</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 min-w-44 appearance-none rounded-lg border border-slate-200 bg-white px-11 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option>Newest First</option>
                <option>Oldest First</option>
              </select>
              <FaRegCalendarAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            </label>
          </div>
        </div>

        {/* Raffles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-slate-100 bg-slate-100" />
            ))}
          </div>
        ) : sortedRaffles.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <FaGift size={24} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-950">No raffles found</h3>
            <p className="mb-6 text-slate-500">Create your first raffle to get started</p>
            <Link
              href="/create"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-base font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <FaPlus size={12} />
              Create Raffle
            </Link>
          </div>
        ) : (
          <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2">
            {sortedRaffles.map((raffle, index) => (
              <article
                key={raffle.id}
                className="group relative h-full min-h-[164px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
              >
                <Link href={`/raffles/${raffle.id}`} className="flex h-full cursor-pointer p-5">
                  <div
                    role="img"
                    aria-label={raffle.title}
                    className="relative mr-6 h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-cover bg-center bg-no-repeat transition duration-300 group-hover:scale-105 sm:h-[124px] sm:w-[124px]"
                    style={{ backgroundImage: `url("${getRaffleImage(raffle, index)}")` }}
                  />

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-2 min-w-0 pr-24">
                      <h3 className="truncate text-base font-bold text-slate-950 transition group-hover:text-blue-600">
                        {raffle.title}
                      </h3>
                      {raffle.description && (
                        <p className="mt-2 line-clamp-1 text-sm text-slate-500">{raffle.description}</p>
                      )}
                    </div>

                    <div className="mt-auto grid grid-cols-3 gap-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                          <FaUsers size={14} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-950">{raffle._count.participants}</div>
                          <div className="text-xs text-slate-500">Participants</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <FaTrophy size={14} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-950">{raffle._count.winners}</div>
                          <div className="text-xs text-slate-500">Winners</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <FaGift size={14} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-950">{getPrizeCount(raffle)}</div>
                          <div className="text-xs text-slate-500">Prizes</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <FaRegCalendarAlt className="text-slate-400" size={13} />
                      Created {formatCreatedDate(raffle.createdAt)}
                    </div>
                  </div>
                </Link>
                <div className="absolute right-5 top-5 flex items-start gap-4">
                  {getStatusBadge(raffle.status)}
                  <button
                    type="button"
                    className="-mr-1 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={`Open actions for ${raffle.title}`}
                  >
                    <FaEllipsisV size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {!loading && sortedRaffles.length > 0 && (
          <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-blue-50 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-purple-600 shadow-sm">
                  <span className="absolute left-2 top-3 h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-purple-300" />
                  <span className="absolute bottom-4 left-4 h-2 w-2 rounded-full bg-blue-200" />
                  <FaGift size={42} />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-bold text-slate-950">Ready to create your next raffle?</h3>
                  <p className="text-sm text-slate-500">Create a new raffle and start engaging your audience today.</p>
                </div>
              </div>
              <Link
                href="/create"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-base font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <FaPlus size={12} />
                New Raffle
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
