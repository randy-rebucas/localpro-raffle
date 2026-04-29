import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDb, Participant, Raffle, Tier, Winner } from '@/lib/db';
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

type ParticipantDoc = { id: string; name: string; email?: string | null };
type TierDoc = { id: string; prizeName: string; prizeAmount?: number; winnerCount: number; tierOrder: number };
type WinnerDoc = {
  id: string;
  raffleId: string;
  tierId: string;
  participantId: string;
  drawnAt: Date;
  emailSent: boolean;
};

function shapeWinnerRecord(
  winner: WinnerDoc,
  participantsById: Map<string, ParticipantDoc>,
  tiersById: Map<string, TierDoc>
) {
  const participant = participantsById.get(winner.participantId);
  const tier = tiersById.get(winner.tierId);

  if (!participant || !tier) {
    return null;
  }

  return {
    id: winner.id,
    raffleId: winner.raffleId,
    tierId: winner.tierId,
    participantId: winner.participantId,
    drawnAt: winner.drawnAt,
    emailSent: winner.emailSent,
    participant: {
      id: participant.id,
      name: participant.name,
      email: participant.email ?? null,
    },
    tier: {
      id: tier.id,
      prizeName: tier.prizeName,
      prizeAmount: tier.prizeAmount ?? 0,
      winnerCount: tier.winnerCount,
      tierOrder: tier.tierOrder,
    },
  };
}

// POST /api/raffles/[id]/draw - Execute raffle draw
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'DRAW_UNAUTHORIZED', id);
      return authError;
    }

    await connectDb();

    const [raffle, tiers, participants, existingWinners] = await Promise.all([
      Raffle.findOne({ id }).lean(),
      Tier.find({ raffleId: id }).sort({ tierOrder: 1 }).lean() as unknown as TierDoc[],
      Participant.find({ raffleId: id }).lean() as unknown as ParticipantDoc[],
      Winner.find({ raffleId: id }).lean() as unknown as WinnerDoc[],
    ]);

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    if (raffle.status === 'DRAWN' || existingWinners.length > 0) {
      return NextResponse.json(
        { error: 'Raffle has already been drawn' },
        { status: 400 }
      );
    }

    if (tiers.length === 0) {
      return NextResponse.json(
        { error: 'No tiers defined for this raffle' },
        { status: 400 }
      );
    }

    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants in this raffle' },
        { status: 400 }
      );
    }

    const drawResult = drawWinners({
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
      })),
      tiers: tiers.map((t) => ({
        id: t.id,
        prizeName: t.prizeName,
        winnerCount: t.winnerCount,
      })),
    });

    const totalWinners = drawResult.reduce((sum, tier) => sum + tier.winners.length, 0);
    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'DRAW_EXECUTED', id, { totalWinners });

    const drawnAt = new Date();

    const lockResult = await Raffle.findOneAndUpdate(
      { id, status: { $ne: 'DRAWN' } },
      { $set: { status: 'DRAWN', drawnAt } },
      { new: true, lean: true }
    );

    if (!lockResult) {
      const current = await Raffle.findOne({ id }).select('status').lean();
      if (!current) {
        throw new Error('RAFFLE_NOT_FOUND');
      }
      if (current.status === 'DRAWN') {
        throw new Error('RAFFLE_ALREADY_DRAWN');
      }
      throw new Error('RAFFLE_NOT_FOUND');
    }

    const insertedWinnerIds: string[] = [];

    try {
      for (const tierResult of drawResult) {
        for (const winner of tierResult.winners) {
          const winnerId = randomUUID();
          await Winner.create({
            id: winnerId,
            raffleId: id,
            tierId: tierResult.tierId,
            participantId: winner.participantId,
            drawnAt,
            emailSent: false,
          });
          insertedWinnerIds.push(winnerId);
        }
      }
    } catch (error) {
      if (insertedWinnerIds.length > 0) {
        await Winner.deleteMany({ id: { $in: insertedWinnerIds } });
      }

      await Raffle.updateOne(
        { id },
        { $set: { status: raffle.status, drawnAt: raffle.drawnAt ?? null } }
      );

      throw error;
    }

    const [updatedRaffle, winnerDocs] = await Promise.all([
      Raffle.findOne({ id }).lean(),
      Winner.find({ raffleId: id }).lean() as unknown as WinnerDoc[],
    ]);

    const participantsById = new Map(participants.map((p) => [p.id, p]));
    const tiersById = new Map(tiers.map((t) => [t.id, t]));

    const winners = winnerDocs
      .map((w) => shapeWinnerRecord(w, participantsById, tiersById))
      .filter(Boolean) as NonNullable<ReturnType<typeof shapeWinnerRecord>>[];

    winners.sort((a, b) => {
      const tierOrderA = a.tier.tierOrder;
      const tierOrderB = b.tier.tierOrder;
      if (tierOrderA !== tierOrderB) return tierOrderA - tierOrderB;
      return new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime();
    });

    const shapedRaffle = {
      ...updatedRaffle,
      tiers,
      winners,
    };

    return NextResponse.json({
      success: true,
      raffle: shapedRaffle,
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

    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      return authError;
    }

    await connectDb();

    const [winners, participants, tiers] = await Promise.all([
      Winner.find({ raffleId: id }).lean() as unknown as WinnerDoc[],
      Participant.find({ raffleId: id }).lean() as unknown as ParticipantDoc[],
      Tier.find({ raffleId: id }).sort({ tierOrder: 1 }).lean() as unknown as TierDoc[],
    ]);

    if (winners.length === 0) {
      return NextResponse.json(
        { error: 'No winners found' },
        { status: 404 }
      );
    }

    const participantsById = new Map(participants.map((p) => [p.id, p]));
    const tiersById = new Map(tiers.map((t) => [t.id, t]));

    const shaped = winners
      .map((w) => shapeWinnerRecord(w, participantsById, tiersById))
      .filter(Boolean) as NonNullable<ReturnType<typeof shapeWinnerRecord>>[];

    shaped.sort((a, b) => {
      const tierOrderA = a.tier.tierOrder;
      const tierOrderB = b.tier.tierOrder;
      if (tierOrderA !== tierOrderB) return tierOrderA - tierOrderB;
      return new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime();
    });

    return NextResponse.json({ winners: shaped });
  } catch (error) {
    console.error('Error fetching draw results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draw results' },
      { status: 500 }
    );
  }
}
