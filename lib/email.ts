import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface WinnerEmailData {
  winnerName: string;
  winnerEmail: string;
  raffleName: string;
  prizeName: string;
  prizeAmount: number;
  raffleUrl?: string;
}

export async function sendWinnerEmail(data: WinnerEmailData) {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured - email notifications disabled');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎉 Congratulations!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">You've Won a Prize!</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
            Dear <strong>${data.winnerName}</strong>,
          </p>

          <p style="margin: 0 0 20px 0; font-size: 16px; color: #555; line-height: 1.6;">
            We're thrilled to inform you that you've won the <strong>${data.prizeName}</strong> prize in the <strong>${data.raffleName}</strong> raffle!
          </p>

          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <span style="color: #666;">Prize Tier:</span>
              <strong style="color: #333;">${data.prizeName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Prize Amount:</span>
              <strong style="color: #667eea; font-size: 24px;">₱${data.prizeAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <p style="margin: 20px 0; font-size: 14px; color: #666; text-align: center;">
            Your win has been confirmed and recorded. Please allow 5-7 business days for prize distribution.
          </p>

          ${data.raffleUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.raffleUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                View Full Results
              </a>
            </div>
          ` : ''}

          <p style="margin: 30px 0 0 0; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px;">
            If you have any questions about your prize, please contact the raffle organizer directly.
          </p>
        </div>

        <div style="text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} LocalPro Raffle System. All rights reserved.</p>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@localpro-raffle.com',
      to: data.winnerEmail,
      subject: `🎉 Congratulations! You won ₱${data.prizeAmount.toLocaleString('en-PH')} in the ${data.raffleName}!`,
      html: emailHtml,
    });

    if (result.error) {
      console.error('Email send error:', result.error);
      return { success: false, error: result.error };
    }

    console.log(`✅ Winner email sent to ${data.winnerEmail}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function sendWinnerBatchEmails(
  winners: WinnerEmailData[]
) {
  const results = await Promise.allSettled(
    winners.map((winner) => sendWinnerEmail(winner))
  );
  type WinnerEmailResult = Awaited<ReturnType<typeof sendWinnerEmail>>;

  const successful = results.filter(
    (result): result is PromiseFulfilledResult<WinnerEmailResult> => (
      result.status === 'fulfilled' && result.value.success
    )
  ).length;
  const failed = results.filter((result) => (
    result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
  )).length;

  console.log(`📧 Batch email send complete: ${successful} sent, ${failed} failed`);
  return { successful, failed, results };
}
