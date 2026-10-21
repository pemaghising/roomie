// Full-screen confetti above everything in the tabs, nav included. Any screen calls fireConfetti().
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Confetti } from './confetti';

const listeners = new Set<() => void>();
export const fireConfetti = () => listeners.forEach((l) => l());

export function ConfettiHost() {
  const [shot, setShot] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fire = () => { clearTimeout(timer); setShot((n) => n + 1); timer = setTimeout(() => setShot(0), 3800); };
    listeners.add(fire);
    return () => { listeners.delete(fire); clearTimeout(timer); };
  }, []);
  if (!shot) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Confetti key={shot} count={130} /></View>;
}
