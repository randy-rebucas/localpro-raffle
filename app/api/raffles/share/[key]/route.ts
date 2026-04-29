import { NextRequest, NextResponse } from 'next/server';
import { connectDb, Participant, Raffle, RaffleShare, Tier, Winner } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

type TierDoc = { id: string; prizeName: string; prizeAmount?: number; tierOrder: number };
type WinnerDoc = {
  id: string;
  tierId: string;
  participantId: string;
  drawnAt: Date;
};
type ParticipantDoc = { id: string; name: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const rateLimitError = rateLimit(req, 'share-results', 120, 60 * 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const { key } = await params;

    await connectDb();

    const share = await RaffleShare.findOne({ shareKey: key }).lean();

    if (!share?.raffleId) {
      return NextResponse.json(
        { error: 'Share link not found or results not available' },
        { status: 404 }
      );
    }

    const raffle = await Raffle.findOne({ id: share.raffleId })
      .select('id title description drawnAt')
      .lean();

    if (!raffle?.drawnAt) {
      return NextResponse.json(
        { error: 'Share link not found or results not available' },
        { status: 404 }
      );
    }

    const [winners, tiers, participants] = await Promise.all([
      Winner.find({ raffleId: raffle.id }).lean() as unknown as WinnerDoc[],
      Tier.find({ raffleId: raffle.id }).sort({ tierOrder: 1 }).lean() as unknown as TierDoc[],
      Participant.find({ raffleId: raffle.id }).lean() as unknown as ParticipantDoc[],
    ]);

    const participantsById = new Map(participants.map((p) => [p.id, p]));
    const tiersById = new Map(tiers.map((t) => [t.id, t]));

    const orderedWinners = [...winners].sort((a, b) => {
      const tierA = tiersById.get(a.tierId);
      const tierB = tiersById.get(b.tierId);
      const orderA = tierA?.tierOrder ?? 0;
      const orderB = tierB?.tierOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime();
    });

    const tierMap = new Map();
    orderedWinners.forEach((winner) => {
      const tier = tiersById.get(winner.tierId);
      const participant = participantsById.get(winner.participantId);
      if (!tier || !participant) return;

      const tierId = tier.id;
      if (!tierMap.has(tierId)) {
        tierMap.set(tierId, {
          id: tierId,
          prizeName: tier.prizeName,
          prizeAmount: tier.prizeAmount ?? 0,
          winners: [],
        });
      }
      tierMap.get(tierId).winners.push({
        id: winner.id,
        participantName: participant.name,
        tierName: tier.prizeName,
        prizeAmount: tier.prizeAmount ?? 0,
        drawnAt: winner.drawnAt,
      });
    });

    const resultsByTier = Array.from(tierMap.values());

    return NextResponse.json({
      raffle,
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
