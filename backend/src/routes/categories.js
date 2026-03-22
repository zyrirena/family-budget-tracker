const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { OR: [{ userId: req.user.id }, { isDefault: true, userId: req.user.id }] },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(50),
      icon: z.string().optional().default('📦'),
      color: z.string().optional().default('#888780'),
      type: z.enum(['INCOME', 'EXPENSE', 'BOTH']),
    });
    const data = schema.parse(req.body);
    const category = await prisma.category.create({
      data: { ...data, userId: req.user.id },
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const cat = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id, isDefault: false },
    });
    if (!cat) return res.status(404).json({ error: 'Category not found or cannot delete default.' });
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
