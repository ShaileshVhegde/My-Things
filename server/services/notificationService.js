/**
 * notificationService.js
 *
 * Daily cron job that checks warranty expiry dates and fires:
 *   - In-app notification (DB)      for ALL users
 *   - Email notification            for expiring AND expired products
 *
 * Thresholds: 30 days, 7 days, 1 day before expiry, and 0 (today = expired)
 */

const cron = require('node-cron');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// ─── Email helper ──────────────────────────────────────────────────────────────

const sendExpiryEmail = async ({ to, userName, productName, daysLeft, expiryDate }) => {
  try {
    // Resend will handle its own API key validation inside sendEmail

    const isExpired = daysLeft <= 0;
    const subjectLine = isExpired
      ? `⚠️ Warranty EXPIRED: ${productName}`
      : `🔔 Warranty expiring in ${daysLeft} day${daysLeft === 1 ? '' : 's'}: ${productName}`;

    const urgencyColor = isExpired ? '#ef4444' : daysLeft <= 7 ? '#f97316' : '#eab308';
    const urgencyText = isExpired
      ? 'has <strong>EXPIRED</strong>'
      : `is expiring in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 32px 32px 24px; text-align: center; }
          .header h1 { color: white; font-size: 22px; margin: 0 0 4px; }
          .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; }
          .body { padding: 32px; }
          .badge { display: inline-block; background: ${urgencyColor}22; color: ${urgencyColor}; border: 1px solid ${urgencyColor}44; border-radius: 99px; padding: 4px 14px; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
          .product-card { background: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${urgencyColor}; }
          .product-card h2 { color: #f1f5f9; font-size: 18px; margin: 0 0 8px; }
          .product-card p { color: #94a3b8; font-size: 14px; margin: 0; }
          .cta { text-align: center; margin: 24px 0 0; }
          .cta a { display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; }
          .footer { padding: 20px 32px; text-align: center; color: #475569; font-size: 12px; border-top: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>My Things</h1>
            <p>Warranty & Product Tracker</p>
          </div>
          <div class="body">
            <p style="color:#94a3b8;margin:0 0 16px;">Hi <strong style="color:#f1f5f9">${userName}</strong>,</p>
            <span class="badge">${isExpired ? 'EXPIRED' : daysLeft <= 7 ? 'URGENT' : 'REMINDER'}</span>
            <div class="product-card">
              <h2>${productName}</h2>
              <p>The warranty ${urgencyText} on <strong>${new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
            </div>
            ${isExpired
              ? '<p style="color:#94a3b8;font-size:14px;">The warranty period has passed. You may want to check manufacturer extended warranty options or consider a replacement plan.</p>'
              : '<p style="color:#94a3b8;font-size:14px;">Please take necessary action — contact the store or manufacturer before the warranty expires to service or replace this item.</p>'
            }
            <div class="cta">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/products">View in My Things →</a>
            </div>
          </div>
          <div class="footer">
            You're receiving this because you track this product in My Things.<br />
            © ${new Date().getFullYear()} My Things
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({ to, subject: subjectLine, html });
    console.log(`[notificationService] Email sent to ${to} — ${subjectLine}`);
  } catch (err) {
    console.error('[notificationService] Failed to send email:', err.message);
  }
};

// ─── Core check ───────────────────────────────────────────────────────────────

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

      const diffDays = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // ── Expiring soon thresholds: 30d, 7d, 1d ──
      const warningDays = [30, 7, 1];
      if (warningDays.includes(diffDays)) {
        await createExpiryNotification(product, 'expiry_warning', diffDays);
      }

      // ── Expired today (diffDays === 0) ──
      if (diffDays === 0) {
        await createExpiryNotification(product, 'expiry', 0);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error:', err);
  }
};

// ─── Create in-app + email ─────────────────────────────────────────────────────

const createExpiryNotification = async (product, type, daysLeft) => {
  const user = product.userId;
  const isExpired = daysLeft === 0;
  const expiryDateStr = new Date(product.warrantyExpiryDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const message = isExpired
    ? `⚠️ "${product.productName}" warranty has EXPIRED today (${expiryDateStr}).`
    : `🔔 "${product.productName}" warranty expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${expiryDateStr}).`;

  // Check if we already sent this exact notification today (dedup)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const existing = await Notification.findOne({
    userId: user._id,
    productId: product._id,
    type,
    createdAt: { $gte: startOfDay },
  });

  if (existing) return; // already notified today

  // ── Save in-app notification ──
  await Notification.create({
    userId: user._id,
    productId: product._id,
    message,
    type,
  });

  // ── Send email ──
  if (user.email) {
    await sendExpiryEmail({
      to: user.email,
      userName: user.name || 'User',
      productName: product.productName,
      daysLeft,
      expiryDate: product.warrantyExpiryDate,
    });
  }
};

// ─── Scheduler ────────────────────────────────────────────────────────────────

const initScheduler = () => {
  // Run once a day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    checkWarranties();
  });
  console.log('[Scheduler] Daily warranty check scheduled for 09:00 AM (30d/7d/1d warnings + expiry)');
};

module.exports = { initScheduler, checkWarranties };
