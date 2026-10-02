import { AnimatePresence, m, motionValue, type MotionValue, useDragControls, useIsPresent, useReducedMotion } from 'motion/react';
import { type ComponentType, type ContextType, lazy, type ReactNode, Suspense, useContext, useEffect, useRef, useState } from 'react';
import {
  createBrowserRouter, Navigate, RouterProvider, UNSAFE_LocationContext as LocationContext,
  useNavigate, useNavigationType, useOutlet, useParams,
} from 'react-router';
import { confirmedSince, gateFor, type Gate, guardAction, HOME_OF } from './lib/gate';
import { EASE_IN, EASE_OUT, SPRING } from './lib/motion';
import { isStandalone } from './lib/platform';
import { EDGE, navDirection, stackKey, swipeBackCompletes } from './lib/stack';
import { useAppState, useRealtime } from './lib/state';
import { useAuth } from './features/auth/AuthProvider';
import { Splash } from './ui/Splash';
import { TabsSkeleton } from './ui/Skeleton';
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
// The other tabs and the pushed screens are prefetched on idle (see Tabs). Once loaded they render synchronously:
// a plain React.lazy would still suspend once and React throttles the reveal (~300 ms), which the first switch would show.
function prefetchable(load: () => Promise<{ default: ComponentType }>) {
  let Loaded: ComponentType | undefined;
  const prefetch = () => load().then((m) => { Loaded = m.default; return m; });
  const Lazy = lazy(prefetch);
  return { Screen: () => (Loaded ? <Loaded /> : <Lazy />), prefetch };
}
const { Screen: Chores, prefetch: loadChores } = prefetchable(() => import('./features/chores/Chores'));
const { Screen: Profile, prefetch: loadProfile } = prefetchable(() => import('./features/profile/Profile'));
const { Screen: PlanReview, prefetch: loadPlan } = prefetchable(() => import('./features/plan/PlanReview'));
const { Screen: HouseholdSettings, prefetch: loadHousehold } = prefetchable(() => import('./features/profile/HouseholdSettings'));
const { Screen: Activity, prefetch: loadActivity } = prefetchable(() => import('./features/activity/Activity'));

const PAGE_LOADED_AT = Date.now();

function Guard({ allow, children, fallback = <Splash /> }: { allow: Gate[]; children: ReactNode; fallback?: ReactNode }) {
  const auth = useAuth();
  const state = useAppState();
  const gate = gateFor(auth, state);
  const confirmed = confirmedSince(state, PAGE_LOADED_AT);
  const action = guardAction(gate, allow, confirmed);
  // a cache restored within staleTime won't refetch on its own, so waiting for confirmation would never end
  const idle = action === 'wait' && !confirmed && state.fetchStatus === 'idle';
  useEffect(() => { if (idle) void state.refetch(); }, [idle]); // eslint-disable-line react-hooks/exhaustive-deps
  if (action === 'wait') return <>{fallback}</>;
  if (action === 'render') return <>{children}</>;
  if (gate === 'error') return <Splash error onRetry={() => state.refetch()} />;
  return <Navigate to={HOME_OF[gate as keyof typeof HOME_OF]} replace />;
}

type LocationCtx = ContextType<typeof LocationContext>;
interface Entry { id: number; key: string; path: string; outlet: ReactNode; loc: LocationCtx; x: MotionValue<number>; pushed: boolean; leaving?: boolean }
let ids = 0;

/**
 * An iOS navigation stack. A pushed screen slides in from the right over the one beneath, which stays mounted
 * (frozen on its own route), shifts 30% left and dims. Back reverses it; on an installed app an edge swipe drags it.
 */
function Stack() {
  const outlet = useOutlet();
  const loc = useContext(LocationContext);
  const navigationType = useNavigationType();
  const path = loc.location.pathname;
  const key = stackKey(path);
  const width = () => window.innerWidth;
  const make = (pushed: boolean): Entry => ({ id: ++ids, key, path, outlet, loc, x: motionValue(pushed ? width() : 0), pushed });
  const [stack, setStack] = useState<Entry[]>(() => [make(false)]);
  const live = stack.filter((e) => !e.leaving);
  const top = live[live.length - 1];
  if (top.key !== key) {
    const dir = navDirection(top.path, path, navigationType);
    const below = live[live.length - 2];
    if (dir === 'push') setStack([...live, make(true)]);
    else if (dir === 'pop' && below?.key === key) setStack(stack.map((e) => (e === top ? { ...e, leaving: true } : e)));
    else setStack([make(false)]);
  } else {
    // the top screen renders live; remember what it showed so it can freeze there once covered or leaving
    top.outlet = outlet; top.loc = loc; top.path = path;
  }
  const remove = (e: Entry) => setStack((s) => s.filter((x) => x !== e));
  return (
    <>{stack.map((e, i) => (
      <StackView key={e.id} entry={e} above={stack[i + 1]} isTop={e === top} canSwipe={e === top && i > 0} onGone={() => remove(e)}>
        <LocationContext.Provider value={e === top ? loc : e.loc}>
          <Suspense fallback={<Splash />}>{e === top ? outlet : e.outlet}</Suspense>
        </LocationContext.Provider>
      </StackView>
    ))}</>
  );
}

function StackView({ entry, above, isTop, canSwipe, onGone, children }: {
  entry: Entry; above?: Entry; isTop: boolean; canSwipe: boolean; onGone: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const drag = useDragControls();
  const navigate = useNavigate();
  const swipe = canSwipe && isStandalone(); // in the browser, Safari's own back gesture owns the edge
  // the screen beneath follows the one above it: 30% behind and slightly dimmed, all the way through a drag
  useEffect(() => {
    if (!above || reduced) { entry.x.set(0); ref.current?.style.setProperty('--dim', '0'); return; }
    const follow = (v: number) => {
      const p = Math.min(1, Math.max(0, 1 - v / window.innerWidth)); // 1 = fully covered
      entry.x.set(-0.3 * window.innerWidth * p);
      ref.current?.style.setProperty('--dim', String(0.12 * p));
    };
    follow(above.x.get());
    return above.x.on('change', follow);
  }, [above, entry, reduced]);
  const covered = Boolean(above);
  const leaving = Boolean(entry.leaving);
  const motion = above ? {} : reduced
    ? { initial: entry.pushed ? { opacity: 0 } : false as const, animate: { opacity: leaving ? 0 : 1 }, transition: { duration: 0.2, ease: EASE_OUT } }
    : { animate: { x: leaving ? window.innerWidth : 0 }, transition: SPRING.smooth };
  return (
    <m.div ref={ref} className={`view${covered ? ' view--covered' : ''}${swipe ? ' view--swipe' : ''}${entry.pushed && !covered ? ' view--top-pushed' : ''}`}
      style={{ x: entry.x }} {...motion}
      inert={!isTop} aria-hidden={!isTop || undefined}
      onAnimationComplete={() => { if (leaving) onGone(); }}
      drag={swipe ? 'x' : false} dragControls={drag} dragListener={false} dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0, right: 1 }}
      dragTransition={{ bounceStiffness: SPRING.smooth.stiffness, bounceDamping: SPRING.smooth.damping }}
      onPointerDown={swipe ? (e) => { if (e.clientX <= EDGE) drag.start(e); } : undefined}
      onDragEnd={(_, info) => { if (swipeBackCompletes(info.offset.x, window.innerWidth, info.velocity.x)) navigate(-1); }}>
      {children}
    </m.div>
  );
}

function Root() {
  const { data } = useAppState();
  useRealtime(data?.household?.id);
  return (<><OfflineBanner /><Stack /></>);
}

/** Holds on to the route and location it last rendered while present, so an exiting view keeps showing its own page. */
function Frozen() {
  const outlet = useOutlet();
  const loc = useContext(LocationContext);
  const present = useIsPresent();
  const kept = useRef({ outlet, loc });
  if (present) kept.current = { outlet, loc };
  return <LocationContext.Provider value={kept.current.loc}>{kept.current.outlet}</LocationContext.Provider>;
}

function Tabs() {
  const { pathname } = useContext(LocationContext).location;
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
    idle(() => { for (const load of [loadChores, loadProfile, loadActivity, loadPlan, loadHousehold]) void load(); });
  }, []);
  return (
    <>
      {/* wait: the old tab is gone (80 ms) before the new one fades in, so two pages never show through each other */}
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={pathname} className="tab-view"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0, transition: { x: SPRING.smooth, opacity: { duration: 0.2, ease: EASE_OUT } } }}
          exit={{ opacity: 0, transition: { duration: 0.08, ease: EASE_IN } }}>
          {/* no fallback: the tab bar stays put and the view fades in once its chunk is ready */}
          <Suspense fallback={null}><Frozen /></Suspense>
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
        element: <Guard allow={ready} fallback={<TabsSkeleton />}><Tabs /></Guard>,
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
