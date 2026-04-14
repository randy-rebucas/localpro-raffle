'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'DRAWN';
  createdAt: string;
  drawnAt: string | null;
  _count: {
    participants: number;
    winners: number;
  };
}

export default function Home() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      const res = await fetch('/api/raffles?limit=20');
      if (!res.ok) throw new Error('Failed to fetch raffles');
      const data = await res.json();
      setRaffles(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Draft</span>;
      case 'ACTIVE':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Active</span>;
      case 'DRAWN':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Drawn</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Raffles</h2>
        <p className="text-gray-600">Create and manage raffles with multiple prize tiers</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow animate-pulse h-64" />
          ))}
        </div>
      ) : raffles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-4">🎟️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No raffles yet</h3>
          <p className="text-gray-600 mb-6">Create your first raffle to get started</p>
          <Link
            href="/create"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Create Raffle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {raffles.map((raffle) => (
            <Link key={raffle.id} href={`/raffles/${raffle.id}`}>
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200 p-6 cursor-pointer group">
                <div className="mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {raffle.title}
                    </h3>
                    {getStatusBadge(raffle.status)}
                  </div>
                  {raffle.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{raffle.description}</p>
                  )}
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Participants:</span>
                    <span className="font-semibold text-gray-900">{raffle._count.participants}</span>
                  </div>
                  {raffle.status === 'DRAWN' && (
                    <div className="flex justify-between">
                      <span>Winners:</span>
                      <span className="font-semibold text-gray-900">{raffle._count.winners}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Created {new Date(raffle.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
