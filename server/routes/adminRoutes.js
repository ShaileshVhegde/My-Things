const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// All routes require admin
router.use(isAdmin);

// GET /api/admin/users - All users with aggregated product stats
router.get('/users', async (req, res) => {
  try {
    const { search = '', filter = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build user filter
    const userFilter = {};
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    // Aggregation pipeline
    const pipeline = [
      { $match: userFilter },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'userId',
          as: 'products'
        }
      },
      {
        $addFields: {
          totalProducts: { $size: '$products' },
          activeCount: {
            $size: {
              $filter: {
                input: '$products',
                as: 'p',
                cond: { $gt: ['$$p.warrantyExpiryDate', new Date()] }
              }
            }
          },
          expiredCount: {
            $size: {
              $filter: {
                input: '$products',
                as: 'p',
                cond: { $lte: ['$$p.warrantyExpiryDate', today] }
              }
            }
          },
          expiringSoonCount: {
            $size: {
              $filter: {
                input: '$products',
                as: 'p',
                cond: {
                  $and: [
                    { $gt: ['$$p.warrantyExpiryDate', today] },
                    { $lte: ['$$p.warrantyExpiryDate', sevenDaysLater] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          password: 0,
          otp: 0,
          otpExpires: 0,
          products: 0
        }
      }
    ];

    // Apply filter
    if (filter === 'active') {
      pipeline.push({ $match: { activeCount: { $gt: 0 } } });
    } else if (filter === 'expired') {
      pipeline.push({ $match: { expiredCount: { $gt: 0 } } });
    } else if (filter === 'expiring') {
      pipeline.push({ $match: { expiringSoonCount: { $gt: 0 } } });
    }

    // Sort by createdAt desc
    pipeline.push({ $sort: { createdAt: -1 } });

    // Count total (for pagination) - run without skip/limit
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const users = await User.aggregate(pipeline);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/:id - Single user with product details
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId).select('-password -otp -otpExpires');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    const products = await Product.find({ userId }).select(
      'productName category warrantyExpiryDate purchaseDate documents createdAt'
    ).lean();

    const stats = {
      total: products.length,
      active: products.filter(p => p.warrantyExpiryDate > today).length,
      expired: products.filter(p => p.warrantyExpiryDate <= today).length,
      expiringSoon: products.filter(p => p.warrantyExpiryDate > today && p.warrantyExpiryDate <= sevenDaysLater).length
    };

    res.json({ user, products, stats });
  } catch (error) {
    console.error('Admin User Detail Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats - Global platform stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    const [totalUsers, totalProducts, expiredProducts, expiringSoonProducts] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ warrantyExpiryDate: { $lte: today } }),
      Product.countDocuments({ warrantyExpiryDate: { $gt: today, $lte: sevenDaysLater } })
    ]);

    res.json({
      totalUsers,
      totalProducts,
      activeProducts: totalProducts - expiredProducts,
      expiredProducts,
      expiringSoonProducts
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users - Create new user (admin)
router.post('/users', async (req, res) => {
  try {
    const { name, email, role = 'user', password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    // Resolve role from ADMIN_EMAILS env
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const resolvedRole = adminEmails.includes(email.toLowerCase()) ? 'admin' : role;

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: resolvedRole,
      authProvider: 'local',
      isVerified: true, // admin-created users are pre-verified
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Admin Create User Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id - Update user info
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { name, email, role } = req.body;

    // Prevent admin from revoking their own admin role
    if (userId === req.user.id && role && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot remove your own admin role' });
    }

    // Check email uniqueness if changing email
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existing) {
        return res.status(409).json({ error: 'Email is already in use by another account' });
      }
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role && ['user', 'admin'].includes(role)) updates.role = role;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpires');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Admin Update User Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id - Delete user + all their products
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete all products owned by this user
    const productResult = await Product.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      message: `User "${user.name}" and ${productResult.deletedCount} product(s) deleted successfully`
    });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

