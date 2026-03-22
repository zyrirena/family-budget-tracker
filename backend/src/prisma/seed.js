const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@familybudget.app' },
    update: {},
    create: {
      name: 'Smith Family',
      email: 'demo@familybudget.app',
      passwordHash,
      currency: 'USD',
    },
  });

  console.log('✅ Created user:', user.email);

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name_userId: { name: 'Salary', userId: user.id } }, update: {}, create: { name: 'Salary', icon: '💼', color: '#2d9b6e', type: 'INCOME', userId: user.id, isDefault: true } }),
    prisma.category.upsert({ where: { name_userId: { name: 'Side Income', userId: user.id } }, update: {}, create: { name: 'Side Income', icon: '💰', color: '#639922', type: 'INCOME', userId: user.id, isDefault: true } }),
    prisma.category.upsert({ where: { name_userId: { name: 'Housing', userId: user.id } }, update: {}, create: { name: 'Housing', icon: '🏠', color: '#185fa5', type: 'EXPENSE', userId: user.id, isDefault: true } }),
    prisma.category.upsert({ where: { name_userId: { name: 'Food', userId: user.id } }, update: {}, create: { name: 'Food', icon: '🍔', color: '#D85A30', type: 'EXPENSE', userId: user.id, isDefault: true } }),
    prisma.category.upsert({ where: { name_userId: { name: 'Transport', userId: user.id } }, update: {}, create: { name: 'Transport', icon: '🚗', color: '#1D9E75', type: 'EXPENSE', userId: user.id, isDefault: true } }),
    prisma.category.upsert({ where: { name_userId: { name: 'Utilities', userId: user.id } }, update: {}, create: { name: 'Utilities', icon: '💡', color: '#BA7517', type: 'EXPENSE', userId: user.id, isDefault: true } }),
    prisma.category.upsert({ where: { name_userId: { name: 'Healthcare', userId: user.id } }, update: {}, create: { name: 'Healthcare', icon: '🏥', color: '#D4537E', type: 'EXPENSE', userId: user.id, isDefault: true } }),
    prisma.category.upsert({ where: { name_userId: { name: 'Entertainment', userId: user.id } }, update: {}, create: { name: 'Entertainment', icon: '🎭', color: '#7F77DD', type: 'EXPENSE', userId: user.id, isDefault: true } }),
    prisma.category.upsert({ where: { name_userId: { name: 'Other', userId: user.id } }, update: {}, create: { name: 'Other', icon: '📦', color: '#888780', type: 'BOTH', userId: user.id, isDefault: true } }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  const [salary, , housing, food, transport, utilities] = categories;

  await prisma.transaction.createMany({
    data: [
      { userId: user.id, categoryId: salary.id, type: 'INCOME', amount: 5200, date: new Date('2026-03-01'), notes: 'March salary' },
      { userId: user.id, categoryId: housing.id, type: 'EXPENSE', amount: 1850, date: new Date('2026-03-02'), notes: 'Monthly rent', isRecurring: true },
      { userId: user.id, categoryId: food.id, type: 'EXPENSE', amount: 420, date: new Date('2026-03-05'), notes: 'Groceries + dining' },
      { userId: user.id, categoryId: transport.id, type: 'EXPENSE', amount: 180, date: new Date('2026-03-08'), notes: 'Gas + metro card' },
      { userId: user.id, categoryId: utilities.id, type: 'EXPENSE', amount: 245, date: new Date('2026-03-10'), notes: 'Electric + internet', isRecurring: true },
    ],
  });
  console.log('✅ Created sample transactions');

  await prisma.debt.createMany({
    data: [
      { userId: user.id, name: 'Visa Credit Card', totalBalance: 5000, currentBalance: 4200, interestRate: 18.99, minimumPayment: 120 },
      { userId: user.id, name: 'Car Loan', totalBalance: 15000, currentBalance: 12500, interestRate: 5.9, minimumPayment: 280 },
    ],
  });
  console.log('✅ Created sample debts');

  await prisma.savingsGoal.createMany({
    data: [
      { userId: user.id, name: 'Emergency Fund', targetAmount: 15000, currentAmount: 4200, icon: '🛡️', color: '#185fa5' },
      { userId: user.id, name: 'Vacation 2026', targetAmount: 3500, currentAmount: 1800, icon: '✈️', color: '#2d9b6e', targetDate: new Date('2026-07-01') },
    ],
  });
  console.log('✅ Created sample savings goals');

  console.log('🎉 Seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
