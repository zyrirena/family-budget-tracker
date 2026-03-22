'use client';

import { useEffect, useState } from 'react';
import { savingsApi } from '@/lib/api';
import type { SavingsGoal } from '@/types';

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [contributeModal, setContributeModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', icon: '🎯', targetDate: '' });
  const [contribAmount, setContribAmount] = useState('');

  const fetchAll = () => {
    savingsApi.list().then(res => {
      setGoals(res.data.goals);
      setTotalSaved(res.data.totalSaved);
      setTotalTarget(res.data.totalTarget);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleSave = async () => {
    if (!form.name || !form.targetAmount) return;
    await savingsApi.create({
      name: form.name,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount || '0'),
      icon: form.icon,
      ...(form.targetDate && { targetDate: new Date(form.targetDate).toISOString() }),
    });
    setShowModal(false);
    setForm({ name: '', targetAmount: '', currentAmount: '', icon: '🎯', targetDate: '' });
    fetchAll();
  };

  const handleContribute = async () => {
    if (!contributeModal || !contribAmount) return;
    await savingsApi.contribute(contributeModal, {
      amount: parseFloat(contribAmount),
      date: new Date().toISOString(),
    });
    setContributeModal(null);
    setContribAmount('');
    fetchAll();
  };

  const iconOptions = ['🎯', '🛡️', '✈️', '🏠', '🚗', '💻', '🎓', '👶', '💍', '🌴'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Savings Goals</h1>
          <p className="text-gray-500 text-sm mt-1">
            {fmt(totalSaved)} saved of {fmt(totalTarget)} total goal
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Add Goal
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : goals.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <p className="text-gray-400 text-sm">No savings goals yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const color = pct >= 100 ? '#2d9b6e' : pct >= 50 ? '#185fa5' : '#ba7517';
            return (
              <div key={goal.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{goal.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{goal.name}</h3>
                      {goal.targetDate && (
                        <p className="text-xs text-gray-400">
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {goal.isCompleted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Complete!
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between mb-2">
                  <span className="text-lg font-semibold text-gray-800">{fmt(goal.currentAmount)}</span>
                  <span className="text-sm text-gray-400">of {fmt(goal.targetAmount)}</span>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{pct.toFixed(1)}% · {fmt(goal.targetAmount - goal.currentAmount)} to go</span>
                  {!goal.isCompleted && (
                    <button
                      onClick={() => setContributeModal(goal.id)}
                      className="text-xs text-green-600 hover:underline font-medium"
                    >
                      + Add funds
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add Savings Goal</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Goal name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Emergency Fund" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.map(icon => (
                    <button key={icon} onClick={() => setForm({ ...form, icon })} className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${form.icon === icon ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-200'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Target amount ($)</label>
                  <input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="10000" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Current amount ($)</label>
                  <input type="number" value={form.currentAmount} onChange={e => setForm({ ...form, currentAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Target date (optional)</label>
                <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {contributeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add Funds</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
              <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="500.00" autoFocus />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setContributeModal(null); setContribAmount(''); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleContribute} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
