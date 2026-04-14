import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/raffles/[id]/export - Export winners as CSV
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

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

    raffle.winners.forEach((winner: any) => {
      const row = [
        raffle.id,
        `"${raffle.title.replace(/"/g, '""')}"`,
        raffle.drawnAt?.toISOString() || '',
        `"${winner.participant.name.replace(/"/g, '""')}"`,
        winner.participant.email || '',
        `"${winner.tier.prizeName.replace(/"/g, '""')}"`,
        winner.tier.prizeAmount?.toString() || '0',
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
