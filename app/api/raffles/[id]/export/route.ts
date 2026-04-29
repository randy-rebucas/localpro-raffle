import { NextRequest, NextResponse } from 'next/server';
import { connectDb, Participant, Raffle, Tier, Winner } from '@/lib/db';
import { requireRaffleOwnership } from '@/lib/security';
import { escapeCsvCell } from '@/utils/csv';

interface ExportWinner {
  participant: {
    name: string;
    email: string | null;
  };
  tier: {
    prizeName: string;
    prizeAmount: unknown;
  };
}

interface Params {
  params: Promise<{ id: string }>;
}

type ParticipantDoc = { id: string; name: string; email?: string | null };
type TierDoc = { id: string; prizeName: string; prizeAmount?: number; tierOrder: number };
type WinnerDoc = {
  tierId: string;
  participantId: string;
  drawnAt: Date;
};

// GET /api/raffles/[id]/export - Export winners as CSV
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      return authError;
    }

    await connectDb();

    const [raffle, winners, participants, tiers] = await Promise.all([
      Raffle.findOne({ id }).lean(),
      Winner.find({ raffleId: id }).lean() as unknown as WinnerDoc[],
      Participant.find({ raffleId: id }).lean() as unknown as ParticipantDoc[],
      Tier.find({ raffleId: id }).lean() as unknown as TierDoc[],
    ]);

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    if (winners.length === 0) {
      return NextResponse.json(
        { error: 'No winners to export' },
        { status: 400 }
      );
    }

    const participantsById = new Map(participants.map((p) => [p.id, p]));
    const tiersById = new Map(tiers.map((t) => [t.id, t]));

    const winnerOrdering = [...winners].sort((wa, wb) => {
      const tierA = tiersById.get(wa.tierId);
      const tierB = tiersById.get(wb.tierId);
      const orderA = tierA?.tierOrder ?? 0;
      const orderB = tierB?.tierOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(wa.drawnAt).getTime() - new Date(wb.drawnAt).getTime();
    });

    const orderedExport: ExportWinner[] = [];

    for (const winner of winnerOrdering) {
      const participant = participantsById.get(winner.participantId);
      const tier = tiersById.get(winner.tierId);
      if (!participant || !tier) continue;

      orderedExport.push({
        participant: {
          name: participant.name,
          email: participant.email ?? null,
        },
        tier: {
          prizeName: tier.prizeName,
          prizeAmount: tier.prizeAmount ?? 0,
        },
      });
    }

    const drawnAtIso =
      raffle.drawnAt instanceof Date
        ? raffle.drawnAt.toISOString()
        : raffle.drawnAt
          ? new Date(raffle.drawnAt as string).toISOString()
          : '';

    const csvRows: string[] = [];
    csvRows.push(
      'Raffle ID,Raffle Title,Drawn Date,Winner Name,Winner Email,Prize Name,Prize Amount'
    );

    orderedExport.forEach((winner: ExportWinner) => {
      const row = [
        escapeCsvCell(String(raffle.id)),
        escapeCsvCell(String(raffle.title)),
        escapeCsvCell(drawnAtIso),
        escapeCsvCell(winner.participant.name),
        escapeCsvCell(winner.participant.email),
        escapeCsvCell(winner.tier.prizeName),
        escapeCsvCell(String(winner.tier.prizeAmount || '0')),
      ].join(',');

      csvRows.push(row);
    });

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="raffle-${id}-winners.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting winners:', error);
    return NextResponse.json(
      { error: 'Failed to export winners' },
      { status: 500 }
    );
  }
}
