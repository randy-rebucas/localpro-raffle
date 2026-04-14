import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserIdFromRequest } from '@/lib/auth';
import { sendWinnerBatchEmails } from '@/lib/email';

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

    // Prepare email data for unsent winners
    const emailsToSend = raffle.winners
      .filter((w) => w.participant.email)
      .map((w) => ({
        winnerName: w.participant.name,
        winnerEmail: w.participant.email!,
        raffleName: raffle.title,
        prizeName: w.tier.prizeName,
        prizeAmount: Number(w.tier.prizeAmount),
        raffleUrl: `${process.env.NEXTAUTH_URL}/share/${raffle.id}`, // TODO: Get actual share key
      }));

    if (emailsToSend.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No unsent winners with email addresses',
        emailsSent: 0,
      });
    }

    // Send emails
    const result = await sendWinnerBatchEmails(emailsToSend);

    // Mark emails as sent for successful sends
    if (result.successful > 0) {
      const successfulWinnerIds = raffle.winners
        .slice(0, result.successful)
        .map((w) => w.id);

      await prisma.winner.updateMany({
        where: {
          id: { in: successfulWinnerIds },
        },
        data: {
          emailSent: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      emailsSent: result.successful,
      emailsFailed: result.failed,
      message: `Sent ${result.successful} winner emails`,
    });
  } catch (error) {
    console.error('Error sending winner emails:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send emails',
      },
      { status: 500 }
    );
  }
}
