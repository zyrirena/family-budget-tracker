const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive().max(999999999),
  date: z.string(),
  categoryId: z.string(),
  notes: z.string().max(500).optional(),
  isRecurring: z.boolean().optional().default(false),
});

router.get('/', async (req, res, next) => {
  try {
    const { type, categoryId, startDate, endDate, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(type && { type }),
      ...(categoryId && { categoryId }),
      ...(search && { notes: { contains: search, mode: 'insensitive' } }),
      ...((startDate || endDate) ? {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate + 'T23:59:59.999Z') }),
        }
      } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = transactionSchema.parse(req.body);
    const transaction = await prisma.transaction.create({
      data: { ...data, userId: req.user.id, date: new Date(data.date) },
      include: { category: true },
    });
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = transactionSchema.partial().parse(req.body);
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Transaction not found.' });

    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { ...data, ...(data.date && { date: new Date(data.date) }) },
      include: { category: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Transaction not found.' });

    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ message: 'Transaction deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
