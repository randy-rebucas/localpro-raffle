import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRaffleOwnership } from '@/lib/security';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(req, id);
    if (authError) {
      return authError;
    }

    const raffle = await prisma.raffle.findUnique({
      where: { id },
      include: {
        participants: true,
        tiers: { orderBy: { tierOrder: 'asc' } },
        winners: {
          include: {
            tier: true,
            participant: true,
          },
        },
      },
    });

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalParticipants = raffle.participants.length;
    const totalWinners = raffle.winners.length;
    const totalPrizePool = raffle.tiers.reduce(
      (sum, tier) => sum + Number(tier.prizeAmount) * tier.winnerCount,
      0
    );

    // Winners by tier
    const winnersByTier = raffle.tiers.map((tier) => {
      const tierWinners = raffle.winners.filter((w) => w.tierId === tier.id);
      return {
        id: tier.id,
        prizeName: tier.prizeName,
        prizeAmount: Number(tier.prizeAmount),
        expectedWinners: tier.winnerCount,
        actualWinners: tierWinners.length,
        totalPrizeForTier: Number(tier.prizeAmount) * tierWinners.length,
      };
    });

    // Participation rate
    const participationRate = totalParticipants > 0 
      ? ((totalWinners / totalParticipants) * 100).toFixed(2)
      : '0.00';

    // Average prize per winner
    const averagePrizePerWinner = totalWinners > 0 
      ? (totalPrizePool / totalWinners).toFixed(2)
      : '0.00';

    // Winner timeline (distribution by draw date)
    const winnerTimeline = raffle.winners
      .sort((a, b) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime())
      .map((w) => ({
        name: w.participant.name,
        tier: w.tier.prizeName,
        amount: Number(w.tier.prizeAmount),
        drawnAt: w.drawnAt,
      }));

    // Prize distribution chart data
    const prizeDistribution = raffle.tiers.map((tier) => ({
      name: tier.prizeName,
      value: tier.winnerCount,
      amount: Number(tier.prizeAmount),
    }));

    return NextResponse.json({
      raffle: {
        id: raffle.id,
        title: raffle.title,
        status: raffle.status,
        createdAt: raffle.createdAt,
        drawnAt: raffle.drawnAt,
      },
      summary: {
        totalParticipants,
        totalWinners,
        totalPrizePool,
        participationRate: `${participationRate}%`,
        averagePrizePerWinner: `₱${Number(averagePrizePerWinner).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      },
      winnersByTier,
      winnerTimeline,
      prizeDistribution,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
