'use client';

import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import type { MonthlyReport } from '@/types';

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsApi.monthly(year, month)
      .then(res => setReport(res.data))
      .finally(() => setLoading(false));
  }, [year, month]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleExport = async () => {
    const res = await reportsApi.export();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Monthly financial breakdown</p>
        </div>
        <button
          onClick={handleExport}
          className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Month/Year selector */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={month}
          onChange={e => setMonth(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {months.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading report...</p>
      ) : report ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Income', value: fmt(report.summary.income), color: 'text-green-600' },
              { label: 'Expenses', value: fmt(report.summary.expenses), color: 'text-red-500' },
              { label: 'Remaining', value: fmt(report.summary.remaining), color: report.summary.remaining >= 0 ? 'text-green-600' : 'text-red-500' },
              { label: 'Savings Rate', value: `${report.summary.savingsRate.toFixed(1)}%`, color: 'text-blue-600' },
            ].map(m => (
              <div key={m.label} className="bg-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{m.label}</p>
                <p className={`text-xl font-semibold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Category breakdown table */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-medium text-gray-800 mb-4">
              Category Breakdown — {months[month - 1]} {year}
            </h2>
            {report.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No expense data for this month.</p>
            ) : (
              <div className="space-y-3">
                {report.categoryBreakdown.map(cat => {
                  const pct = report.summary.expenses > 0
                    ? (cat.amount / report.summary.expenses) * 100
                    : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-4">
                      <div className="w-8 text-center text-lg flex-shrink-0">{cat.icon}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{cat.name}</span>
                          <span className="font-medium text-gray-800">{fmt(cat.amount)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: cat.color }}
                          />
                        </div>
                      </div>
                      <div className="w-10 text-right text-xs text-gray-400">{pct.toFixed(0)}%</div>
                    </div>
                  );
                })}

                <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Total expenses</span>
                  <span className="text-red-500">{fmt(report.summary.expenses)}</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
