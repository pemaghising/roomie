import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeOutDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '@/constants/theme';

interface Opts { action?: { label: string; onPress: () => void }; duration?: number }
interface Toast extends Opts { id: number; text: string }

const Ctx = createContext<{ show: (text: string, opts?: Opts) => void }>({ show: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();
  const show = useCallback((text: string, opts: Opts = {}) => {
    clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, text, ...opts });
    timer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), opts.duration ?? 3500);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View key={toast.id} entering={SlideInDown.duration(240)} exiting={FadeOutDown.duration(150)}
          style={[styles.toast, { bottom: insets.bottom + 96 }]} accessibilityLiveRegion="polite">
          <Text style={styles.text}>{toast.text}</Text>
          {toast.action && (
            <Pressable hitSlop={10} onPress={() => { toast.action!.onPress(); setToast(null); }}>
              <Text style={styles.action}>{toast.action.label}</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: 16, right: 16, backgroundColor: '#111827', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, color: '#FFF', fontSize: 15, fontFamily: F.medium },
  action: { color: '#C4B5FD', fontSize: 15, fontFamily: F.bold },
});
