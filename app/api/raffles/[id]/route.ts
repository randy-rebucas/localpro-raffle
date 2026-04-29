import { NextRequest, NextResponse } from 'next/server';
import { connectDb, Participant, Raffle, RaffleShare, Tier, Winner } from '@/lib/db';
import { requireRaffleOwnership, isValidRaffleTitle, sanitizeInput, logSecurityEvent } from '@/lib/security';
import { getSessionUser } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/raffles/[id] - Get single raffle
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      return authError;
    }

    await connectDb();

    const [raffle, tiers, participants, participantCount, winnerCount] = await Promise.all([
      Raffle.findOne({ id }).lean(),
      Tier.find({ raffleId: id }).sort({ tierOrder: 1 }).lean(),
      Participant.find({ raffleId: id }).sort({ addedAt: 1 }).lean(),
      Participant.countDocuments({ raffleId: id }),
      Winner.countDocuments({ raffleId: id }),
    ]);

    if (!raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...raffle,
      tiers,
      participants,
      _count: {
        participants: participantCount,
        winners: winnerCount,
      },
    });
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

    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'RAFFLE_UPDATE_UNAUTHORIZED', id);
      return authError;
    }

    const body = await request.json();
    const { title, description, status } = body;

    if (!isValidRaffleTitle(title)) {
      return NextResponse.json(
        { error: 'Invalid raffle title' },
        { status: 400 }
      );
    }

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'RAFFLE_UPDATED', id, { status });

    await connectDb();

    const update: Record<string, unknown> = {
      title: sanitizeInput(title),
      description: description ? sanitizeInput(description) : null,
    };

    if (status) {
      update.status = status;
    }

    const updated = await Raffle.findOneAndUpdate({ id }, { $set: update }, { new: true, lean: true });

    if (!updated) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    const tiers = await Tier.find({ raffleId: id }).sort({ tierOrder: 1 }).lean();

    return NextResponse.json({
      ...updated,
      tiers,
    });
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

    const authError = await requireRaffleOwnership(request, id);
    if (authError) {
      const user = await getSessionUser(request);
      logSecurityEvent(user?.id || 'unknown', 'RAFFLE_DELETE_UNAUTHORIZED', id);
      return authError;
    }

    const user = await getSessionUser(request);
    logSecurityEvent(user?.id || 'unknown', 'RAFFLE_DELETED', id);

    await connectDb();

    await Winner.deleteMany({ raffleId: id });
    await RaffleShare.deleteMany({ raffleId: id });
    await Participant.deleteMany({ raffleId: id });
    await Tier.deleteMany({ raffleId: id });

    const deleteResult = await Raffle.deleteOne({ id });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting raffle:', error);
    return NextResponse.json(
      { error: 'Failed to delete raffle' },
      { status: 500 }
    );
  }
}
