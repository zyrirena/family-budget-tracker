const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.use(authenticate);

router.get('/insights', async (req, res, next) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [transactions, debts, savings] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user.id, date: { gte: threeMonthsAgo } },
        include: { category: { select: { name: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.debt.findMany({ where: { userId: req.user.id, isActive: true } }),
      prisma.savingsGoal.findMany({ where: { userId: req.user.id } }),
    ]);

    if (transactions.length === 0) {
      return res.json({
        observation: 'Add some transactions to get personalized AI insights!',
        tips: ['Track your first transaction to get started'],
        score: null,
        scoreLabel: null,
      });
    }

    const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    const catBreakdown = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        const k = t.category.name;
        acc[k] = (acc[k] || 0) + t.amount;
        return acc;
      }, {});

    const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);
    const totalSaved = savings.reduce((s, g) => s + g.currentAmount, 0);
    const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0;

    const prompt = `You are a friendly personal finance advisor analyzing a family's budget data.

FINANCIAL SUMMARY (last 3 months):
- Total income: $${income.toFixed(2)}
- Total expenses: $${expenses.toFixed(2)}
- Savings rate: ${savingsRate}%
- Total debt: $${totalDebt.toFixed(2)}
- Total saved: $${totalSaved.toFixed(2)}
- Expense breakdown: ${JSON.stringify(catBreakdown, null, 2)}

Provide:
1. A brief 1-2 sentence overall financial health observation
2. 3-4 specific, actionable tips to improve their savings
3. A "financial health score" out of 100

Respond in this exact JSON format (no markdown):
{
  "observation": "string",
  "tips": ["tip1", "tip2", "tip3"],
  "score": number,
  "scoreLabel": "Poor|Fair|Good|Excellent"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].text;
    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (err) {
    console.error('AI insights error:', err);
    res.json({
      observation: 'AI insights temporarily unavailable.',
      tips: [
        'Track your spending consistently',
        'Aim to save 20% of your income',
        'Pay off high-interest debt first',
      ],
      score: null,
      scoreLabel: null,
    });
  }
});

module.exports = router;
