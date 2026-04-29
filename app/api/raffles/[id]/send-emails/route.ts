import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { connectDb, Participant, Raffle, RaffleShare, Tier, Winner } from '@/lib/db';
import { isDuplicateKeyError } from '@/lib/mongo-errors';
import { getCurrentUserIdFromRequest } from '@/lib/auth';
import { sendWinnerEmail } from '@/lib/email';
import { generateSecureShareKey } from '@/lib/security';

interface Params {
  params: Promise<{ id: string }>;
}

type ParticipantDoc = { id: string; name: string; email?: string | null };
type TierDoc = { id: string; prizeName: string; prizeAmount?: number };
type WinnerDoc = {
  id: string;
  raffleId: string;
  tierId: string;
  participantId: string;
  emailSent: boolean;
};

export async function POST(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getCurrentUserIdFromRequest(req);
    const { id } = await params;

    await connectDb();

    const raffle = await Raffle.findOne({ id }).lean();

    if (!raffle || raffle.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (raffle.status !== 'DRAWN') {
      return NextResponse.json(
        { error: 'Raffle must be drawn before sending emails' },
        { status: 400 }
      );
    }

    const [winners, participants, tiers] = await Promise.all([
      Winner.find({ raffleId: id, emailSent: false }).lean() as unknown as WinnerDoc[],
      Participant.find({ raffleId: id }).lean() as unknown as ParticipantDoc[],
      Tier.find({ raffleId: id }).lean() as unknown as TierDoc[],
    ]);

    const existingShare = await RaffleShare.findOne({ raffleId: id }).lean();
    let shareKey =
      existingShare && typeof existingShare.shareKey === 'string' ? existingShare.shareKey : undefined;

    if (!shareKey) {
      const now = new Date();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const nextShareKey = generateSecureShareKey();
        const shareId = randomUUID();

        try {
          await RaffleShare.create({
            id: shareId,
            raffleId: id,
            shareKey: nextShareKey,
            createdAt: now,
          });
          shareKey = nextShareKey;
          break;
        } catch (error) {
          if (isDuplicateKeyError(error)) {
            continue;
          }
          throw error;
        }
      }

      if (!shareKey) {
        return NextResponse.json(
          { error: 'Failed to create share link' },
          { status: 500 }
        );
      }
    }

    const raffleUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareKey}`;

    const participantsById = new Map(participants.map((p) => [p.id, p]));
    const tiersById = new Map(tiers.map((t) => [t.id, t]));

    const emailsToSend = winners
      .map((winner) => {
        const participant = participantsById.get(winner.participantId);
        const tier = tiersById.get(winner.tierId);
        if (!participant?.email || !tier) return null;

        return {
          winnerId: winner.id,
          email: {
            winnerName: participant.name,
            winnerEmail: participant.email,
            raffleName: String(raffle.title),
            prizeName: tier.prizeName,
            prizeAmount: Number(tier.prizeAmount ?? 0),
            raffleUrl,
          },
        };
      })
      .filter(Boolean) as Array<{ winnerId: string; email: Parameters<typeof sendWinnerEmail>[0] }>;

    if (emailsToSend.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No unsent winners with email addresses',
        emailsSent: 0,
      });
    }

    const results = await Promise.all(
      emailsToSend.map(async ({ winnerId, email }) => ({
        winnerId,
        result: await sendWinnerEmail(email),
      }))
    );
    const successfulWinnerIds = results
      .filter(({ result }) => result.success)
      .map(({ winnerId }) => winnerId);

    if (successfulWinnerIds.length > 0) {
      await Winner.updateMany(
        {
          id: { $in: successfulWinnerIds },
          raffleId: id,
        },
        { $set: { emailSent: true } }
      );
    }

    const failed = results.length - successfulWinnerIds.length;

    return NextResponse.json({
      success: true,
      emailsSent: successfulWinnerIds.length,
      emailsFailed: failed,
      message: `Sent ${successfulWinnerIds.length} winner emails`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Error sending winner emails:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send emails',
      },
      { status: 500 }
    );
  }
}
