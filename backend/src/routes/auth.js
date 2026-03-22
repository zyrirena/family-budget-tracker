const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    await seedDefaultCategories(user.id);

    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, currency: true, monthlyBudgetLimit: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function seedDefaultCategories(userId) {
  const defaults = [
    { name: 'Salary',        icon: '💼', color: '#2d9b6e', type: 'INCOME' },
    { name: 'Side Income',   icon: '💰', color: '#639922', type: 'INCOME' },
    { name: 'Housing',       icon: '🏠', color: '#185fa5', type: 'EXPENSE' },
    { name: 'Food',          icon: '🍔', color: '#D85A30', type: 'EXPENSE' },
    { name: 'Transport',     icon: '🚗', color: '#1D9E75', type: 'EXPENSE' },
    { name: 'Utilities',     icon: '💡', color: '#BA7517', type: 'EXPENSE' },
    { name: 'Healthcare',    icon: '🏥', color: '#D4537E', type: 'EXPENSE' },
    { name: 'Entertainment', icon: '🎭', color: '#7F77DD', type: 'EXPENSE' },
    { name: 'Education',     icon: '📚', color: '#3266ad', type: 'EXPENSE' },
    { name: 'Shopping',      icon: '🛍️', color: '#9b2d7f', type: 'EXPENSE' },
    { name: 'Other',         icon: '📦', color: '#888780', type: 'BOTH' },
  ];
  await prisma.category.createMany({
    data: defaults.map(c => ({ ...c, userId, isDefault: true })),
    skipDuplicates: true,
  });
}

module.exports = router;
