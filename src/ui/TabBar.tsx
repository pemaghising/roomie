import { ClipboardList, Home, User } from 'lucide-react';
import { m } from 'motion/react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { SPRING } from '../lib/motion';

const TABS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/chores', label: 'Chores', Icon: ClipboardList },
  { to: '/profile', label: 'Profile', Icon: User },
];

/** Tapping the tab you're already on scrolls its page back to the top, as on iOS. */
function scrollToTop() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.querySelector('.tab-view')?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
}

export function TabBar() {
  const { pathname } = useLocation();
  const [popped, setPopped] = useState<string | null>(null); // the icon bounces once when its tab becomes active, never on load
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, label, Icon }) => {
        const active = pathname === to;
        return (
          <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={`tabbar__item${active ? ' is-active' : ''}`}
            onClick={(e) => { if (active) { e.preventDefault(); scrollToTop(); } else setPopped(to); }}>
            {/* one white pill, handed from tab to tab with a shared layoutId */}
            {active && <m.span layoutId="tabbar-pill" className="tabbar__pill" transition={SPRING.smooth} aria-hidden />}
            <span className="tabbar__content">
              <Icon size={20} aria-hidden className={popped === to ? 'is-popping' : undefined} />
              <span>{label}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
