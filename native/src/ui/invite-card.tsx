import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { F } from '@/constants/theme';
import { formatCode, inviteLink, shareInvite } from '@/lib/actions';
import { useToast } from './toast';
import { Button, C } from './kit';

/** A shareable invite: household name, scannable QR (opens the join link), the code, and share/copy actions. */
export function InviteCard({ code, home }: { code: string; home: string }) {
  const toast = useToast();
  const copy = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.show('Code copied.');
  };
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.card} accessible accessibilityLabel={`Invite to ${home}. Code ${formatCode(code)}`}>
        <Text style={styles.label}>JOIN</Text>
        <Text style={styles.home} numberOfLines={2}>{home}</Text>
        <View style={styles.qr}><QRCode value={inviteLink(code)} size={160} color="#1F2937" backgroundColor="#FFF" /></View>
        <Text style={styles.code} selectable>{formatCode(code)}</Text>
        <Text style={styles.hint}>Scan, or enter the code in Roomie.</Text>
      </View>
      <Button title="Share invite" onPress={() => shareInvite(code, home)} />
      <Button title="Copy code" variant="ghost" onPress={copy} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.sky, borderRadius: 28, padding: 24, alignItems: 'center', gap: 10 },
  label: { fontSize: 12, letterSpacing: 1.4, color: C.skyText, fontFamily: F.semibold },
  home: { fontSize: 26, color: C.skyText, fontFamily: F.display, textAlign: 'center' },
  qr: { backgroundColor: '#FFF', padding: 14, borderRadius: 20, marginVertical: 6 },
  code: { fontSize: 32, letterSpacing: 2, color: C.skyText, fontFamily: F.heavy },
  hint: { fontSize: 13, color: C.skyText, fontFamily: F.regular, opacity: 0.85 },
});
