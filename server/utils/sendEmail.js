const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  console.log('[sendEmail] EMAIL_USER:', process.env.EMAIL_USER);
  console.log('[sendEmail] EMAIL_PASSWORD set:', !!(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS));
  console.log('[sendEmail] Sending to:', to);

  // Try port 587 (STARTTLS) — Railway often blocks port 465 (SSL)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,       // false = STARTTLS (upgrades to TLS after handshake)
    requireTLS: true,    // Force TLS upgrade, don't allow plain text
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  const mailOptions = {
    from: `"My Things" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[sendEmail] ✅ Message sent:', info.messageId);
  } catch (error) {
    // Log full error so Railway logs show exactly what failed
    console.error('[sendEmail] ❌ FAILED:', error.code, error.message);
    throw error;
  }
};

module.exports = sendEmail;
