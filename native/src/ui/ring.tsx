import { type ReactNode, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

/** Circular progress ring (value of total) with children centered inside. Pass `gradient` colours for a multicolour stroke. */
export function Ring({ value, total, size = 48, color = '#1F2937', stroke = 3, gradient, children }: {
  value: number; total: number; size?: number; color?: string; stroke?: number; gradient?: readonly string[]; children?: ReactNode;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const paint = gradient ? `url(#${id})` : color;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="progressbar" accessibilityLabel={`${value} of ${total} done`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {gradient && (
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              {gradient.map((stop, i) => <Stop key={stop} offset={i / Math.max(gradient.length - 1, 1)} stopColor={stop} />)}
            </LinearGradient>
          </Defs>
        )}
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={gradient ? gradient[0] : color} strokeOpacity={0.18} strokeWidth={stroke} />
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={paint} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' } });
