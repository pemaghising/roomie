// R12 · Privacy & terms: what we keep, the rules, and a copy of your data.
import * as WebBrowser from 'expo-web-browser';
import { Share } from 'react-native';
import { useMe, withHousehold } from '@/lib/state';
import { Heading, Page, PlainRow, SettingsCard } from '@/ui/v2';

// the same pages the sign-in screen links to
const PRIVACY = 'https://roomie-theta.vercel.app/privacy.html';
const TERMS = 'https://meetroomie.vercel.app/';

export default withHousehold(Privacy);

function Privacy() {
  const { me, state } = useMe();
  const download = () => {
    const mine = {
      profile: state.profile, household: state.household?.name,
      chores: state.assignments.filter((a) => (a.claimed_by ?? a.user_id) === me),
      pantry: state.pantry.filter((i) => i.owner_id === me || i.owner_id === null),
      activity: state.activity,
    };
    void Share.share({ title: 'My Roomie data', message: JSON.stringify(mine, null, 2) });
  };
  return (
    <Page back>
      <Heading title="Privacy & terms" size="page" sub="What we keep, and the rules." />
      <SettingsCard>
        <PlainRow title="Privacy policy" onPress={() => void WebBrowser.openBrowserAsync(PRIVACY)} />
        <PlainRow title="Terms of use" onPress={() => void WebBrowser.openBrowserAsync(TERMS)} />
        <PlainRow title="Download your data" sub="Chores, pantry and history" onPress={download} last />
      </SettingsCard>
    </Page>
  );
}
