'use client';

import { useEffect, useState } from 'react';
import { reportsApi, transactionsApi, aiApi } from '@/lib/api';
import type { MonthlyReport, Transaction, AIInsights } from '@/types';

export default function DashboardPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      reportsApi.monthly(now.getFullYear(), now.getMonth() + 1),
      transactionsApi.list({ limit: 5 }),
      aiApi.insights(),
    ])
      .then(([reportRes, txRes, aiRes]) => {
        setReport(reportRes.data);
        setRecentTx(txRes.data.transactions);
        setInsights(aiRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (loading) {
    return (
      <div className="p-8 text-gray-400 text-sm">Loading dashboard...</div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} overview
          </p>
        </div>
        <a
          href="/transactions"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Transaction
        </a>
      </div>

      {/* AI Insights */}
      {insights && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">✦</span>
            <span className="font-medium text-green-800 text-sm">AI Savings Insights</span>
            <span className="ml-auto text-xs bg-green-700 text-white px-2.5 py-0.5 rounded-full">
              Powered by Claude
            </span>
            {insights.score !== null && (
              <span className={`text-sm font-semibold ${
                insights.score >= 75 ? 'text-green-600' :
                insights.score >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                Score: {insights.score}/100
              </span>
            )}
          </div>
          <p className="text-green-800 text-sm mb-3 leading-relaxed">{insights.observation}</p>
          <ul className="space-y-1.5">
            {insights.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-blue-700">
                <span className="text-green-600 font-bold mt-0.5">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metric cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Income', value: fmt(report.summary.income), color: 'text-green-600' },
            { label: 'Total Expenses', value: fmt(report.summary.expenses), color: 'text-red-500' },
            {
              label: 'Remaining',
              value: fmt(report.summary.remaining),
              color: report.summary.remaining >= 0 ? 'text-green-600' : 'text-red-500',
            },
            { label: 'Savings Rate', value: `${report.summary.savingsRate.toFixed(1)}%`, color: 'text-blue-600' },
          ].map(m => (
            <div key={m.label} className="bg-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{m.label}</p>
              <p className={`text-xl font-semibold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown */}
      {report && report.categoryBreakdown.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
          <h2 className="font-medium text-gray-800 mb-4">Spending by Category</h2>
          <div className="space-y-3">
            {report.categoryBreakdown.map(cat => {
              const pct = report.summary.expenses > 0
                ? (cat.amount / report.summary.expenses) * 100
                : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span className="text-gray-700">{cat.name}</span>
                    </span>
                    <span className="font-medium text-gray-800">{fmt(cat.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-800">Recent Transactions</h2>
          <a href="/transactions" className="text-sm text-green-600 hover:underline">View all</a>
        </div>
        <div className="space-y-2">
          {recentTx.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No transactions yet.{' '}
              <a href="/transactions" className="text-green-600 hover:underline">Add your first one!</a>
            </p>
          ) : (
            recentTx.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: tx.category.color + '22' }}
                >
                  {tx.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {tx.notes || tx.category.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tx.category.name} · {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${
                  tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
