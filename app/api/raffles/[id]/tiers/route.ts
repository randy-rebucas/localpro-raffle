import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRaffleOwnership, isValidPrizeAmount, isValidWinnerCount, sanitizeInput, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/raffles/[id]/tiers - Add new tier
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'TIER_CREATE_UNAUTHORIZED', id);
      return authError;
    }

    const body = await request.json();
    const { prizeName, prizeAmount, winnerCount } = body;

    // SECURITY: Validate inputs
    if (!prizeName || typeof prizeName !== 'string') {
      return NextResponse.json(
        { error: 'Prize name is required' },
        { status: 400 }
      );
    }

    if (!isValidWinnerCount(winnerCount)) {
      return NextResponse.json(
        { error: 'Winner count must be between 1 and 10000' },
        { status: 400 }
      );
    }

    if (!isValidPrizeAmount(prizeAmount)) {
      return NextResponse.json(
        { error: 'Prize amount must be between 0 and 999,999,999' },
        { status: 400 }
      );
    }

    // Verify raffle exists
    const raffle = await prisma.raffle.findUnique({
      where: { id },
    });

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    // Get next tier order - find the maximum tierOrder and add 1
    const maxTier = await prisma.tier.aggregate({
      where: { raffleId: id },
      _max: { tierOrder: true },
    });

    const tierOrder = (maxTier._max.tierOrder ?? -1) + 1;

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'TIER_CREATED', id, { prizeName, winnerCount });

    const tier = await prisma.tier.create({
      data: {
        raffleId: id,
        prizeName: sanitizeInput(prizeName),
        prizeAmount: parseFloat(String(prizeAmount)) || 0,
        winnerCount,
        tierOrder,
      },
    });

    return NextResponse.json(tier, { status: 201 });
  } catch (error) {
    console.error('Error creating tier:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create tier';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/raffles/[id]/tiers/[tierId] - Update tier
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'TIER_UPDATE_UNAUTHORIZED', id);
      return authError;
    }

    const url = new URL(request.url);
    const tierId = url.searchParams.get('tierId');

    if (!tierId) {
      return NextResponse.json(
        { error: 'Tier ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { prizeName, prizeAmount, winnerCount } = body;

    // SECURITY: Validate inputs
    if (prizeAmount !== undefined && !isValidPrizeAmount(prizeAmount)) {
      return NextResponse.json(
        { error: 'Prize amount must be between 0 and 999,999,999' },
        { status: 400 }
      );
    }

    if (winnerCount !== undefined && !isValidWinnerCount(winnerCount)) {
      return NextResponse.json(
        { error: 'Winner count must be between 1 and 10000' },
        { status: 400 }
      );
    }

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'TIER_UPDATED', id, { tierId });

    const tier = await prisma.tier.update({
      where: { id: tierId, raffleId: id },
      data: {
        ...(prizeName && { prizeName: sanitizeInput(prizeName) }),
        ...(prizeAmount !== undefined && { prizeAmount: parseFloat(String(prizeAmount)) }),
        ...(winnerCount && { winnerCount }),
      },
    });

    return NextResponse.json(tier);
  } catch (error) {
    console.error('Error updating tier:', error);
    return NextResponse.json(
      { error: 'Failed to update tier' },
      { status: 500 }
    );
  }
}

// DELETE /api/raffles/[id]/tiers/[tierId] - Delete tier
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this raffle
    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'TIER_DELETE_UNAUTHORIZED', id);
      return authError;
    }

    const url = new URL(request.url);
    const tierId = url.searchParams.get('tierId');

    if (!tierId) {
      return NextResponse.json(
        { error: 'Tier ID is required' },
        { status: 400 }
      );
    }

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'TIER_DELETED', id, { tierId });

    await prisma.tier.delete({
      where: { id: tierId, raffleId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete tier' },
      { status: 500 }
    );
  }
}
