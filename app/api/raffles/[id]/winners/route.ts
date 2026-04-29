import { NextRequest, NextResponse } from 'next/server';
import { connectDb, Participant, Raffle, Tier, Winner } from '@/lib/db';
import { requireRaffleOwnership } from '@/lib/security';

interface Params {
  params: Promise<{ id: string }>;
}

type ParticipantDoc = { id: string; name: string; email?: string | null };
type TierDoc = { id: string; prizeName: string; tierOrder: number };
type WinnerDoc = {
  id: string;
  raffleId: string;
  tierId: string;
  participantId: string;
  drawnAt: Date;
};

// GET /api/raffles/[id]/winners - Get all winners
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      return authError;
    }

    await connectDb();

    const [raffle, tiers, winners, participants] = await Promise.all([
      Raffle.findOne({ id }).lean(),
      Tier.find({ raffleId: id }).sort({ tierOrder: 1 }).lean() as unknown as TierDoc[],
      Winner.find({ raffleId: id }).lean() as unknown as WinnerDoc[],
      Participant.find({ raffleId: id }).lean() as unknown as ParticipantDoc[],
    ]);

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    const participantsById = new Map(participants.map((p) => [p.id, p]));

    const winnersByTier = tiers.map((tier) => ({
      ...tier,
      winners: winners
        .filter((w) => w.tierId === tier.id)
        .map((w) => {
          const participant = participantsById.get(w.participantId);
          return {
            id: participant?.id ?? w.participantId,
            name: participant?.name ?? 'Unknown',
            email: participant?.email ?? null,
            drawnAt: w.drawnAt,
          };
        }),
    }));

    return NextResponse.json({
      raffle: {
        id: raffle.id,
        title: raffle.title,
        drawnAt: raffle.drawnAt,
        status: raffle.status,
      },
      winnersByTier,
      totalWinners: winners.length,
    });
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}
