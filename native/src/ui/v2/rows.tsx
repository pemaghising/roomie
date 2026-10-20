import { Image } from 'expo-image';
import { ChevronRight, MoreHorizontal, Plus, Users, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { motion } from '../motion';
import { color, elevation, radius } from '../tokens';
import { Glass, Tap, Txt } from './primitives';
import { Check, EmojiBadge, Tag } from './tags';
import type { TagKind } from './tag-style';

const layout = LinearTransition.springify().damping(motion.tab.damping).stiffness(motion.tab.stiffness).mass(motion.tab.mass);

/** v2/Task row: glass card, emoji badge, title, tag + meta, check. Done fades to 55 %; "mine" gets the gradient outline. */
export function TaskRow({ icon, title, tag, meta, state = 'todo', onToggle, onPress, right, tint, plainCheck }: {
  icon?: string | null; title: string; tag?: TagKind; meta?: string; state?: 'todo' | 'done' | 'mine';
  onToggle?: () => void; onPress?: () => void; right?: ReactNode; tint?: string; plainCheck?: boolean;
}) {
  const done = state === 'done';
  return (
    <Animated.View layout={layout} style={{ opacity: done ? 0.55 : 1 }}>
      <Tap onPress={onPress ?? onToggle} disabled={!onPress && !onToggle} accessibilityLabel={`${title}${done ? ', done' : ''}`}>
        <Glass outline={state === 'mine'}>
          <View style={styles.row}>
            <EmojiBadge value={icon} name={title} tint={tint} />
            <View style={styles.text}>
              <Txt v="Body/Row" numberOfLines={1} style={done && styles.strike}>{title}</Txt>
              {(tag || meta) && <View style={styles.meta}>
                {tag && <Tag kind={tag} />}
                {meta && <Txt v="Meta" c={color.text.secondary} numberOfLines={1} style={{ flexShrink: 1 }}>{meta}</Txt>}
              </View>}
            </View>
            {right ?? (onToggle && (
              <Tap onPress={onToggle} feel="complete" accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`Mark ${title} ${done ? 'not done' : 'done'}`} hitSlop={10}>
                <Check done={done} plain={plainCheck} />
              </Tap>
            ))}
          </View>
        </Glass>
      </Tap>
    </Animated.View>
  );
}

/** v2/Pool row (frame C1c): light card with the lilac→peach outline, peach emoji tile and a Claim button. Never names who missed it. */
export function PoolRow({ icon, title, tag, meta, onClaim }: { icon?: string | null; title: string; tag?: TagKind; meta?: string; onClaim?: () => void }) {
  return (
    <Animated.View layout={layout}>
      <Glass outline fill={0.9}>
        <View style={styles.row}>
          <EmojiBadge value={icon} name={title} tint="#F5EDE6" />
          <View style={styles.text}>
            <Txt v="Body/Row" numberOfLines={1}>{title}</Txt>
            {(tag || meta) && <View style={styles.meta}>
              {tag && <Tag kind={tag} />}
              {meta && <Txt v="Meta" c={color.text.secondary} numberOfLines={1} style={{ flexShrink: 1 }}>{meta}</Txt>}
            </View>}
          </View>
          <Tap onPress={onClaim} feel="complete" accessibilityLabel={`Claim ${title}`}>
            <View style={[styles.claim, elevation.liftSmall]}><Txt v="Tag" c={color.text.onAccent}>Claim</Txt></View>
          </Tap>
        </View>
      </Glass>
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
      <View style={[elevation.liftSmall, { shadowColor: '#111827', shadowOpacity: 0.06, borderRadius: 22 }]}><EmojiBadge value={icon} name={title} round /></View>
      <View style={[styles.text, { gap: 2 }]}>
        <Txt v="Body/Label">{title}</Txt>
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
        <View style={styles.row}>
          <EmojiBadge value={icon} name={title} />
          <View style={[styles.text, { gap: 2 }]}>
            <Txt v="Body/Row" numberOfLines={1}>{title}</Txt>
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
    <Glass fill={0.62}>
      <View style={[styles.row, { paddingVertical: 12, paddingLeft: 12, paddingRight: 14 }]}>
        <EmojiBadge value={icon} name={name} />
        <View style={styles.text}>
          <Txt v="Body/Button" numberOfLines={1}>{name}</Txt>
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
      <Glass style={{ flex: 1 }} fill={0.62}>
        <View style={styles.tile}>
          <View style={[elevation.liftSmall, { shadowColor: '#111827', shadowOpacity: 0.06, borderRadius: 24, alignSelf: 'flex-start' }]}><EmojiBadge value={icon} name={name} size={48} round tint={color.bg.surface} /></View>
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
export function SettingsRow({ icon: Icon, label, value, chip, tone = 'default', onPress, last }: {
  icon: LucideIcon; label: string; value?: string; chip?: string; tone?: 'default' | 'danger'; onPress?: () => void; last?: boolean;
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
        {chip && <View style={styles.chip}><Txt v="Tag" c={color.text.link}>{chip}</Txt></View>}
        {!danger && <ChevronRight size={14} color="#8A8599" strokeWidth={1.6} />}
      </View>
    </Tap>
  );
}

/** A settings card: the glass group that holds SettingsRow / PlainRow lines (R1, R9, R11, R12). */
export function SettingsCard({ children }: { children: ReactNode }) {
  return <Glass fill={0.62}><View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>{children}</View></Glass>;
}

/** A text-only settings line: title, optional sub line, and a value, a control or a chevron on the right. */
export function PlainRow({ title, sub, value, right, onPress, last }: {
  title: string; sub?: string; value?: string; right?: ReactNode; onPress?: () => void; last?: boolean;
}) {
  const body = (
    <View style={[styles.plain, !last && styles.divider]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="Body/Row">{title}</Txt>
        {sub && <Txt v="Meta" c={color.text.secondary}>{sub}</Txt>}
      </View>
      {value && <Txt v="Body/Default" c={color.text.secondary}>{value}</Txt>}
      {right ?? (onPress && <ChevronRight size={14} color="#8A8599" strokeWidth={1.6} />)}
    </View>
  );
  return onPress ? <Tap onPress={onPress} accessibilityLabel={sub ? `${title}, ${sub}` : title}>{body}</Tap> : body;
}

/** v2/Chore option (frame 09): pre-ticked chores with their effort. Selected = light card with the lilac→peach outline. */
export function ChoreOption({ icon, title, tag, meta, selected, onPress }: { icon?: string | null; title: string; tag: TagKind; meta?: string; selected: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} feel="select" accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={title}>
      <Glass outline={selected} strokeWidth={1.5} fill={0.9}>
        <View style={[styles.row, { paddingVertical: 10, paddingLeft: 12, paddingRight: 18 }]}>
          <EmojiBadge value={icon} name={title} tint="#F4F0FF" />
          <View style={[styles.text, { gap: 5 }]}><Txt v="Body/Button">{title}</Txt><View style={styles.meta}><Tag kind={tag} />{meta && <Txt v="Meta" c={color.text.secondary}>{meta}</Txt>}</View></View>
          <Check done={selected} plain />
        </View>
      </Glass>
    </Tap>
  );
}

/** v2/Nudge card (frame 11): style name in Geist Medium 17, a check, and a notification preview. */
export function NudgeCard({ title, preview, selected, onPress }: { title: string; preview: string; selected: boolean; onPress: () => void }) {
  const body = (
    <View style={styles.preview}>
      <Image source={require('../../../assets/brand/app-icon.png')} style={styles.previewIcon} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="Meta" c={color.text.secondary}>Roomie · now</Txt>
        <Txt v="Body/Default">{preview}</Txt>
      </View>
    </View>
  );
  return (
    <Tap onPress={onPress} feel="select" accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={title}>
      <Glass outline={selected} strokeWidth={1.5} fill={0.62}>
        <View style={{ padding: 18, gap: 14 }}>
          <View style={styles.nudgeHead}>
            <Txt v="Body/Button">{title}</Txt>
            <Check done={selected} plain />
          </View>
          {selected ? <Glass r={16} fill={0.62} lift={false}>{body}</Glass> : <View style={styles.previewFlat}>{body}</View>}
        </View>
      </Glass>
    </Tap>
  );
}

/** v2/Add row: "Add your own chore" / "Add a shared item". Dashed outline in onboarding. */
export function AddRow({ label, onPress, dashed }: { label: string; onPress: () => void; dashed?: boolean }) {
  const inner = (
    <View style={[styles.row, { paddingVertical: 10, paddingLeft: 12, paddingRight: 18 }]}>
      <View style={styles.plus}><Plus size={18} color={color.text.link} strokeWidth={2} /></View>
      <Txt v="Body/Row" c="#6D4AD6">{label}</Txt>
    </View>
  );
  return (
    <Tap onPress={onPress} accessibilityLabel={label}>
      {dashed ? <View style={styles.dashed}>{inner}</View> : <Glass fill={0.62}>{inner}</Glass>}
    </Tap>
  );
}

/** v2/Pantry tabs: text tabs with a short violet underline under the active one. */
export function PantryTabs<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.ptabs} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Tap key={o.value} feel="select" onPress={() => onChange(o.value)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Txt v="Body/Row" c={on ? color.text.primary : color.text.secondary}>{o.label}</Txt>
              <View style={[styles.underline, { backgroundColor: on ? color.icon.default : 'transparent' }]} />
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  text: { flex: 1, gap: 6, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strike: { textDecorationLine: 'line-through', color: color.text.secondary },
  claim: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: color.action.primary },
  poolIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFDCC8', alignItems: 'center', justifyContent: 'center' },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(135,107,222,0.12)' },
  more: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  tile: { padding: 14, gap: 10 },
  chip: { paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: color.action.selectedTint, justifyContent: 'center' },
  plain: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 56 },
  settings: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 58 },
  settingsIcon: { width: 34, height: 34, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
  nudgeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  previewIcon: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: '#E9E5F7' },
  previewFlat: { borderRadius: 16, backgroundColor: '#EDEAF7' },
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFE7FF', alignItems: 'center', justifyContent: 'center' },
  dashed: { borderRadius: radius.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(122,95,214,0.45)', backgroundColor: 'rgba(252,251,255,0.4)' },
  ptabs: { flexDirection: 'row', gap: 22 },
  underline: { width: 20, height: 3, borderRadius: 2 },
});
