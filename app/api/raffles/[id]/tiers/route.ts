import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDb, Raffle, Tier } from '@/lib/db';
import { requireRaffleOwnership, isValidPrizeAmount, isValidWinnerCount, sanitizeInput, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/raffles/[id]/tiers - Add new tier
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'TIER_CREATE_UNAUTHORIZED', id);
      return authError;
    }

    const body = await request.json();
    const { prizeName, prizeAmount, winnerCount } = body;

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

    await connectDb();

    const raffle = await Raffle.findOne({ id }).lean();

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    const lastTier = await Tier.find({ raffleId: id })
      .sort({ tierOrder: -1 })
      .limit(1)
      .lean();

    const previousOrder = typeof lastTier[0]?.tierOrder === 'number' ? lastTier[0].tierOrder : -1;
    const tierOrder = previousOrder + 1;

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'TIER_CREATED', id, { prizeName, winnerCount });

    const tierId = randomUUID();
    const now = new Date();

    const tier = {
      id: tierId,
      raffleId: id,
      prizeName: sanitizeInput(prizeName),
      prizeAmount: parseFloat(String(prizeAmount)) || 0,
      winnerCount,
      tierOrder,
      createdAt: now,
    };

    await Tier.create(tier);

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

    await connectDb();

    const update: Record<string, unknown> = {};
    if (prizeName) update.prizeName = sanitizeInput(prizeName);
    if (prizeAmount !== undefined) update.prizeAmount = parseFloat(String(prizeAmount));
    if (winnerCount) update.winnerCount = winnerCount;

    const updated = await Tier.findOneAndUpdate(
      { id: tierId, raffleId: id },
      { $set: update },
      { new: true, lean: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
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

    await connectDb();
    const deleteResult = await Tier.deleteOne({
      id: tierId,
      raffleId: id,
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete tier' },
      { status: 500 }
    );
  }
}
