'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Badge } from '@/components';

interface Raffle {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  drawnAt?: string;
  _count: {
    participants: number;
    winners: number;
  };
}

export default function RafflePage() {
  const params = useParams();
  const router = useRouter();
  const raffleId = params.id as string;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'from-yellow-100 to-yellow-50 border-yellow-200';
      case 'ACTIVE':
        return 'from-blue-100 to-blue-50 border-blue-200';
      case 'DRAWN':
        return 'from-green-100 to-green-50 border-green-200';
      default:
        return 'from-gray-100 to-gray-50';
    }
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

  if (!raffle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="text-blue-600 hover:text-blue-700 mb-6 inline-flex">
          ← Back to Raffles
        </Link>
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg">
          {error || 'Raffle not found'}
        </div>
      </div>
    );
  }

  const getActionButtons = () => {
    switch (raffle.status) {
      case 'DRAFT':
        return (
          <Link href={`/raffles/${raffleId}/setup`}>
            <Button>Setup & Configure →</Button>
          </Link>
        );
      case 'ACTIVE':
        return (
          <Link href={`/raffles/${raffleId}/setup`}>
            <Button>Manage & Draw →</Button>
          </Link>
        );
      case 'DRAWN':
        return (
          <Link href={`/raffles/${raffleId}/results`}>
            <Button variant="success">View Results →</Button>
          </Link>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        ← Back to Raffles
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className={`bg-gradient-to-r ${getStatusColor(raffle.status)} p-8 border-l-4`}>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{raffle.title}</h1>
            <Badge 
              variant={raffle.status === 'DRAFT' ? 'warning' : raffle.status === 'ACTIVE' ? 'primary' : 'success'}
              size="md"
            >
              {raffle.status.charAt(0) + raffle.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          {raffle.description && (
            <p className="text-gray-700 text-lg">{raffle.description}</p>
          )}
        </div>

        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Created</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Date(raffle.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Participants</p>
              <p className="text-2xl font-bold text-purple-600">{raffle._count.participants}</p>
            </div>

            {raffle.status === 'DRAWN' && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Winners Drawn</p>
                <p className="text-2xl font-bold text-green-600">{raffle._count.winners}</p>
                <p className="text-xs text-gray-600 mt-1">
                  on {new Date(raffle.drawnAt || '').toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex gap-4 pt-8 border-t border-gray-200">
            {getActionButtons()}
            {raffle.status !== 'DRAFT' && (
              <Link href={`/raffles/${raffleId}/setup`}>
                <Button variant="secondary">View Details</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
