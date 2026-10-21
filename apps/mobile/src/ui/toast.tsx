// App-wide feedback: the v2 pill snackbar (P1d) or, with `tick`, the rounded toast (H3/H5). Springs up above the nav.
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut, LinearTransition, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motion, useReducedMotion } from './motion';
import { layout } from './tokens';
import { Snackbar, Toast } from './v2/overlay';

interface Opts { action?: { label: string; onPress: () => void }; duration?: number; tick?: boolean }
interface Item extends Opts { id: number; text: string }

const Ctx = createContext<{ show: (text: string, opts?: Opts) => void }>({ show: () => {} });
export const useToast = () => useContext(Ctx);

const SPRING = { damping: motion.sheet.damping, stiffness: motion.sheet.stiffness, mass: motion.sheet.mass };
const rise = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 24 }, { scale: 0.96 }] },
    animations: {
      opacity: withTiming(1, { duration: 140 }),
      transform: [{ translateY: withSpring(0, SPRING) }, { scale: withSpring(1, SPRING) }],
    },
  };
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Item | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const show = useCallback((text: string, opts: Opts = {}) => {
    clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, text, ...opts });
    timer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), opts.duration ?? (opts.action ? 5000 : 3200));
  }, []);
  const act = () => { toast?.action?.onPress(); setToast(null); };

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View key={toast.id} entering={reduced ? undefined : rise} exiting={FadeOut.duration(120)} layout={LinearTransition}
          style={[styles.wrap, { bottom: insets.bottom + 96 }]} pointerEvents="box-none">
          {toast.tick
            ? <Toast message={toast.text} action={toast.action?.label} onAction={act} />
            : <Snackbar message={toast.text} action={toast.action?.label} onAction={act} />}
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: layout.margin, right: layout.margin, alignItems: 'center' },
});
