const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
router.use(authenticate);

router.get('/monthly', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const month = parseInt(req.query.month || new Date().getMonth() + 1);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id, date: { gte: startDate, lte: endDate } },
      include: { category: true },
    });

    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        const key = t.category.name;
        if (!acc[key]) acc[key] = { name: key, icon: t.category.icon, color: t.category.color, amount: 0, count: 0 };
        acc[key].amount += t.amount;
        acc[key].count += 1;
        return acc;
      }, {});

    res.json({
      period: { year, month },
      summary: {
        income,
        expenses,
        remaining: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      },
      categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
      transactionCount: transactions.length,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/yearly', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id, date: { gte: startDate, lte: endDate } },
      include: { category: true },
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expenses: 0,
    }));

    transactions.forEach(t => {
      const m = new Date(t.date).getMonth();
      if (t.type === 'INCOME') monthlyData[m].income += t.amount;
      else monthlyData[m].expenses += t.amount;
    });

    res.json({ year, monthlyData });
  } catch (err) {
    next(err);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        ...((startDate || endDate) ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate + 'T23:59:59Z') }),
          }
        } : {}),
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const csvRows = [
      ['Date', 'Type', 'Category', 'Amount', 'Notes', 'Recurring'],
      ...transactions.map(t => [
        new Date(t.date).toISOString().split('T')[0],
        t.type,
        t.category.name,
        t.amount.toFixed(2),
        (t.notes || '').replace(/,/g, ';'),
        t.isRecurring ? 'Yes' : 'No',
      ]),
    ];

    const csv = csvRows.map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="budget-export.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
