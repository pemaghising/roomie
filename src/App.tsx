import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useParams } from 'react-router';
import { gateFor, type Gate, HOME_OF } from './lib/gate';
import { useAppState, useRealtime } from './lib/state';
import { useAuth } from './features/auth/AuthProvider';
import { Splash } from './ui/Splash';
import { TabBar } from './ui/TabBar';
import Welcome from './features/auth/Welcome';
import ContactEntry from './features/auth/ContactEntry';
import VerifyCode from './features/auth/VerifyCode';
import ProfileStep from './features/onboarding/ProfileStep';
import StartStep from './features/onboarding/StartStep';
import JoinStep from './features/onboarding/JoinStep';
import HomeNameStep from './features/onboarding/HomeNameStep';
import ChoresStep from './features/onboarding/ChoresStep';
import BusyStep from './features/onboarding/BusyStep';
import InviteStep from './features/onboarding/InviteStep';
import Home from './features/home/Home';
import Chores from './features/chores/Chores';
import PlanReview from './features/plan/PlanReview';
import Profile from './features/profile/Profile';
import HouseholdSettings from './features/profile/HouseholdSettings';
import Activity from './features/activity/Activity';

function useGate(): Gate {
  const auth = useAuth();
  const state = useAppState();
  return gateFor(auth, state);
}

function Guard({ allow, children }: { allow: Gate[]; children: ReactNode }) {
  const gate = useGate();
  const state = useAppState();
  if (gate === 'loading') return <Splash />;
  if (gate === 'error') return <Splash error onRetry={() => state.refetch()} />;
  if (allow.includes(gate)) return <>{children}</>;
  return <Navigate to={HOME_OF[gate]} replace />;
}

function Root() {
  const { data } = useAppState();
  useRealtime(data?.household?.id);
  return <Outlet />;
}

function Tabs() {
  return (<><Outlet /><TabBar /></>);
}

/** Invite links (/j/ABC123) remember the code, then continue through the normal gates. */
function InviteLink() {
  const { code = '' } = useParams();
  sessionStorage.setItem('roomie-invite', code);
  return <Navigate to="/onboarding/join" replace />;
}

const ready: Gate[] = ['ready'];
const household: Gate[] = ['needs_household'];

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/welcome', element: <Guard allow={['signed_out']}><Welcome /></Guard> },
      { path: '/signin/:method', element: <Guard allow={['signed_out']}><ContactEntry /></Guard> },
      { path: '/verify', element: <Guard allow={['signed_out']}><VerifyCode /></Guard> },
      { path: '/j/:code', element: <InviteLink /> },
      { path: '/onboarding/profile', element: <Guard allow={['needs_profile']}><ProfileStep /></Guard> },
      { path: '/onboarding/start', element: <Guard allow={household}><StartStep /></Guard> },
      { path: '/onboarding/join', element: <Guard allow={household}><JoinStep /></Guard> },
      { path: '/onboarding/home', element: <Guard allow={household}><HomeNameStep /></Guard> },
      { path: '/onboarding/chores', element: <Guard allow={household}><ChoresStep /></Guard> },
      { path: '/onboarding/busy', element: <Guard allow={['needs_household', 'ready']}><BusyStep /></Guard> },
      { path: '/onboarding/invite', element: <Guard allow={ready}><InviteStep /></Guard> },
      {
        element: <Guard allow={ready}><Tabs /></Guard>,
        children: [
          { path: '/', element: <Home /> },
          { path: '/chores', element: <Chores /> },
          { path: '/profile', element: <Profile /> },
        ],
      },
      { path: '/plan', element: <Guard allow={ready}><PlanReview /></Guard> },
      { path: '/profile/household', element: <Guard allow={ready}><HouseholdSettings /></Guard> },
      { path: '/activity', element: <Guard allow={ready}><Activity /></Guard> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
