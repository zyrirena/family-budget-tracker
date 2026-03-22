import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { reportsApi } from '../../lib/api';

export default function Reports() {
  const now = new Date();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const res = await reportsApi.monthly(now.getFullYear(), now.getMonth() + 1);
    setReport(res.data);
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a6b4a" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a6b4a" />}
    >
      <Text style={styles.heading}>
        {months[now.getMonth()]} {now.getFullYear()} Report
      </Text>

      {report && (
        <>
          <View style={styles.metricsGrid}>
            {[
              { label: 'Income', value: fmt(report.summary.income), color: '#2d9b6e' },
              { label: 'Expenses', value: fmt(report.summary.expenses), color: '#e24b4a' },
              { label: 'Remaining', value: fmt(report.summary.remaining), color: report.summary.remaining >= 0 ? '#2d9b6e' : '#e24b4a' },
              { label: 'Savings Rate', value: `${report.summary.savingsRate.toFixed(1)}%`, color: '#185fa5' },
            ].map(m => (
              <View key={m.label} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending Breakdown</Text>
            {report.categoryBreakdown.length === 0 ? (
              <Text style={styles.empty}>No expenses this month.</Text>
            ) : (
              report.categoryBreakdown.map((cat: any) => {
                const pct = report.summary.expenses > 0
                  ? (cat.amount / report.summary.expenses) * 100 : 0;
                return (
                  <View key={cat.name} style={styles.catRow}>
                    <Text style={{ fontSize: 18, width: 30 }}>{cat.icon}</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <View style={styles.catHeader}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={styles.catAmount}>{fmt(cat.amount)}</Text>
                      </View>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: cat.color }]} />
                      </View>
                    </View>
                    <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 20, fontWeight: '600', color: '#222', marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: { width: '47%', backgroundColor: '#f0f0ed', borderRadius: 12, padding: 14 },
  metricLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { fontSize: 17, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 14 },
  empty: { fontSize: 13, color: '#aaa', textAlign: 'center', paddingVertical: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: 13, color: '#333' },
  catAmount: { fontSize: 13, fontWeight: '500', color: '#333' },
  progressBg: { height: 5, backgroundColor: '#f0f0e8', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 11, color: '#aaa', width: 30, textAlign: 'right' },
});
