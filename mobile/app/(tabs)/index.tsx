import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { reportsApi, transactionsApi, aiApi } from '../../lib/api';

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const now = new Date();
    const [reportRes, txRes, aiRes] = await Promise.all([
      reportsApi.monthly(now.getFullYear(), now.getMonth() + 1),
      transactionsApi.list({ limit: 5 }),
      aiApi.insights(),
    ]);
    setSummary(reportRes.data.summary);
    setRecentTx(txRes.data.transactions);
    setInsights(aiRes.data);
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a6b4a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a6b4a" />}
    >
      {/* AI Insights */}
      {insights && (
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}>✦  AI Insights</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>Claude AI</Text>
            </View>
          </View>
          <Text style={styles.aiObs}>{insights.observation}</Text>
          {insights.tips?.slice(0, 2).map((tip: string, i: number) => (
            <Text key={i} style={styles.aiTip}>→  {tip}</Text>
          ))}
          {insights.score != null && (
            <Text style={styles.aiScore}>Financial score: {insights.score}/100 — {insights.scoreLabel}</Text>
          )}
        </View>
      )}

      {/* Metric cards */}
      {summary && (
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { marginRight: 6 }]}>
            <Text style={styles.metricLabel}>Income</Text>
            <Text style={[styles.metricValue, { color: '#2d9b6e' }]}>{fmt(summary.income)}</Text>
          </View>
          <View style={[styles.metricCard, { marginLeft: 6 }]}>
            <Text style={styles.metricLabel}>Expenses</Text>
            <Text style={[styles.metricValue, { color: '#e24b4a' }]}>{fmt(summary.expenses)}</Text>
          </View>
          <View style={[styles.metricCard, { marginRight: 6, marginTop: 12 }]}>
            <Text style={styles.metricLabel}>Remaining</Text>
            <Text style={[styles.metricValue, { color: summary.remaining >= 0 ? '#2d9b6e' : '#e24b4a' }]}>
              {fmt(summary.remaining)}
            </Text>
          </View>
          <View style={[styles.metricCard, { marginLeft: 6, marginTop: 12 }]}>
            <Text style={styles.metricLabel}>Savings Rate</Text>
            <Text style={[styles.metricValue, { color: '#185fa5' }]}>
              {summary.savingsRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Transactions</Text>
        {recentTx.length === 0 ? (
          <Text style={styles.empty}>No transactions yet. Add one!</Text>
        ) : (
          recentTx.map((tx: any) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.category.color + '22' }]}>
                <Text style={{ fontSize: 16 }}>{tx.category.icon}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txName} numberOfLines={1}>
                  {tx.notes || tx.category.name}
                </Text>
                <Text style={styles.txMeta}>
                  {tx.category.name} · {new Date(tx.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'INCOME' ? '#2d9b6e' : '#e24b4a' }]}>
                {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  aiCard: {
    backgroundColor: '#e8f5ef', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#9FE1CB',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiTitle: { fontWeight: '600', color: '#0F6E56', flex: 1, fontSize: 14 },
  aiBadge: { backgroundColor: '#1a6b4a', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  aiBadgeText: { color: '#fff', fontSize: 10, fontWeight: '500' },
  aiObs: { fontSize: 13, color: '#0F6E56', lineHeight: 19, marginBottom: 6 },
  aiTip: { fontSize: 12, color: '#185fa5', marginBottom: 3, lineHeight: 17 },
  aiScore: { fontSize: 11, color: '#0F6E56', marginTop: 6, fontWeight: '500' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#f0f0ed', borderRadius: 12, padding: 14 },
  metricLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  empty: { fontSize: 13, color: '#aaa', textAlign: 'center', paddingVertical: 16 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  txIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txName: { fontSize: 13, fontWeight: '500', color: '#222' },
  txMeta: { fontSize: 11, color: '#999', marginTop: 1 },
  txAmount: { fontSize: 13, fontWeight: '600' },
});
