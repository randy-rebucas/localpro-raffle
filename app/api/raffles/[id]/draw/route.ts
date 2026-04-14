import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { drawWinners } from '@/utils/drawing';
import { requireRaffleOwnership, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

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
      participants: raffle.participants.map((p: any) => ({
        id: p.id,
        name: p.name,
      })),
      tiers: raffle.tiers.map((t: any) => ({
        id: t.id,
        prizeName: t.prizeName,
        winnerCount: t.winnerCount,
      })),
    });

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'DRAW_EXECUTED', id, { 
      totalWinners: drawResult.reduce((sum: number, t: any) => sum + t.winners.length, 0) 
    });

    // Create winner records
    const winners = [];
    for (const tierResult of drawResult) {
      for (const winner of tierResult.winners) {
        const winnerRecord = await prisma.winner.create({
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
        winners.push(winnerRecord);
      }
    }

    // Update raffle status
    const updatedRaffle = await prisma.raffle.update({
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

    return NextResponse.json({
      success: true,
      raffle: updatedRaffle,
      winners,
    });
  } catch (error: any) {
    console.error('Error drawing raffle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to draw raffle' },
      { status: 500 }
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
