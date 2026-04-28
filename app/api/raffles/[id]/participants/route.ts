import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRaffleOwnership, isValidEmail, sanitizeInput, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/raffles/[id]/participants - Add participants (single or bulk)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'PARTICIPANT_ADD_UNAUTHORIZED', id);
      return authError;
    }

    const body = await request.json();
    const { participants } = body; // Array of { name, email? }

    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'Participants array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (participants.length > 1000) {
      return NextResponse.json(
        { error: 'Cannot add more than 1000 participants at once' },
        { status: 400 }
      );
    }

    // SECURITY: Validate each participant
    const validParticipants = participants.filter((p) => {
      if (typeof p.name !== 'string' || !p.name.trim()) return false;
      if (p.email && !isValidEmail(p.email)) return false;
      return true;
    });

    if (validParticipants.length === 0) {
      return NextResponse.json(
        { error: 'No valid participants provided' },
        { status: 400 }
      );
    }

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'PARTICIPANTS_ADDED', id, { count: validParticipants.length });

    // Create participants, handling duplicates
    const created = [];
    for (const p of validParticipants) {
      try {
        const participant = await prisma.participant.create({
          data: {
            raffleId: id,
            name: sanitizeInput(p.name),
            email: p.email ? sanitizeInput(p.email) : null,
          },
        });
        created.push(participant);
      } catch (error) {
        // Skip duplicate entries (unique constraint)
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
          throw error;
        }
      }
    }

    return NextResponse.json(
      {
        created: created.length,
        total: validParticipants.length,
        participants: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding participants:', error);
    return NextResponse.json(
      { error: 'Failed to add participants' },
      { status: 500 }
    );
  }
}

// GET /api/raffles/[id]/participants - List participants
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      return authError;
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500); // Cap at 500
    const skip = (page - 1) * limit;

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where: { raffleId: id },
        skip,
        take: limit,
        orderBy: { addedAt: 'asc' },
      }),
      prisma.participant.count({ where: { raffleId: id } }),
    ]);

    return NextResponse.json({
      data: participants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// DELETE /api/raffles/[id]/participants/[participantId] - Remove participant
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'PARTICIPANT_DELETE_UNAUTHORIZED', id);
      return authError;
    }

    const url = new URL(request.url);
    const participantId = url.searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'PARTICIPANT_DELETED', id, { participantId });

    await prisma.participant.delete({
      where: { id: participantId, raffleId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json(
      { error: 'Failed to delete participant' },
      { status: 500 }
    );
  }
}
