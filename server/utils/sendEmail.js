const nodemailer = require('nodemailer');

/**
 * Send email using Gmail SMTP.
 * Returns { success, messageId?, error? } — NEVER throws.
 * This is critical: callers must not crash if email fails.
 */
const sendEmail = async ({ to, subject, html }) => {
  // Guard: if email config is missing, log and return silently
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('[sendEmail] ⚠️ EMAIL_USER or EMAIL_PASSWORD not set — skipping email');
    return { success: false, error: 'Email credentials not configured' };
  }

  console.log('[sendEmail] Sending to:', to, 'from:', user);

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"My Things" <${user}>`,
      to,
      subject,
      html,
    });

    console.log('[sendEmail] ✅ Sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[sendEmail] ❌ FAILED:', error.code || 'UNKNOWN', error.message);
    // Return error info — NEVER throw. Callers handle gracefully.
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
