import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDb, Participant, Raffle, Tier, Winner } from '@/lib/db';
import { getCurrentUserIdFromRequest } from '@/lib/auth';

// GET /api/raffles - List current user's raffles
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const skip = (page - 1) * limit;
    const userId = await getCurrentUserIdFromRequest(request);

    await connectDb();

    const [raffles, total] = await Promise.all([
      Raffle.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Raffle.countDocuments({ createdBy: userId }),
    ]);

    const raffleIds = raffles.map((raffle) => raffle.id as string);

    const [tiers, participantCounts, winnerCounts] =
      raffleIds.length === 0
        ? [[], [], []]
        : await Promise.all([
            Tier.find({ raffleId: { $in: raffleIds } })
              .sort({ raffleId: 1, tierOrder: 1 })
              .lean(),
            Participant.aggregate<{ _id: string; count: number }>([
              { $match: { raffleId: { $in: raffleIds } } },
              { $group: { _id: '$raffleId', count: { $sum: 1 } } },
            ]),
            Winner.aggregate<{ _id: string; count: number }>([
              { $match: { raffleId: { $in: raffleIds } } },
              { $group: { _id: '$raffleId', count: { $sum: 1 } } },
            ]),
          ]);

    const participantCountByRaffle = new Map(participantCounts.map((row) => [row._id, row.count]));
    const winnerCountByRaffle = new Map(winnerCounts.map((row) => [row._id, row.count]));

    const tiersByRaffle = new Map<string, unknown[]>();
    for (const tier of tiers) {
      const raffleId = tier.raffleId as string;
      const list = tiersByRaffle.get(raffleId) ?? [];
      list.push(tier);
      tiersByRaffle.set(raffleId, list);
    }

    const shapedRaffles = raffles.map((raffle) => ({
      ...raffle,
      tiers: tiersByRaffle.get(raffle.id as string) ?? [],
      _count: {
        participants: participantCountByRaffle.get(raffle.id as string) ?? 0,
        winners: winnerCountByRaffle.get(raffle.id as string) ?? 0,
      },
    }));

    return NextResponse.json(
      {
        data: shapedRaffles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error fetching raffles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch raffles' },
      { status: 500 }
    );
  }
}

// POST /api/raffles - Create new raffle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const userId = await getCurrentUserIdFromRequest(request);

    await connectDb();
    const raffleId = randomUUID();
    const now = new Date();

    const raffle = {
      id: raffleId,
      title: title.trim(),
      description: description?.trim() || null,
      status: 'DRAFT',
      createdAt: now,
      drawnAt: null,
      createdBy: userId,
    };

    await Raffle.create(raffle);

    return NextResponse.json(raffle, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error creating raffle:', error);
    return NextResponse.json(
      { error: 'Failed to create raffle' },
      { status: 500 }
    );
  }
}
