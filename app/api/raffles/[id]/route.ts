import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRaffleOwnership, isValidRaffleTitle, sanitizeInput, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/raffles/[id] - Get single raffle
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const raffle = await prisma.raffle.findUnique({
      where: { id },
      include: {
        tiers: {
          orderBy: { tierOrder: 'asc' },
        },
        participants: true,
        _count: {
          select: { participants: true, winners: true },
        },
      },
    });

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(raffle);
  } catch (error) {
    console.error('Error fetching raffle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch raffle' },
      { status: 500 }
    );
  }
}

// PUT /api/raffles/[id] - Update raffle
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'RAFFLE_UPDATE_UNAUTHORIZED', id);
      return authError;
    }

    const body = await request.json();
    const { title, description, status } = body;

    // SECURITY: Validate inputs
    if (!isValidRaffleTitle(title)) {
      return NextResponse.json(
        { error: 'Invalid raffle title' },
        { status: 400 }
      );
    }

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'RAFFLE_UPDATED', id, { status });

    const raffle = await prisma.raffle.update({
      where: { id },
      data: {
        title: sanitizeInput(title),
        description: description ? sanitizeInput(description) : null,
        ...(status && { status }),
      },
      include: {
        tiers: {
          orderBy: { tierOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(raffle);
  } catch (error) {
    console.error('Error updating raffle:', error);
    return NextResponse.json(
      { error: 'Failed to update raffle' },
      { status: 500 }
    );
  }
}

// DELETE /api/raffles/[id] - Delete raffle
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'RAFFLE_DELETE_UNAUTHORIZED', id);
      return authError;
    }

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'RAFFLE_DELETED', id);

    await prisma.raffle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting raffle:', error);
    return NextResponse.json(
      { error: 'Failed to delete raffle' },
      { status: 500 }
    );
  }
}
