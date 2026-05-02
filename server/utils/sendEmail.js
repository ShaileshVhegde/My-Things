const nodemailer = require('nodemailer');

/**
 * Send email using Gmail SMTP.
 * Returns { success, messageId?, error? } — NEVER throws.
 */
const sendEmail = async ({ to, subject, html }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    console.warn('[sendEmail] ⚠️ EMAIL_USER or EMAIL_PASSWORD not set — skipping email');
    return { success: false, error: 'Email credentials not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass
      }
    });

    const info = await transporter.sendMail({
      from: `"My Things" <${user}>`,
      to,
      subject,
      html,
    });

    console.log('[sendEmail] ✅ Sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[sendEmail] ❌ FAILED:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
