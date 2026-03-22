const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
router.use(authenticate);

const savingsSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().optional().default(0),
  targetDate: z.string().optional(),
  icon: z.string().optional().default('🎯'),
  color: z.string().optional().default('#185fa5'),
});

router.get('/', async (req, res, next) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.user.id },
      include: { contributions: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'asc' },
    });
    const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    res.json({ goals, totalSaved, totalTarget });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = savingsSchema.parse(req.body);
    const goal = await prisma.savingsGoal.create({
      data: {
        ...data,
        userId: req.user.id,
        ...(data.targetDate && { targetDate: new Date(data.targetDate) }),
      },
    });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/contribute', async (req, res, next) => {
  try {
    const { amount, date, notes } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required.' });

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!goal) return res.status(404).json({ error: 'Savings goal not found.' });

    const newAmount = goal.currentAmount + parseFloat(amount);
    const isCompleted = newAmount >= goal.targetAmount;

    const [contribution, updated] = await prisma.$transaction([
      prisma.savingsContribution.create({
        data: { goalId: goal.id, amount: parseFloat(amount), date: new Date(date || new Date()), notes },
      }),
      prisma.savingsGoal.update({
        where: { id: goal.id },
        data: { currentAmount: newAmount, isCompleted },
      }),
    ]);

    res.status(201).json({ contribution, goal: updated });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Savings goal not found.' });
    const data = savingsSchema.partial().parse(req.body);
    const goal = await prisma.savingsGoal.update({ where: { id: req.params.id }, data });
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Savings goal not found.' });
    await prisma.savingsGoal.delete({ where: { id: req.params.id } });
    res.json({ message: 'Savings goal deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
