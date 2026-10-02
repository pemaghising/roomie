import { AnimatePresence, m } from 'motion/react';
import { type ComponentType, lazy, type ReactNode, Suspense, useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation, useOutlet, useParams } from 'react-router';
import { confirmedSince, gateFor, type Gate, guardAction, HOME_OF } from './lib/gate';
import { useAppState, useRealtime } from './lib/state';
import { useAuth } from './features/auth/AuthProvider';
import { Splash } from './ui/Splash';
import { EASE_IN, EASE_OUT } from './ui/motion';
import { TabBar } from './ui/TabBar';
import Welcome from './features/auth/Welcome';
import Home from './features/home/Home';
import { OfflineBanner } from './ui/OfflineBanner';

// Welcome and Home are the first screens and stay in the entry chunk; everything else loads on demand.
const ContactEntry = lazy(() => import('./features/auth/ContactEntry'));
const VerifyCode = lazy(() => import('./features/auth/VerifyCode'));
const ProfileStep = lazy(() => import('./features/onboarding/ProfileStep'));
const StartStep = lazy(() => import('./features/onboarding/StartStep'));
const JoinStep = lazy(() => import('./features/onboarding/JoinStep'));
const HomeNameStep = lazy(() => import('./features/onboarding/HomeNameStep'));
const ChoresStep = lazy(() => import('./features/onboarding/ChoresStep'));
const BusyStep = lazy(() => import('./features/onboarding/BusyStep'));
const InviteStep = lazy(() => import('./features/onboarding/InviteStep'));
const PlanReview = lazy(() => import('./features/plan/PlanReview'));
const HouseholdSettings = lazy(() => import('./features/profile/HouseholdSettings'));
const Activity = lazy(() => import('./features/activity/Activity'));
// The other tabs are prefetched on idle (see Tabs). Once loaded they render synchronously: a plain React.lazy
// would still suspend once and React throttles the reveal (~300 ms), which the first tab switch would show.
function prefetchable(load: () => Promise<{ default: ComponentType }>) {
  let Loaded: ComponentType | undefined;
  const prefetch = () => load().then((m) => { Loaded = m.default; return m; });
  const Lazy = lazy(prefetch);
  return { Screen: () => (Loaded ? <Loaded /> : <Lazy />), prefetch };
}
const { Screen: Chores, prefetch: loadChores } = prefetchable(() => import('./features/chores/Chores'));
const { Screen: Profile, prefetch: loadProfile } = prefetchable(() => import('./features/profile/Profile'));

const PAGE_LOADED_AT = Date.now();

function Guard({ allow, children }: { allow: Gate[]; children: ReactNode }) {
  const auth = useAuth();
  const state = useAppState();
  const gate = gateFor(auth, state);
  const confirmed = confirmedSince(state, PAGE_LOADED_AT);
  const action = guardAction(gate, allow, confirmed);
  // a cache restored within staleTime won't refetch on its own, so waiting for confirmation would never end
  const idle = action === 'wait' && !confirmed && state.fetchStatus === 'idle';
  useEffect(() => { if (idle) void state.refetch(); }, [idle]); // eslint-disable-line react-hooks/exhaustive-deps
  if (action === 'wait') return <Splash />;
  if (action === 'render') return <>{children}</>;
  if (gate === 'error') return <Splash error onRetry={() => state.refetch()} />;
  return <Navigate to={HOME_OF[gate as keyof typeof HOME_OF]} replace />;
}

function Root() {
  const { data } = useAppState();
  useRealtime(data?.household?.id);
  return (<><OfflineBanner /><Suspense fallback={<Splash />}><Outlet /></Suspense></>);
}

/** Holds on to the route it mounted with, so an exiting tab keeps showing its own page. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

function Tabs() {
  const { pathname } = useLocation();
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
    idle(() => { void loadChores(); void loadProfile(); });
  }, []);
  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div key={pathname} className="tab-view"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE_OUT } }}
          exit={{ opacity: 0, x: -8, transition: { duration: 0.14, ease: EASE_IN } }}>
          {/* no fallback: the tab bar stays put and the view fades in once its chunk is ready */}
          <Suspense fallback={null}><FrozenOutlet /></Suspense>
        </m.div>
      </AnimatePresence>
      <TabBar />
    </>
  );
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
