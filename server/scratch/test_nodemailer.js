const nodemailer = require('nodemailer');
require('dotenv').config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD;

console.log("Testing Nodemailer with:", user);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass }
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: user,
      to: user, // send to self
      subject: "Nodemailer Test",
      text: "If you see this, Nodemailer is working locally!"
    });
    console.log("✅ Success! Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

test();
