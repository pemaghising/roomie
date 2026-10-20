// Frame 12 invite card: QR to move in, divider, the code with a copy button. Used in onboarding and Profile.
import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { formatCode, inviteLink } from '@/lib/actions';
import { haptic } from './haptics';
import { useToast } from './toast';
import { color, elevation, font } from './tokens';
import { Glass, Tap, Txt } from './v2';

export function InviteCard({ code, home }: { code: string; home: string }) {
  const toast = useToast();
  const copy = async () => {
    await Clipboard.setStringAsync(formatCode(code));
    haptic.allDone();
    toast.show('Code copied');
  };
  return (
    <Glass fill={0.9}>
      <View style={styles.card} accessible accessibilityLabel={`Invite to ${home}. Code ${formatCode(code).split('').join(' ')}`}>
        <Txt v="Body/Label" c={color.text.link}>Scan to move in</Txt>
        <View style={[styles.qr, elevation.liftSmall, { shadowColor: '#1C1447', shadowOpacity: 0.06 }]}>
          <QRCode value={inviteLink(code)} size={124} color={color.text.primary} backgroundColor={color.bg.surface} />
        </View>
        <View style={styles.or}><View style={styles.rule} /><Txt v="Meta" c={color.text.secondary}>or share the code</Txt><View style={styles.rule} /></View>
        <View style={styles.codeRow}>
          <Txt v="Title/Page" style={{ fontFamily: font.semibold, letterSpacing: 1 }} selectable>{formatCode(code)}</Txt>
          <Tap onPress={copy} accessibilityLabel="Copy code" hitSlop={8}>
            <View style={styles.copy}><Copy size={16} color={color.text.link} strokeWidth={2} /></View>
          </Tap>
        </View>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 14, paddingVertical: 22, paddingHorizontal: 20 },
  qr: { backgroundColor: color.bg.surface, padding: 14, borderRadius: 20 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  rule: { flex: 1, height: 1, backgroundColor: 'rgba(31,27,58,0.1)' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { width: 34, height: 34, borderRadius: 17, backgroundColor: color.action.selectedTint, alignItems: 'center', justifyContent: 'center' },
});
