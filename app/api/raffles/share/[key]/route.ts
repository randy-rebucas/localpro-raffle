import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    // Find the share record
    const share = await prisma.raffleShare.findUnique({
      where: { shareKey: key },
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
            description: true,
            drawnAt: true,
          },
        },
      },
    });

    if (!share || !share.raffle.drawnAt) {
      return NextResponse.json(
        { error: 'Share link not found or results not available' },
        { status: 404 }
      );
    }

    // Get all winners for this raffle, grouped by tier
    const winners = await prisma.winner.findMany({
      where: { raffleId: share.raffle.id },
      include: {
        tier: {
          select: { id: true, prizeName: true, prizeAmount: true },
        },
        participant: {
          select: { name: true },
        },
      },
      orderBy: { tier: { tierOrder: 'asc' } },
    });

    // Group winners by tier
    const tierMap = new Map();
    winners.forEach((winner) => {
      const tierId = winner.tier.id;
      if (!tierMap.has(tierId)) {
        tierMap.set(tierId, {
          id: tierId,
          prizeName: winner.tier.prizeName,
          prizeAmount: winner.tier.prizeAmount,
          winners: [],
        });
      }
      tierMap.get(tierId).winners.push({
        id: winner.id,
        participantName: winner.participant.name,
        tierName: winner.tier.prizeName,
        prizeAmount: winner.tier.prizeAmount,
        drawnAt: winner.drawnAt,
      });
    });

    const resultsByTier = Array.from(tierMap.values());

    return NextResponse.json({
      raffle: share.raffle,
      resultsByTier,
      totalWinners: winners.length,
    });
  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share' },
      { status: 500 }
    );
  }
}
