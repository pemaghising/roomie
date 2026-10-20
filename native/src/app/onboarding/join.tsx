// J1 · Enter home code / J3 · Code not found.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { haptic } from '@/ui/haptics';
import { normalizeCode, updateDraft, useDraft, type HomePreview } from '@/lib/draft';
import { messageOf, rpc } from '@/lib/state';
import { color } from '@/ui/tokens';
import { Button, CodeInput, Heading, Page, Txt } from '@/ui/v2';

export default function Join() {
  const router = useRouter();
  const draft = useDraft();
  const [code, setCode] = useState(draft.code);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const moveIn = async (c = code) => {
    if (c.length !== 6 || busy) return;
    setBusy(true);
    try {
      const preview = await rpc<HomePreview | null>('household_preview', { p_code: c });
      if (!preview) { haptic.warn(); setError('No home with that code.'); return; }
      if (preview.full) { setError('That home is full (8 people).'); return; }
      updateDraft({ mode: 'join', code: c, preview });
      router.push('/onboarding/joined');
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page back footer={<Button title={error ? 'Try again' : 'Move in'} loading={busy} disabled={!error && code.length !== 6}
      onPress={() => (error ? (setError(null), setCode('')) : moveIn())} />}>
      <Heading title="Enter your home code" sub="Psst, it’s on your roommate’s Profile." />
      <View style={{ gap: 16 }}>
        <CodeInput keyboard="default" autoFocus value={code} error={!!error} accessibilityLabel="Home code"
          onChange={(v) => { const c = normalizeCode(v); setCode(c); setError(null); if (c.length === 6) moveIn(c); }} />
        <View style={styles.row}>
          {error && <Txt v="Body/Label" c={color.text.danger} accessibilityRole="alert">{error}</Txt>}
          <Txt v="Body/Label" c={color.text.link} accessibilityRole="button" onPress={() => router.push('/onboarding/scan')}>
            {error ? 'Scan instead' : 'Scan a QR code instead'}
          </Txt>
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } });
