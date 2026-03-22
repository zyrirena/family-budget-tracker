import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, RefreshControl, Alert,
} from 'react-native';
import { transactionsApi, categoriesApi } from '../../lib/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: 'EXPENSE', amount: '', notes: '', categoryId: '',
  });

  const fetchAll = async () => {
    const [txRes, catRes] = await Promise.all([
      transactionsApi.list({ limit: 50 }),
      categoriesApi.list(),
    ]);
    setTransactions(txRes.data.transactions);
    setCategories(catRes.data);
    if (catRes.data.length > 0 && !form.categoryId) {
      setForm(f => ({ ...f, categoryId: catRes.data[0].id }));
    }
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!form.amount || !form.categoryId) {
      Alert.alert('Error', 'Please fill in amount and category.');
      return;
    }
    await transactionsApi.create({
      ...form,
      amount: parseFloat(form.amount),
      date: new Date().toISOString(),
    });
    setShowModal(false);
    setForm({ type: 'EXPENSE', amount: '', notes: '', categoryId: categories[0]?.id || '' });
    fetchAll();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await transactionsApi.delete(id);
        fetchAll();
      }},
    ]);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f8f6' }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a6b4a" />}
      >
        {transactions.map((tx: any) => (
          <TouchableOpacity
            key={tx.id}
            style={styles.txRow}
            onLongPress={() => handleDelete(tx.id)}
          >
            <View style={[styles.txIcon, { backgroundColor: tx.category.color + '22' }]}>
              <Text style={{ fontSize: 16 }}>{tx.category.icon}</Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txName} numberOfLines={1}>{tx.notes || tx.category.name}</Text>
              <Text style={styles.txMeta}>{tx.category.name} · {new Date(tx.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'INCOME' ? '#2d9b6e' : '#e24b4a' }]}>
              {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
            </Text>
          </TouchableOpacity>
        ))}
        {transactions.length === 0 && !loading && (
          <Text style={styles.empty}>No transactions yet. Tap + to add one.</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Transaction</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeRow}>
            {['EXPENSE', 'INCOME'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                onPress={() => setForm({ ...form, type: t })}
              >
                <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>
                  {t === 'EXPENSE' ? 'Expense' : 'Income'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Amount ($)</Text>
          <TextInput
            style={styles.input}
            value={form.amount}
            onChangeText={v => setForm({ ...form, amount: v })}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {categories
              .filter(c => c.type === form.type || c.type === 'BOTH')
              .map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catChip, form.categoryId === c.id && styles.catChipActive]}
                  onPress={() => setForm({ ...form, categoryId: c.id })}
                >
                  <Text style={{ fontSize: 14 }}>{c.icon}</Text>
                  <Text style={[styles.catChipText, form.categoryId === c.id && { color: '#1a6b4a' }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.notes}
            onChangeText={v => setForm({ ...form, notes: v })}
            placeholder="e.g. Weekly groceries"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Transaction</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', padding: 12, borderRadius: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0',
  },
  txIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txName: { fontSize: 13, fontWeight: '500', color: '#222' },
  txMeta: { fontSize: 11, color: '#999', marginTop: 1 },
  txAmount: { fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 40 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#1a6b4a', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalClose: { fontSize: 18, color: '#999' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center' },
  typeBtnActive: { borderColor: '#1a6b4a', backgroundColor: '#e8f5ef' },
  typeBtnText: { fontSize: 14, color: '#666', fontWeight: '500' },
  typeBtnTextActive: { color: '#1a6b4a' },
  label: { fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: '#fafafa',
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#e0e0e0', marginRight: 8, backgroundColor: '#fafafa',
  },
  catChipActive: { borderColor: '#1a6b4a', backgroundColor: '#e8f5ef' },
  catChipText: { fontSize: 13, color: '#555' },
  saveBtn: {
    backgroundColor: '#1a6b4a', padding: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
