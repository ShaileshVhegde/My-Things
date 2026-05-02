const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { initScheduler } = require('./services/notificationService');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Environment Detection
const isProd = process.env.NODE_ENV === 'production';

// Middleware
const allowedOrigin = isProd 
  ? process.env.FRONTEND_URL 
  : 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (Postman/curl) or the configured frontend origin
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/My Things ';
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => console.error('Error connecting to MongoDB:', err.message));

// Root Route
app.get('/', (req, res) => {
  res.send('My Things  API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initScheduler();
});
