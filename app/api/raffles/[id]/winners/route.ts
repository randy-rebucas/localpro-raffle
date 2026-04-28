import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRaffleOwnership } from '@/lib/security';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/raffles/[id]/winners - Get all winners
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      return authError;
    }

    const raffle = await prisma.raffle.findUnique({
      where: { id },
      include: {
        winners: {
          include: {
            participant: true,
            tier: true,
          },
          orderBy: [{ tier: { tierOrder: 'asc' } }, { drawnAt: 'asc' }],
        },
        tiers: {
          orderBy: { tierOrder: 'asc' },
        },
      },
    });

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    // Group winners by tier
    const winnersByTier = raffle.tiers.map((tier) => ({
      ...tier,
      winners: raffle.winners
        .filter((w) => w.tierId === tier.id)
        .map((w) => ({
          id: w.participant.id,
          name: w.participant.name,
          email: w.participant.email,
          drawnAt: w.drawnAt,
        })),
    }));

    return NextResponse.json({
      raffle: {
        id: raffle.id,
        title: raffle.title,
        drawnAt: raffle.drawnAt,
        status: raffle.status,
      },
      winnersByTier,
      totalWinners: raffle.winners.length,
    });
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}
