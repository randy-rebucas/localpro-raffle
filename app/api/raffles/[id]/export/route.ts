import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

// GET /api/raffles/[id]/export - Export winners as CSV
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

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
      },
    });

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    if (raffle.winners.length === 0) {
      return NextResponse.json(
        { error: 'No winners to export' },
        { status: 400 }
      );
    }

    // Generate CSV content
    const csvRows: string[] = [];
    csvRows.push(
      'Raffle ID,Raffle Title,Drawn Date,Winner Name,Winner Email,Prize Name,Prize Amount'
    );

    raffle.winners.forEach((winner: ExportWinner) => {
      const row = [
        escapeCsvCell(raffle.id),
        escapeCsvCell(raffle.title),
        escapeCsvCell(raffle.drawnAt?.toISOString()),
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
