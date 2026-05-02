const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const authMiddleware = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

const router = express.Router();

// TEMP DEBUG: Test if email config is working — hit GET /api/auth/test-email?to=yourname@gmail.com
router.get('/test-email', async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).json({ error: 'Add ?to=youremail@gmail.com in the URL' });
  try {
    await sendEmail({ to, subject: 'My Things Email Test', html: '<p>If you see this, email is working!</p>' });
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me — returns current user with fresh role from DB
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Sync role from ADMIN_EMAILS env
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const expectedRole = adminEmails.includes(user.email.toLowerCase()) ? 'admin' : 'user';
    if (user.role !== expectedRole) {
      user.role = expectedRole;
      await user.save();
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Resolve role based on ADMIN_EMAILS env
const resolveRole = (email) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';
};

// Helper: update user role if needed
const syncUserRole = async (user) => {
  const expectedRole = resolveRole(user.email);
  if (user.role !== expectedRole) {
    user.role = expectedRole;
    await user.save();
  }
  return user;
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'User already exists with this email' });
      } else {
        // Resend OTP if user exists but isn't verified
        const otp = generateOTP();
        existingUser.otp = otp;
        existingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        existingUser.name = name;
        const salt = await bcrypt.genSalt(12);
        existingUser.password = await bcrypt.hash(password, salt);
        await existingUser.save();

        console.log('[DEBUG] OTP for', email, ':', otp);

        // Respond FIRST, then fire email completely outside this call stack
        res.status(200).json({ message: 'OTP sent to your email. Please verify.' });

        setTimeout(() => {
          sendEmail({
            to: email,
            subject: 'My Things - Verify Your Account',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
                  .container { max-width: 500px; margin: 40px auto; background: #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid #334155; }
                  .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 20px; text-align: center; }
                  .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
                  .content { padding: 40px; text-align: center; color: #f1f5f9; }
                  .otp-code { font-size: 42px; font-weight: 800; color: #60a5fa; letter-spacing: 8px; margin: 24px 0; padding: 15px 30px; background: rgba(96, 165, 250, 0.1); border-radius: 12px; display: inline-block; border: 1px dashed #60a5fa; }
                  .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; background: #1a2233; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>My Things</h1>
                  </div>
                  <div class="content">
                    <h2 style="margin-top:0; font-size: 24px;">Verification Code</h2>
                    <p style="color:#94a3b8; line-height: 1.5;">Welcome to <strong>My Things</strong>! Use the secure code below to verify your account and get started.</p>
                    <div class="otp-code">${otp}</div>
                    <p style="font-size:13px; color:#64748b; margin-top: 20px;">This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.</p>
                  </div>
                  <div class="footer">
                    &copy; ${new Date().getFullYear()} My Things - Modern Asset Tracking
                  </div>
                </div>
              </body>
              </html>
            `,
          }).catch(() => {});
        }, 0);
        return;
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      authProvider: 'local',
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await newUser.save();
    console.log('[signup] User created:', newUser.email);
    console.log('[DEBUG] OTP for', email, ':', otp);

    // Send response FIRST — browser gets 201 immediately
    res.status(201).json({ message: 'User created successfully. OTP sent to your email.' });

    // Fire email completely outside request lifecycle
    setTimeout(() => {
      sendEmail({
        to: email,
        subject: 'My Things - Verify Your Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
              .container { max-width: 500px; margin: 40px auto; background: #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid #334155; }
              .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
              .content { padding: 40px; text-align: center; color: #f1f5f9; }
              .otp-code { font-size: 42px; font-weight: 800; color: #60a5fa; letter-spacing: 8px; margin: 24px 0; padding: 15px 30px; background: rgba(96, 165, 250, 0.1); border-radius: 12px; display: inline-block; border: 1px dashed #60a5fa; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; background: #1a2233; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>My Things</h1>
              </div>
              <div class="content">
                <h2 style="margin-top:0; font-size: 24px;">Verification Code</h2>
                <p style="color:#94a3b8; line-height: 1.5;">Welcome to <strong>My Things</strong>! Use the secure code below to verify your account and get started.</p>
                <div class="otp-code">${otp}</div>
                <p style="font-size:13px; color:#64748b; margin-top: 20px;">This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} My Things - Modern Asset Tracking
              </div>
            </div>
          </body>
          </html>
        `,
      }).catch(() => {});
    }, 0);
  } catch (error) {
    console.error('Signup Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'User already verified. Please log in.' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    await syncUserRole(user);

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // ── Welcome in-app notification ──
    await createNotification({
      userId: user._id,
      type: 'welcome',
      message: `🎉 Welcome to My Things, ${user.name}! Your account is verified and ready. Start adding your products to track warranties.`,
    });
    res.status(200).json({
      message: 'Account verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.authProvider !== 'local') {
      return res.status(400).json({ error: `Please log in using ${user.authProvider}` });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first', isVerified: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await syncUserRole(user);

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Fetch user info from Google using the access token
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!googleRes.ok) {
      return res.status(400).json({ error: 'Invalid Google access token' });
    }

    const payload = await googleRes.json();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (user) {
      if (user.authProvider !== 'google') {
        return res.status(400).json({ error: 'Email already exists with a different provider. Please login manually.' });
      }
    } else {
      user = new User({
        name,
        email,
        authProvider: 'google',
        isVerified: true, // OAuth is verified by Google
      });
      await user.save();

      // Welcome in-app notification for new Google user
      await createNotification({
        userId: user._id,
        type: 'welcome',
        message: `🎉 Welcome to My Things, ${user.name}! Your account is verified via Google. Start adding your products to track warranties.`,
      });
    }

    await syncUserRole(user);

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token: jwtToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Internal server error or invalid token' });
  }
});

// ── FORGOT PASSWORD FLOW ─────────────────────────────────────────────────────

// POST /api/auth/forgot-password
// Step 1 — accept email, generate OTP, send it
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond the same way to prevent email enumeration
    if (!user || user.authProvider !== 'local') {
      return res.status(200).json({ message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'My Things — Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
            .container { max-width: 500px; margin: 40px auto; background: #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid #334155; }
            .header { background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px; text-align: center; color: #f1f5f9; }
            .otp-code { font-size: 42px; font-weight: 800; color: #fbbf24; letter-spacing: 8px; margin: 24px 0; padding: 15px 30px; background: rgba(251, 191, 36, 0.1); border-radius: 12px; display: inline-block; border: 1px dashed #fbbf24; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; background: #1a2233; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>My Things</h1>
            </div>
            <div class="content">
              <h2 style="margin-top:0; font-size: 24px;">Password Reset</h2>
              <p style="color:#94a3b8; line-height: 1.5;">We received a request to reset your password. Use the secure code below to proceed.</p>
              <div class="otp-code">${otp}</div>
              <p style="font-size:13px; color:#64748b; margin-top: 20px;">This code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} My Things - Modern Asset Tracking
            </div>
          </div>
        </body>
        </html>
      `,
    });

    res.status(200).json({ message: 'If that email exists, an OTP has been sent.' });
  } catch (err) {
    console.error('[forgot-password]', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/verify-reset-otp
// Step 2 — verify OTP, return a short-lived reset token (NOT a full auth JWT)
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // Clear OTP — it's been used
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Issue a short-lived reset token (5 min) scoped only to password reset
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '5m' }
    );

    res.status(200).json({ resetToken, message: 'OTP verified.' });
  } catch (err) {
    console.error('[verify-reset-otp]', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/reset-password
// Step 3 — set new password (optional — user can skip on the frontend)
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
      return res.status(401).json({ error: 'Reset token is invalid or has expired. Please start again.' });
    }

    if (payload.purpose !== 'password_reset') {
      return res.status(401).json({ error: 'Invalid token purpose.' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Return a full auth JWT so the frontend can log the user in directly
    await syncUserRole(user);
    const authToken = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Password reset successfully.',
      token: authToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[reset-password]', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
