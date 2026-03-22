require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const debtRoutes = require('./routes/debts');
const savingsRoutes = require('./routes/savings');
const reportsRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use(limiter);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Budget Tracker API running on port ${PORT}`);
});
