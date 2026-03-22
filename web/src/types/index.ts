export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  monthlyBudgetLimit?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  categoryId: string;
  category: Category;
  notes?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  totalBalance: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDay?: number;
  notes?: string;
  isActive: boolean;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  icon: string;
  color: string;
  isCompleted: boolean;
}

export interface AIInsights {
  observation: string;
  tips: string[];
  score: number | null;
  scoreLabel: 'Poor' | 'Fair' | 'Good' | 'Excellent' | null;
}

export interface MonthlySummary {
  income: number;
  expenses: number;
  remaining: number;
  savingsRate: number;
}

export interface MonthlyReport {
  period: { year: number; month: number };
  summary: MonthlySummary;
  categoryBreakdown: Array<{
    name: string;
    icon: string;
    color: string;
    amount: number;
    count: number;
  }>;
  transactionCount: number;
}
