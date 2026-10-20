import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, MoreHorizontal, Users, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { color, elevation, radius } from '../tokens';
import { Glass, gradients, Tap, Txt } from './primitives';
import { Check, EmojiBadge, Tag } from './tags';
import type { TagKind } from './tag-style';

const layout = LinearTransition.springify().damping(20).stiffness(220);

/** v2/Task row: glass card, emoji badge, title, tag + meta, check. Done fades to 55 %; "mine" gets the gradient outline. */
export function TaskRow({ icon, title, tag, meta, state = 'todo', onToggle, onPress, right }: {
  icon?: string | null; title: string; tag?: TagKind; meta?: string; state?: 'todo' | 'done' | 'mine';
  onToggle?: () => void; onPress?: () => void; right?: ReactNode;
}) {
  const done = state === 'done';
  return (
    <Animated.View layout={layout} style={{ opacity: done ? 0.55 : 1 }}>
      <Tap onPress={onPress ?? onToggle} disabled={!onPress && !onToggle} accessibilityLabel={`${title}${done ? ', done' : ''}`}>
        <Glass outline={state === 'mine'}>
          <View style={styles.row}>
            <EmojiBadge value={icon} name={title} />
            <View style={styles.text}>
              <Txt v="Body/Row" numberOfLines={1} style={done && styles.strike}>{title}</Txt>
              {(tag || meta) && <View style={styles.meta}>
                {tag && <Tag kind={tag} />}
                {meta && <Txt v="Meta" c={color.text.secondary} numberOfLines={1} style={{ flexShrink: 1 }}>{meta}</Txt>}
              </View>}
            </View>
            {right ?? (onToggle && (
              <Tap onPress={onToggle} feel="complete" accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`Mark ${title} ${done ? 'not done' : 'done'}`} hitSlop={10}>
                <Check done={done} />
              </Tap>
            ))}
          </View>
        </Glass>
      </Tap>
    </Animated.View>
  );
}

/** v2/Pool row: a missed chore anyone can claim. Never names who missed it. Claimed turns mint with Undo. */
export function PoolRow({ icon, title, tag, meta, claimed, onClaim, onUndo }: {
  icon?: string | null; title: string; tag?: TagKind; meta?: string; claimed?: boolean; onClaim?: () => void; onUndo?: () => void;
}) {
  const colors = claimed ? (['#E6FCF1', '#CBF3DF'] as const) : (['#FFEAD8', '#FFD9BC'] as const);
  return (
    <Animated.View layout={layout} style={[elevation.glass, { borderRadius: radius.card }]}>
      <LinearGradient colors={claimed ? (['#FCFBFF', '#FCFBFF'] as const) : gradients.outline} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.card, padding: 1.25 }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.row, { borderRadius: radius.card - 1.25 }]}>
          <EmojiBadge value={icon} name={title} />
          <View style={styles.text}>
            <Txt v="Body/Row" numberOfLines={1}>{title}</Txt>
            <View style={styles.meta}>
              {tag && <Tag kind={tag} />}
              {meta && <Txt v="Meta" c={claimed ? '#1F7A4D' : color.text.secondary} numberOfLines={1} style={{ flexShrink: 1 }}>{meta}</Txt>}
            </View>
          </View>
          {claimed
            ? <Tap onPress={onUndo} accessibilityLabel={`Undo claiming ${title}`}><View style={styles.undo}><Txt v="Meta/Medium">Undo</Txt></View></Tap>
            : <Tap onPress={onClaim} feel="complete" accessibilityLabel={`Claim ${title}`}><View style={[styles.claim, elevation.liftSmall]}><Txt v="Meta/Medium" c={color.text.onAccent}>Claim</Txt></View></Tap>}
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );
}

/** v2/Pool banner on Home: count of chores waiting, outlined, opens the pool. */
export function PoolBanner({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={`${count} chores in the shared pool. Claim one to help the house.`}>
      <Glass outline fill={0.9} r={20}>
        <View style={[styles.row, { paddingVertical: 12, paddingLeft: 12, gap: 12, borderRadius: 20 }]}>
          <View style={styles.poolIcon}><Users size={20} color={color.pool.fg} strokeWidth={1.75} /></View>
          <View style={styles.text}>
            <Txt v="Body/Label">{count === 1 ? '1 chore in the shared pool' : `${count} chores in the shared pool`}</Txt>
            <Txt v="Meta" c={color.text.secondary}>Claim one to help the house</Txt>
          </View>
          <ChevronRight size={16} color="#7A7E8A" strokeWidth={1.75} />
        </View>
      </Glass>
    </Tap>
  );
}

/** v2/Reason row in "Why these chores": emoji, chore, the one-line reason, effort tag. */
export function ReasonRow({ icon, title, reason, tag, last }: { icon?: string | null; title: string; reason: string; tag: TagKind; last?: boolean }) {
  return (
    <View style={[styles.reason, !last && styles.divider]}>
      <EmojiBadge value={icon} name={title} round />
      <View style={styles.text}>
        <Txt v="Body/Row">{title}</Txt>
        <Txt v="Meta" c={color.text.secondary}>{reason}</Txt>
      </View>
      <Tag kind={tag} />
    </View>
  );
}

/** v2/Upcoming card: a coming chore with a chevron. */
export function UpcomingCard({ icon, title, sub, onPress }: { icon?: string | null; title: string; sub: string; onPress?: () => void }) {
  return (
    <Tap onPress={onPress} disabled={!onPress} accessibilityLabel={`${title}, ${sub}`}>
      <Glass>
        <View style={[styles.row, { paddingVertical: 14 }]}>
          <EmojiBadge value={icon} name={title} round />
          <View style={styles.text}>
            <Txt v="Body/Label" numberOfLines={1}>{title}</Txt>
            <Txt v="Meta" c={color.text.secondary} numberOfLines={1}>{sub}</Txt>
          </View>
          <ChevronRight size={18} color={color.icon.muted} strokeWidth={1.75} />
        </View>
      </Glass>
    </Tap>
  );
}

/** v2/Item card: pantry row with icon tile, name, status / boundary tags and a ••• menu. */
export function ItemCard({ icon, name, tags = [], meta, onMore, action }: {
  icon?: string | null; name: string; tags?: TagKind[]; meta?: string; onMore?: () => void; action?: ReactNode;
}) {
  return (
    <Glass fill={0.9}>
      <View style={[styles.row, { paddingVertical: 12, paddingLeft: 12 }]}>
        <EmojiBadge value={icon} name={name} />
        <View style={styles.text}>
          <Txt v="Body/Row" numberOfLines={1}>{name}</Txt>
          {(tags.length > 0 || meta) && <View style={styles.meta}>
            {tags.map((t) => <Tag key={t} kind={t} />)}
            {meta && <Txt v="Meta" c={color.text.secondary} numberOfLines={1} style={{ flexShrink: 1 }}>{meta}</Txt>}
          </View>}
        </View>
        {action}
        {onMore && <Tap onPress={onMore} accessibilityLabel={`More for ${name}`} hitSlop={8}><View style={styles.more}><MoreHorizontal size={18} color={color.text.secondary} /></View></Tap>}
      </View>
    </Glass>
  );
}

/** v2/Shelf tile: the two-column "In stock" grid. */
export function ShelfTile({ icon, name, meta, onPress }: { icon?: string | null; name: string; meta: string; onPress?: () => void }) {
  return (
    <Tap onPress={onPress} disabled={!onPress} style={{ flex: 1 }} accessibilityLabel={`${name}, ${meta}`}>
      <Glass style={{ flex: 1 }}>
        <View style={styles.tile}>
          <EmojiBadge value={icon} name={name} size={48} round />
          <View style={{ gap: 2 }}>
            <Txt v="Body/Row" numberOfLines={1}>{name}</Txt>
            <Txt v="Meta" c={color.text.secondary} numberOfLines={1}>{meta}</Txt>
          </View>
        </View>
      </Glass>
    </Tap>
  );
}

/** v2/Settings row inside a glass card. Danger tone is red for leave / log out / delete. */
export function SettingsRow({ icon: Icon, label, value, tone = 'default', onPress, last }: {
  icon: LucideIcon; label: string; value?: string; tone?: 'default' | 'danger'; onPress?: () => void; last?: boolean;
}) {
  const danger = tone === 'danger';
  return (
    <Tap onPress={onPress} accessibilityLabel={value ? `${label}, ${value}` : label}>
      <View style={[styles.settings, !last && styles.divider]}>
        <View style={[styles.settingsIcon, { backgroundColor: danger ? 'rgba(194,65,12,0.1)' : 'rgba(135,107,222,0.1)' }]}>
          <Icon size={20} color={danger ? color.text.danger : color.icon.default} strokeWidth={1.75} />
        </View>
        <Txt v="Body/Row" c={danger ? color.text.danger : color.text.primary} style={{ flexShrink: 0 }}>{label}</Txt>
        <View style={{ flex: 1 }} />
        {value && <Txt v="Body/Default" c={color.text.secondary} numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>{value}</Txt>}
        {!danger && <ChevronRight size={14} color="#8A8599" strokeWidth={1.6} />}
      </View>
    </Tap>
  );
}

/** v2/Chore option in onboarding: pre-ticked chores with their effort. */
export function ChoreOption({ icon, title, tag, meta, selected, onPress }: { icon?: string | null; title: string; tag: TagKind; meta?: string; selected: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} feel="select" accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={title}>
      {selected ? (
        <View style={[styles.row, styles.optionOn]}>
          <EmojiBadge value={icon} name={title} round />
          <View style={styles.text}><Txt v="Body/Row">{title}</Txt><View style={styles.meta}><Tag kind={tag} />{meta && <Txt v="Meta" c={color.text.secondary}>{meta}</Txt>}</View></View>
          <Check done />
        </View>
      ) : (
        <Glass fill={0.62}>
          <View style={[styles.row, { paddingVertical: 10, paddingLeft: 12 }]}>
            <EmojiBadge value={icon} name={title} round />
            <View style={styles.text}><Txt v="Body/Row">{title}</Txt><View style={styles.meta}><Tag kind={tag} />{meta && <Txt v="Meta" c={color.text.secondary}>{meta}</Txt>}</View></View>
            <Check done={false} />
          </View>
        </Glass>
      )}
    </Tap>
  );
}

/** v2/Nudge card: a nudge style with a live notification preview. */
export function NudgeCard({ title, preview, selected, onPress }: { title: string; preview: string; selected: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} feel="select" accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={title}>
      <Glass outline={selected} strokeWidth={2} fill={0.62}>
        <View style={{ padding: 18, gap: 14 }}>
          <View style={styles.nudgeHead}>
            <Txt v="Title/Greeting">{title}</Txt>
            <Check done={selected} size={24} />
          </View>
          <Glass r={16} fill={0.62} lift={false}>
            <View style={styles.preview}>
              <Image source={require('../../../assets/brand/app-icon.png')} style={styles.previewIcon} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="Meta" c={color.text.secondary}>Roomie · now</Txt>
                <Txt v="Body/Default">{preview}</Txt>
              </View>
            </View>
          </Glass>
        </View>
      </Glass>
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  text: { flex: 1, gap: 6, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strike: { textDecorationLine: 'line-through', color: color.text.secondary },
  claim: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: color.action.primary },
  undo: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: color.bg.surface },
  poolIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFDCC8', alignItems: 'center', justifyContent: 'center' },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(135,107,222,0.12)' },
  more: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(135,107,222,0.08)', alignItems: 'center', justifyContent: 'center' },
  tile: { padding: 14, gap: 10 },
  settings: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 58 },
  settingsIcon: { width: 34, height: 34, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
  optionOn: { paddingVertical: 10, paddingLeft: 12, borderRadius: radius.card, backgroundColor: '#F4F0FF', borderWidth: 2, borderColor: '#8670F0' },
  nudgeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  previewIcon: { width: 28, height: 28, borderRadius: 7 },
});
