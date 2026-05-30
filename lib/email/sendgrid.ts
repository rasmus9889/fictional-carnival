import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = process.env.FROM_EMAIL!;
const BASE_URL = process.env.BASE_URL!;

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;

  await sgMail.send({
    to: email,
    from: FROM_EMAIL,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Thanks for signing up! Click the button below to verify your email address and activate your account.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Verify Email
        </a>
        <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #6b7280; font-size: 12px;">Or copy this link: ${verifyUrl}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  await sgMail.send({
    to: email,
    from: FROM_EMAIL,
    subject: 'Reset your password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>We received a request to reset the password for your account. Click the button below to set a new password.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
        <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <p style="color: #6b7280; font-size: 12px;">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });
}

export async function sendDepositConfirmationEmail(
  email: string,
  amountEur: number,
  amountUsd: number,
  newBalanceUsd: number
) {
  await sgMail.send({
    to: email,
    from: FROM_EMAIL,
    subject: 'Wallet top-up confirmed',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Wallet top-up successful</h2>
        <p>Your wallet has been credited with <strong>$${amountUsd.toFixed(4)}</strong>.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Amount paid</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">€${amountEur.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Wallet credit (USD)</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">$${amountUsd.toFixed(4)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">New balance</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">$${newBalanceUsd.toFixed(6)}</td>
          </tr>
        </table>
        <a href="${BASE_URL}/dashboard" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}
