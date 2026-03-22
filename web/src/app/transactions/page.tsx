'use client';

import { useEffect, useState } from 'react';
import { transactionsApi, categoriesApi } from '@/lib/api';
import type { Transaction, Category } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: 'EXPENSE',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    notes: '',
    isRecurring: false,
  });

  const fetchAll = () => {
    Promise.all([
      transactionsApi.list({ type: filter || undefined, limit: 100 }),
      categoriesApi.list(),
    ]).then(([txRes, catRes]) => {
      setTransactions(txRes.data.transactions);
      setCategories(catRes.data);
      if (!form.categoryId && catRes.data.length > 0) {
        setForm(f => ({ ...f, categoryId: catRes.data[0].id }));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [filter]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleSave = async () => {
    if (!form.amount || !form.date || !form.categoryId) return;
    await transactionsApi.create({ ...form, amount: parseFloat(form.amount) });
    setShowModal(false);
    setForm({ type: 'EXPENSE', amount: '', date: new Date().toISOString().split('T')[0], categoryId: categories[0]?.id || '', notes: '', isRecurring: false });
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await transactionsApi.delete(id);
    fetchAll();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">{transactions.length} transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {[['', 'All'], ['INCOME', 'Income'], ['EXPENSE', 'Expenses']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${
              filter === val
                ? 'border-green-600 text-green-700 bg-green-50 font-medium'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No transactions found.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: tx.category.color + '22' }}
                >
                  {tx.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{tx.notes || tx.category.name}</p>
                  <p className="text-xs text-gray-400">
                    {tx.category.name} · {new Date(tx.date).toLocaleDateString()}
                    {tx.isRecurring && <span className="ml-2 text-blue-500">↻ recurring</span>}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                </p>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs ml-2 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {categories
                    .filter(c => c.type === form.type || c.type === 'BOTH')
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Weekly groceries"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={e => setForm({ ...form, isRecurring: e.target.checked })}
                  className="rounded"
                />
                Recurring expense
              </label>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
