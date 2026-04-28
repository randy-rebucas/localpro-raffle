import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserIdFromRequest } from '@/lib/auth';
import { sendWinnerEmail } from '@/lib/email';
import { generateSecureShareKey } from '@/lib/security';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getCurrentUserIdFromRequest(req);
    const { id } = await params;

    // Verify ownership and raffle status
    const raffle = await prisma.raffle.findUnique({
      where: { id },
      include: {
        winners: {
          where: { emailSent: false },
          include: {
            participant: true,
            tier: true,
          },
        },
      },
    });

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

    let share = await prisma.raffleShare.findFirst({
      where: { raffleId: id },
    });

    if (!share) {
      share = await prisma.raffleShare.create({
        data: {
          raffleId: id,
          shareKey: generateSecureShareKey(),
        },
      });
    }

    const raffleUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${share.shareKey}`;

    // Prepare email data for unsent winners
    const emailsToSend = raffle.winners
      .filter((w) => w.participant.email)
      .map((winner) => ({
        winnerId: winner.id,
        email: {
          winnerName: winner.participant.name,
          winnerEmail: winner.participant.email!,
          raffleName: raffle.title,
          prizeName: winner.tier.prizeName,
          prizeAmount: Number(winner.tier.prizeAmount),
          raffleUrl,
        },
      }));

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
      await prisma.winner.updateMany({
        where: {
          id: { in: successfulWinnerIds },
        },
        data: {
          emailSent: true,
        },
      });
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
