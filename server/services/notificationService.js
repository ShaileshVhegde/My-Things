const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Configure nodemailer (Ensure EMAIL_USER and EMAIL_PASSWORD are set in .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Replace with App Password if using Gmail
  },
});

/**
 * Send an email using nodemailer
 */
const sendEmail = async (to, subject, text) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email credentials not configured. Skipping email to:', to);
      return;
    }
    await transporter.sendMail({
      from: `"Home Track Notifications" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

/**
 * The scheduled job that checks for expiries
 */
const checkWarranties = async () => {
  console.log('[Scheduler] Running daily warranty check...');
  try {
    const products = await Product.find({}).populate('userId', 'email name');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const product of products) {
      if (!product.warrantyExpiryDate || !product.userId) continue;

      const expiryDate = new Date(product.warrantyExpiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check for exactly 7 days
      if (diffDays === 7) {
        await createNotificationAndEmail(
          product,
          'reminder',
          `Your product "${product.productName}" is expiring in 7 days (${expiryDate.toDateString()}). Please take necessary action.`
        );
      }
      
      // Check for exactly 0 days (today)
      if (diffDays === 0) {
        await createNotificationAndEmail(
          product,
          'expiry',
          `Your product "${product.productName}" warranty expires TODAY (${expiryDate.toDateString()}).`
        );
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error running warranty check:', err);
  }
};

/**
 * Creates a notification in the DB and sends an email if it wasn't already sent.
 */
const createNotificationAndEmail = async (product, type, message) => {
  // Check if notification already exists to avoid duplicates
  const existing = await Notification.findOne({
    userId: product.userId._id,
    productId: product._id,
    type,
    message
  });

  if (!existing) {
    // Create in DB
    await Notification.create({
      userId: product.userId._id,
      productId: product._id,
      message,
      type
    });

    // Send Email
    if (product.userId.email) {
      await sendEmail(
        product.userId.email,
        'Warranty Expiry Reminder',
        message
      );
    }
  }
};

/**
 * Initialize the cron job
 */
const initScheduler = () => {
  // Run once a day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    checkWarranties();
  });
  console.log('[Scheduler] Daily warranty check scheduled for 09:00 AM');
  
  // Also run immediately on startup (for testing purposes, optional)
  // checkWarranties();
};

module.exports = { initScheduler, checkWarranties };
