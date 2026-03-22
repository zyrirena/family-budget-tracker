'use client';

import { useEffect, useState } from 'react';
import { debtsApi } from '@/lib/api';
import type { Debt } from '@/types';

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', totalBalance: '', currentBalance: '', interestRate: '', minimumPayment: '' });
  const [payAmount, setPayAmount] = useState('');

  const fetchAll = () => {
    debtsApi.list().then(res => {
      setDebts(res.data.debts);
      setTotalDebt(res.data.totalDebt);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleSave = async () => {
    if (!form.name || !form.totalBalance) return;
    await debtsApi.create({
      name: form.name,
      totalBalance: parseFloat(form.totalBalance),
      currentBalance: parseFloat(form.currentBalance || form.totalBalance),
      interestRate: parseFloat(form.interestRate || '0'),
      minimumPayment: parseFloat(form.minimumPayment || '0'),
    });
    setShowModal(false);
    setForm({ name: '', totalBalance: '', currentBalance: '', interestRate: '', minimumPayment: '' });
    fetchAll();
  };

  const handlePayment = async () => {
    if (!payModal || !payAmount) return;
    await debtsApi.addPayment(payModal, {
      amount: parseFloat(payAmount),
      date: new Date().toISOString(),
    });
    setPayModal(null);
    setPayAmount('');
    fetchAll();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Debt Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">
            Total owed: <span className="text-amber-600 font-medium">{fmt(totalDebt)}</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Add Debt
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : debts.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <p className="text-gray-400 text-sm">No debts tracked yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map(debt => {
            const pct = Math.min(100, (debt.currentBalance / debt.totalBalance) * 100);
            return (
              <div key={debt.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{debt.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{debt.interestRate}% APR · Min payment: {fmt(debt.minimumPayment)}/mo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-amber-600">{fmt(debt.currentBalance)}</p>
                    <p className="text-xs text-gray-400">of {fmt(debt.totalBalance)}</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{(100 - pct).toFixed(1)}% paid off</span>
                  <button
                    onClick={() => setPayModal(debt.id)}
                    className="text-xs text-green-600 hover:underline font-medium"
                  >
                    Record payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Debt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add Debt</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Debt name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Visa Credit Card" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Total balance ($)</label>
                  <input type="number" value={form.totalBalance} onChange={e => setForm({ ...form, totalBalance: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="5000" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Current balance ($)</label>
                  <input type="number" value={form.currentBalance} onChange={e => setForm({ ...form, currentBalance: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Same as total" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Interest rate (%)</label>
                  <input type="number" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="18.99" step="0.01" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min payment ($)</label>
                  <input type="number" value={form.minimumPayment} onChange={e => setForm({ ...form, minimumPayment: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="150" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Record Payment</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment amount ($)</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="250.00" autoFocus />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setPayModal(null); setPayAmount(''); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handlePayment} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
