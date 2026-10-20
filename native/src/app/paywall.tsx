import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '@/constants/theme';
import { purchase, PurchasesNotConfigured, restorePurchases, usePlus } from '@/lib/entitlement';
import { COMPARISON, PLANS, TRIAL_DAYS, type PlanId } from '@/lib/plans';
import { Art } from '@/ui/art';
import { Button, C, ErrorText } from '@/ui/kit';

const PRIVACY_URL = 'https://roomie-theta.vercel.app/privacy';
const ACCENT = '#7C3AED';
const HERO = '#FFF1EA';

export default function Paywall() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isPlus = usePlus();
  const [plan, setPlan] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await fn(); router.back(); }
    catch (e) { setError(e instanceof PurchasesNotConfigured ? 'Purchases are not set up yet. Roomie Plus is coming soon.' : 'That did not go through. Try again.'); }
    finally { setBusy(false); }
  };

  const trial = plan === 'yearly';
  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={() => router.back()} style={[styles.close, { top: insets.top + 8 }]}>
            <Ionicons name="close" size={20} color={C.text} />
          </Pressable>
          <View style={styles.chip}><Text style={styles.chipText}>ROOMIE PLUS</Text></View>
          <Art name="trophy" width={210} />
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>Make the house <Text style={{ color: ACCENT }}>run itself.</Text></Text>

          <View style={styles.table} accessibilityRole="list">
            <View style={styles.tableHead}>
              <View style={{ flex: 1 }} />
              <Text style={styles.colFree}>Free</Text>
              <View style={styles.colPlusHead}><Ionicons name="star" size={14} color="#FFF" /></View>
            </View>
            {COMPARISON.map((r, i) => (
              <View key={r.label} style={[styles.row, i > 0 && styles.rowDivider]} accessible accessibilityLabel={`${r.label}. Free: ${r.free ? 'yes' : 'no'}. Plus: yes${r.soon ? ', coming soon' : ''}.`}>
                <Text style={styles.rowLabel}>{r.label}{r.soon ? <Text style={styles.soon}>  soon</Text> : null}</Text>
                <View style={styles.colFree}>{r.free ? <Ionicons name="checkmark" size={18} color={C.text} /> : <Text style={styles.dash}>–</Text>}</View>
                <View style={styles.colPlus}><Ionicons name="checkmark" size={18} color={ACCENT} /></View>
              </View>
            ))}
          </View>

          <View style={{ gap: 10, marginTop: 20 }} accessibilityRole="radiogroup">
            {(Object.values(PLANS)).map((p) => {
              const on = plan === p.id;
              return (
                <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${p.title}, ${p.price} ${p.per}. ${p.note}`}
                  onPress={() => { Haptics.selectionAsync(); setPlan(p.id); }} style={[styles.plan, on && styles.planOn]}>
                  {p.badge && <View style={styles.badge}><Text style={styles.badgeText}>{p.badge}</Text></View>}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>{p.title}</Text>
                    <Text style={styles.planNote}>{p.note}</Text>
                  </View>
                  <Text style={styles.price}>{p.price}<Text style={styles.per}> {p.per}</Text></Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable accessibilityRole="button" onPress={() => run(restorePurchases)} style={styles.restore}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </Pressable>
          <Text style={styles.fine}>
            {trial ? `Free for ${TRIAL_DAYS} days, then ${PLANS.yearly.price}/year. ` : ''}Cancel anytime in your store settings.{' '}
            <Text style={styles.link} accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>Privacy</Text>
          </Text>
          <View style={{ height: 8 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <ErrorText>{error}</ErrorText>
        <Button title={isPlus ? 'You have Roomie Plus' : trial ? `Start my ${TRIAL_DAYS}-day free trial` : 'Continue'} disabled={isPlus} loading={busy} onPress={() => run(() => purchase(plan))} />
        <View style={styles.reassure}>
          <Ionicons name="shield-checkmark-outline" size={14} color={C.sub} />
          <Text style={styles.reassureText}>{trial ? 'No payment now. Easy to cancel.' : 'Cancel anytime.'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  hero: { backgroundColor: HERO, alignItems: 'center', paddingBottom: 36 },
  close: { position: 'absolute', left: 16, zIndex: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  chip: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 4 },
  chipText: { fontSize: 11, letterSpacing: 1.6, color: ACCENT, fontFamily: F.bold },
  sheet: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -28, paddingHorizontal: 22, paddingTop: 24 },
  title: { fontSize: 28, lineHeight: 34, color: C.text, fontFamily: F.display, textAlign: 'center' },
  table: { marginTop: 18 },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 6 },
  colFree: { width: 52, textAlign: 'center', alignItems: 'center', fontSize: 12, color: C.sub, fontFamily: F.semibold },
  colPlusHead: { width: 52, height: 26, borderTopLeftRadius: 13, borderTopRightRadius: 13, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  colPlus: { width: 52, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 42 },
  rowDivider: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  rowLabel: { flex: 1, fontSize: 14, color: C.text, fontFamily: F.medium, paddingVertical: 8 },
  soon: { fontSize: 11, color: ACCENT, fontFamily: F.bold },
  dash: { color: C.faint, fontSize: 16 },
  plan: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 2, borderColor: '#E5E7EB', paddingVertical: 16, paddingHorizontal: 16, gap: 10 },
  planOn: { borderColor: ACCENT, backgroundColor: '#FAF8FF' },
  badge: { position: 'absolute', top: -11, left: 14, backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: '#FFF', fontFamily: F.bold },
  planTitle: { fontSize: 17, color: C.text, fontFamily: F.bold },
  planNote: { fontSize: 12, color: C.sub, fontFamily: F.regular, marginTop: 2 },
  price: { fontSize: 18, color: C.text, fontFamily: F.bold },
  per: { fontSize: 12, color: C.sub, fontFamily: F.regular },
  restore: { alignSelf: 'center', paddingVertical: 12, marginTop: 6 },
  restoreText: { fontSize: 14, color: C.sub, fontFamily: F.semibold },
  fine: { fontSize: 12, color: C.sub, fontFamily: F.regular, textAlign: 'center' },
  link: { textDecorationLine: 'underline', color: C.text },
  footer: { paddingHorizontal: 22, paddingTop: 10, gap: 6, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  reassure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  reassureText: { fontSize: 12, color: C.sub, fontFamily: F.medium },
});
