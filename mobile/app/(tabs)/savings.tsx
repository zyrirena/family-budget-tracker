import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, RefreshControl } from 'react-native';
import { savingsApi } from '../../lib/api';

export default function Savings() {
  const [goals, setGoals] = useState<any[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', icon: '🎯' });
  const [contribAmount, setContribAmount] = useState('');

  const fetchAll = async () => {
    const res = await savingsApi.list();
    setGoals(res.data.goals);
    setTotalSaved(res.data.totalSaved);
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleSave = async () => {
    if (!form.name || !form.targetAmount) return;
    await savingsApi.create({
      name: form.name, icon: form.icon,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount || '0'),
    });
    setShowModal(false);
    setForm({ name: '', targetAmount: '', currentAmount: '', icon: '🎯' });
    fetchAll();
  };

  const handleContribute = async () => {
    if (!contributeId || !contribAmount) return;
    await savingsApi.contribute(contributeId, { amount: parseFloat(contribAmount), date: new Date().toISOString() });
    setContributeId(null);
    setContribAmount('');
    fetchAll();
  };

  const icons = ['🎯', '🛡️', '✈️', '🏠', '🚗', '💻', '🎓', '👶'];

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f8f6' }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a6b4a" />}
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Saved</Text>
          <Text style={styles.totalValue}>{fmt(totalSaved)}</Text>
        </View>

        {goals.map((goal: any) => {
          const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const color = pct >= 100 ? '#2d9b6e' : pct >= 50 ? '#185fa5' : '#ba7517';
          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={{ fontSize: 24 }}>{goal.icon}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalMeta}>{pct.toFixed(1)}% · {fmt(goal.targetAmount - goal.currentAmount)} to go</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.goalCurrent}>{fmt(goal.currentAmount)}</Text>
                  <Text style={styles.goalTarget}>of {fmt(goal.targetAmount)}</Text>
                </View>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
              </View>
              {!goal.isCompleted && (
                <TouchableOpacity onPress={() => setContributeId(goal.id)} style={styles.addFundsBtn}>
                  <Text style={styles.addFundsText}>+ Add funds</Text>
                </TouchableOpacity>
              )}
              {goal.isCompleted && (
                <Text style={styles.completedBadge}>🎉 Goal reached!</Text>
              )}
            </View>
          );
        })}

        {goals.length === 0 && !loading && (
          <Text style={styles.empty}>No savings goals yet. Tap + to create one!</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Savings Goal</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <Text style={styles.label}>Goal name</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="e.g. Emergency Fund" />
          <Text style={styles.label}>Icon</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {icons.map(ic => (
              <TouchableOpacity key={ic} onPress={() => setForm({ ...form, icon: ic })}
                style={[styles.iconBtn, form.icon === ic && styles.iconBtnActive]}>
                <Text style={{ fontSize: 20 }}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Target amount ($)</Text>
          <TextInput style={styles.input} value={form.targetAmount} onChangeText={v => setForm({ ...form, targetAmount: v })} placeholder="10000" keyboardType="decimal-pad" />
          <Text style={styles.label}>Already saved ($)</Text>
          <TextInput style={styles.input} value={form.currentAmount} onChangeText={v => setForm({ ...form, currentAmount: v })} placeholder="0" keyboardType="decimal-pad" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Goal</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Contribute Modal */}
      <Modal visible={!!contributeId} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modal, { paddingTop: 30 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Funds</Text>
            <TouchableOpacity onPress={() => { setContributeId(null); setContribAmount(''); }}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <Text style={styles.label}>Amount ($)</Text>
          <TextInput style={styles.input} value={contribAmount} onChangeText={setContribAmount} placeholder="500.00" keyboardType="decimal-pad" autoFocus />
          <TouchableOpacity style={styles.saveBtn} onPress={handleContribute}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  totalCard: { backgroundColor: '#e8f5ef', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#9FE1CB' },
  totalLabel: { fontSize: 12, color: '#0F6E56', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 24, fontWeight: '700', color: '#085041', marginTop: 4 },
  goalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  goalName: { fontSize: 14, fontWeight: '600', color: '#222' },
  goalMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  goalCurrent: { fontSize: 14, fontWeight: '600', color: '#222' },
  goalTarget: { fontSize: 11, color: '#999' },
  progressBg: { height: 6, backgroundColor: '#f0f0e8', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  addFundsBtn: { alignSelf: 'flex-end' },
  addFundsText: { fontSize: 12, color: '#1a6b4a', fontWeight: '500' },
  completedBadge: { fontSize: 12, color: '#2d9b6e', fontWeight: '500' },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 40 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#1a6b4a',
    alignItems: 'center', justifyContent: 'center', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalClose: { fontSize: 18, color: '#999' },
  label: { fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 14, backgroundColor: '#fafafa' },
  iconBtn: { padding: 8, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent' },
  iconBtnActive: { borderColor: '#1a6b4a', backgroundColor: '#e8f5ef' },
  saveBtn: { backgroundColor: '#1a6b4a', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
