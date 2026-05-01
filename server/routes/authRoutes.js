const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

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
        existingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        existingUser.name = name;
        const salt = await bcrypt.genSalt(12);
        existingUser.password = await bcrypt.hash(password, salt);
        await existingUser.save();

        await sendEmail({
          to: email,
          subject: 'My Things  - Verify Your Account',
          html: `<h1>Welcome to My Things </h1><p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
        });

        return res.status(200).json({ message: 'OTP sent to your email. Please verify.' });
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
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });

    await newUser.save();

    await sendEmail({
      to: email,
      subject: 'My Things  - Verify Your Account',
      html: `<h1>Welcome to My Things </h1><p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
    });

    res.status(201).json({ message: 'User created successfully. OTP sent to your email.' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

module.exports = router;
