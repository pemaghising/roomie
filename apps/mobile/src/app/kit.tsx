// Dev-only page that renders every v2 component and variant, plus long-content cases, for checking against Figma.
import { Redirect } from 'expo-router';
import { Bell, House, LogOut, Trash2 } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AddButton, Avatar, BackButton, Button, Check, Chip, ChoreOption, CodeInput, DayPicker, Glass, GreetingHeader, Heading, IconButton,
  ItemCard, Nav, NudgeCard, PoolBanner, PoolRow, ReasonRow, SectionHeader, SegmentedControl, SettingsRow, ShelfTile, Snackbar, StepBar, Toast, AddRow, PantryTabs,
  StreakCard, Tag, TaskRow, TextField, Toggle, Txt, UpcomingCard, ViewSwitch, type TabName,
} from '@/ui/v2';
import { color, layout } from '@/ui/tokens';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <View style={{ gap: 12 }}><Txt v="Meta/Medium" c={color.text.secondary}>{title}</Txt>{children}</View>;
}

export default function Kit() {
  const insets = useSafeAreaInsets();
  const [seg, setSeg] = useState<'mine' | 'house' | 'pool'>('mine');
  const [view, setView] = useState<'week' | 'month'>('month');
  const [days, setDays] = useState([2, 3, 5]);
  const [on, setOn] = useState(true);
  const [code, setCode] = useState('4829');
  const [tab, setTab] = useState<TabName>('index');
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <ScrollView style={{ backgroundColor: color.bg.canvas }} contentContainerStyle={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]}>
      <Group title="Buttons">
        <Button title="Create my account" />
        <Button title="Create my account" kind="secondary" />
        <Button title="Delete account" kind="destructive" />
        <View style={styles.row}><BackButton onPress={() => {}} /><IconButton icon={Bell} label="Activity" dot /><AddButton onPress={() => {}} /></View>
      </Group>
      <Group title="Fields">
        <TextField placeholder="What should we call you?" defaultValue="Ramesh" />
        <TextField defaultValue="Ramesh" error />
        <CodeInput value={code} onChange={setCode} />
        <CodeInput value="482916" onChange={() => {}} error />
      </Group>
      <Group title="Tags">
        <View style={styles.wrap}>{(['light', 'medium', 'heavy', 'inPool', 'out', 'low', 'doNotTouch', 'askFirst'] as const).map((k) => <Tag key={k} kind={k} />)}</View>
      </Group>
      <Group title="Controls">
        <SegmentedControl value={seg} onChange={setSeg} options={[{ value: 'mine', label: 'Mine' }, { value: 'house', label: 'Whole house' }, { value: 'pool', label: 'Shared pool', count: 2 }]} />
        <View style={styles.row}><ViewSwitch value={view} onChange={setView} options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} /><Toggle value={on} onChange={setOn} label="Reminders" /></View>
        <StepBar step={3} />
        <DayPicker value={days} onChange={setDays} />
        <View style={styles.wrap}><Chip label="Flat 3B" /><Chip label="Flat 3B" selected /><Check done={false} /><Check done /></View>
      </Group>
      <Group title="Headers">
        <GreetingHeader name="Ramesh" dateLabel="Saturday, 17 October" hello="Morning" unread />
        <GreetingHeader name="Ramesh Bahadur Shrestha-Thapa" dateLabel="Saturday, 17 October" hello="Morning" />
        <Heading title="Make your place feel like" accent="home." sub="Share the chores, share the snacks, keep the peace." />
        <Heading title="Chores" size="page" />
        <SectionHeader title="Your tasks today" link="Why these?" onLink={() => {}} />
        <View style={styles.row}><Avatar name="Priya" /><Avatar name="Aman" tint="#FFEDE5" /><Avatar name="Ramesh" sun /><Avatar name="Sita" tint="#E6F0FA" /><Avatar name="Hari" /></View>
      </Group>
      <Group title="Streak">
        <StreakCard days={23} week={['done', 'done', 'done', 'today', 'future', 'future', 'future']} />
        <StreakCard days={23} drooped week={['done', 'done', 'missed', 'today', 'future', 'future', 'future']} />
        <StreakCard days={1} week={['none', 'none', 'none', 'today', 'future', 'future', 'future']} />
      </Group>
      <Group title="Rows">
        <PoolBanner count={2} onPress={() => {}} />
        <TaskRow icon="🧹" title="Sweep living room" tag="light" onToggle={() => {}} />
        <TaskRow icon="🗑️" title="Take out trash" tag="light" meta="Today" state="mine" onToggle={() => {}} />
        <TaskRow icon="🧺" title="Do the laundry" tag="medium" state="done" onToggle={() => {}} />
        <PoolRow icon="🪣" title="Mop bathroom floor" tag="heavy" onClaim={() => {}} />
        <PoolRow icon="♻️" title="Take out recycling" tag="light" onClaim={() => {}} />
        <Glass pad={16}><ReasonRow icon="🧹" title="Sweep living room" reason="Your turn — Priya did it last week." tag="light" />
          <ReasonRow icon="🧺" title="Do the laundry" reason="Evens out effort across the house this week." tag="medium" last /></Glass>
        <UpcomingCard icon="🧽" title="Sunday deep clean" sub="Bathroom + kitchen, shared with Aman" onPress={() => {}} />
        <ItemCard icon="Cup with straw" name="Protein shake" tags={['doNotTouch']} onMore={() => {}} />
        <ItemCard icon="Glass of milk" name="Oat milk with a very long brand name that wraps" tags={['out']} onMore={() => {}} />
        <View style={styles.row}><ShelfTile icon="Olive" name="Olive oil" meta="Aman · 2 days ago" /><ShelfTile icon="Roll of paper" name="Paper towels" meta="You · 4 days ago" /></View>
        <Glass pad={16}><SettingsRow icon={House} label="Home name" value="Parijat Chowk Flat, Lalitpur Ward 3" /><SettingsRow icon={LogOut} label="Log out" tone="danger" /><SettingsRow icon={Trash2} label="Delete account" tone="danger" last /></Glass>
        <AddRow label="Add your own chore" dashed onPress={() => {}} />
        <AddRow label="Add a shared item" onPress={() => {}} />
        <PantryTabs value="shared" onChange={() => {}} options={[{ value: 'shared', label: 'Shared' }, { value: 'mine', label: 'My items' }, { value: 'mates', label: 'Roommates' }]} />
        <ChoreOption icon="🧽" title="Wash dishes" tag="light" meta="Daily" selected onPress={() => {}} />
        <ChoreOption icon="🧽" title="Wash dishes" tag="light" meta="Daily" selected={false} onPress={() => {}} />
        <NudgeCard title="Motivate me" preview="Dishes are yours tonight. Keep the streak going!" selected onPress={() => {}} />
        <NudgeCard title="Just the facts" preview="Wash dishes is due today at 7 pm." selected={false} onPress={() => {}} />
        <TaskRow icon="🧽" title="Wash dishes" tag="light" meta="Today" tint="#F4F0FF" plainCheck onToggle={() => {}} />
      </Group>
      <Group title="Overlays">
        <Toast message="Mop bathroom floor is yours. You’ll get a lighter week." action="Undo" />
        <Snackbar message="Milk marked as Out" action="Undo" />
      </Group>
      <Group title="Nav">
        <Nav active={tab} onTab={setTab} onAdd={() => {}} />
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: layout.margin, gap: layout.sectionGap },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
