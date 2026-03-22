const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
router.use(authenticate);

const debtSchema = z.object({
  name: z.string().min(1).max(100),
  totalBalance: z.number().positive(),
  currentBalance: z.number().nonnegative(),
  interestRate: z.number().min(0).max(100),
  minimumPayment: z.number().nonnegative(),
  dueDay: z.number().int().min(1).max(31).optional(),
  notes: z.string().max(500).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const debts = await prisma.debt.findMany({
      where: { userId: req.user.id, isActive: true },
      include: { payments: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'asc' },
    });
    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    res.json({ debts, totalDebt });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = debtSchema.parse(req.body);
    const debt = await prisma.debt.create({ data: { ...data, userId: req.user.id } });
    res.status(201).json(debt);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.debt.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Debt not found.' });
    const data = debtSchema.partial().parse(req.body);
    const debt = await prisma.debt.update({ where: { id: req.params.id }, data });
    res.json(debt);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/payments', async (req, res, next) => {
  try {
    const { amount, date, notes } = req.body;
    if (!amount || !date) return res.status(400).json({ error: 'Amount and date required.' });

    const debt = await prisma.debt.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!debt) return res.status(404).json({ error: 'Debt not found.' });

    const [payment, updatedDebt] = await prisma.$transaction([
      prisma.debtPayment.create({
        data: { debtId: debt.id, amount: parseFloat(amount), date: new Date(date), notes },
      }),
      prisma.debt.update({
        where: { id: debt.id },
        data: { currentBalance: Math.max(0, debt.currentBalance - parseFloat(amount)) },
      }),
    ]);

    res.status(201).json({ payment, debt: updatedDebt });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.debt.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Debt not found.' });
    await prisma.debt.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Debt archived.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
