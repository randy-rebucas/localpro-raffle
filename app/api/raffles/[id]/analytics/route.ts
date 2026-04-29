import { NextRequest, NextResponse } from 'next/server';
import { connectDb, Participant, Raffle, Tier, Winner } from '@/lib/db';
import { requireRaffleOwnership } from '@/lib/security';

interface Params {
  params: Promise<{ id: string }>;
}

type ParticipantDoc = { id: string; name: string };
type TierDoc = { id: string; prizeName: string; prizeAmount?: number; winnerCount: number; tierOrder: number };
type WinnerDoc = {
  id: string;
  tierId: string;
  participantId: string;
  drawnAt: Date;
};

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

    await connectDb();

    const [raffle, participants, tiers, winners] = await Promise.all([
      Raffle.findOne({ id }).lean(),
      Participant.find({ raffleId: id }).lean() as unknown as ParticipantDoc[],
      Tier.find({ raffleId: id }).sort({ tierOrder: 1 }).lean() as unknown as TierDoc[],
      Winner.find({ raffleId: id }).lean() as unknown as WinnerDoc[],
    ]);

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    const participantsById = new Map(participants.map((p) => [p.id, p]));
    const tiersById = new Map(tiers.map((t) => [t.id, t]));

    // Calculate statistics
    const totalParticipants = participants.length;
    const totalWinners = winners.length;
    const totalPrizePool = tiers.reduce(
      (sum, tier) => sum + Number(tier.prizeAmount ?? 0) * tier.winnerCount,
      0
    );

    // Winners by tier
    const winnersByTier = tiers.map((tier) => {
      const tierWinners = winners.filter((w) => w.tierId === tier.id);
      return {
        id: tier.id,
        prizeName: tier.prizeName,
        prizeAmount: Number(tier.prizeAmount ?? 0),
        expectedWinners: tier.winnerCount,
        actualWinners: tierWinners.length,
        totalPrizeForTier: Number(tier.prizeAmount ?? 0) * tierWinners.length,
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
    const winnerTimeline = [...winners]
      .sort((a, b) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime())
      .map((w) => {
        const participant = participantsById.get(w.participantId);
        const tier = tiersById.get(w.tierId);
        return {
          name: participant?.name ?? 'Unknown',
          tier: tier?.prizeName ?? 'Unknown',
          amount: Number(tier?.prizeAmount ?? 0),
          drawnAt: w.drawnAt,
        };
      });

    // Prize distribution chart data
    const prizeDistribution = tiers.map((tier) => ({
      name: tier.prizeName,
      value: tier.winnerCount,
      amount: Number(tier.prizeAmount ?? 0),
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
