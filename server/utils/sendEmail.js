const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  // Log env vars presence (not values) to help debug Railway config
  console.log('[sendEmail] EMAIL_USER set:', !!process.env.EMAIL_USER);
  console.log('[sendEmail] EMAIL_PASSWORD set:', !!(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS));
  console.log('[sendEmail] Sending to:', to);

  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail shorthand — handles host/port/secure automatically
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
    },
    // Abort if Gmail doesn't respond within 10 seconds
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const mailOptions = {
    from: `"My Things" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('[sendEmail] Message sent:', info.messageId);
};

module.exports = sendEmail;
