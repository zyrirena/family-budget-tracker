import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, RefreshControl } from 'react-native';
import { debtsApi } from '../../lib/api';

export default function Debts() {
  const [debts, setDebts] = useState<any[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', totalBalance: '', interestRate: '', minimumPayment: '' });

  const fetchAll = async () => {
    const res = await debtsApi.list();
    setDebts(res.data.debts);
    setTotalDebt(res.data.totalDebt);
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleSave = async () => {
    if (!form.name || !form.totalBalance) return;
    await debtsApi.create({
      name: form.name,
      totalBalance: parseFloat(form.totalBalance),
      currentBalance: parseFloat(form.totalBalance),
      interestRate: parseFloat(form.interestRate || '0'),
      minimumPayment: parseFloat(form.minimumPayment || '0'),
    });
    setShowModal(false);
    setForm({ name: '', totalBalance: '', interestRate: '', minimumPayment: '' });
    fetchAll();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f8f6' }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a6b4a" />}
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Debt</Text>
          <Text style={styles.totalValue}>{fmt(totalDebt)}</Text>
        </View>

        {debts.map((debt: any) => {
          const pct = Math.min(100, (debt.currentBalance / debt.totalBalance) * 100);
          return (
            <View key={debt.id} style={styles.debtCard}>
              <View style={styles.debtHeader}>
                <Text style={styles.debtName}>{debt.name}</Text>
                <Text style={styles.debtBalance}>{fmt(debt.currentBalance)}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
              </View>
              <Text style={styles.debtMeta}>
                {debt.interestRate}% APR · Min: {fmt(debt.minimumPayment)}/mo · {(100 - pct).toFixed(1)}% paid off
              </Text>
            </View>
          );
        })}

        {debts.length === 0 && !loading && (
          <Text style={styles.empty}>No debts tracked. Tap + to add one.</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Debt</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {[
            { label: 'Debt name', key: 'name', placeholder: 'e.g. Visa Credit Card', keyboard: 'default' },
            { label: 'Total balance ($)', key: 'totalBalance', placeholder: '5000', keyboard: 'decimal-pad' },
            { label: 'Interest rate (%)', key: 'interestRate', placeholder: '18.99', keyboard: 'decimal-pad' },
            { label: 'Minimum payment ($)', key: 'minimumPayment', placeholder: '150', keyboard: 'decimal-pad' },
          ].map(f => (
            <View key={f.key}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={(form as any)[f.key]}
                onChangeText={v => setForm({ ...form, [f.key]: v })}
                placeholder={f.placeholder}
                keyboardType={f.keyboard as any}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Debt</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  totalCard: { backgroundColor: '#fff8ec', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#fac775' },
  totalLabel: { fontSize: 12, color: '#854F0B', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 24, fontWeight: '700', color: '#633806', marginTop: 4 },
  debtCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  debtName: { fontSize: 14, fontWeight: '600', color: '#222' },
  debtBalance: { fontSize: 15, fontWeight: '600', color: '#ba7517' },
  progressBg: { height: 6, backgroundColor: '#f0f0e8', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#ba7517', borderRadius: 3 },
  debtMeta: { fontSize: 11, color: '#999' },
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
  saveBtn: { backgroundColor: '#1a6b4a', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
