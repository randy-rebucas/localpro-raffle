import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { drawWinners } from '@/utils/drawing';
import { requireRaffleOwnership, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

const publicDrawErrors = new Map([
  ['RAFFLE_ALREADY_DRAWN', 'Raffle has already been drawn'],
  ['RAFFLE_NOT_FOUND', 'Raffle not found'],
]);

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/raffles/[id]/draw - Execute raffle draw
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'DRAW_UNAUTHORIZED', id);
      return authError;
    }

    // Fetch raffle with tiers and participants
    const raffle = await prisma.raffle.findUnique({
      where: { id },
      include: {
        tiers: {
          orderBy: { tierOrder: 'asc' },
        },
        participants: true,
        winners: true,
      },
    });

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    if (raffle.status === 'DRAWN') {
      return NextResponse.json(
        { error: 'Raffle has already been drawn' },
        { status: 400 }
      );
    }

    if (raffle.tiers.length === 0) {
      return NextResponse.json(
        { error: 'No tiers defined for this raffle' },
        { status: 400 }
      );
    }

    if (raffle.participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants in this raffle' },
        { status: 400 }
      );
    }

    // Execute drawing algorithm
    const drawResult = drawWinners({
      participants: raffle.participants.map((p) => ({
        id: p.id,
        name: p.name,
      })),
      tiers: raffle.tiers.map((t) => ({
        id: t.id,
        prizeName: t.prizeName,
        winnerCount: t.winnerCount,
      })),
    });

    const totalWinners = drawResult.reduce((sum, tier) => sum + tier.winners.length, 0);
    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'DRAW_EXECUTED', id, { totalWinners });

    const { updatedRaffle, winners } = await prisma.$transaction(async (tx) => {
      const currentRaffle = await tx.raffle.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!currentRaffle) {
        throw new Error('RAFFLE_NOT_FOUND');
      }

      if (currentRaffle.status === 'DRAWN') {
        throw new Error('RAFFLE_ALREADY_DRAWN');
      }

      const winnerRecords = [];
      for (const tierResult of drawResult) {
        for (const winner of tierResult.winners) {
          const winnerRecord = await tx.winner.create({
            data: {
              raffleId: id,
              tierId: tierResult.tierId,
              participantId: winner.participantId,
            },
            include: {
              tier: true,
              participant: true,
            },
          });
          winnerRecords.push(winnerRecord);
        }
      }

      const drawnRaffle = await tx.raffle.update({
        where: { id },
        data: {
          status: 'DRAWN',
          drawnAt: new Date(),
        },
        include: {
          tiers: {
            orderBy: { tierOrder: 'asc' },
          },
          winners: {
            include: {
              participant: true,
              tier: true,
            },
            orderBy: [{ tier: { tierOrder: 'asc' } }, { drawnAt: 'asc' }],
          },
        },
      });

      return { updatedRaffle: drawnRaffle, winners: winnerRecords };
    });

    return NextResponse.json({
      success: true,
      raffle: updatedRaffle,
      winners,
    });
  } catch (error) {
    console.error('Error drawing raffle:', error);
    const message = error instanceof Error ? error.message : '';
    const publicMessage = publicDrawErrors.get(message);

    return NextResponse.json(
      { error: publicMessage || 'Failed to draw raffle' },
      { status: publicMessage ? 400 : 500 }
    );
  }
}

// GET /api/raffles/[id]/draw - Get draw results
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      return authError;
    }

    const winners = await prisma.winner.findMany({
      where: { raffleId: id },
      include: {
        participant: true,
        tier: true,
      },
      orderBy: [{ tier: { tierOrder: 'asc' } }, { drawnAt: 'asc' }],
    });

    if (winners.length === 0) {
      return NextResponse.json(
        { error: 'No winners found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ winners });
  } catch (error) {
    console.error('Error fetching draw results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draw results' },
      { status: 500 }
    );
  }
}
