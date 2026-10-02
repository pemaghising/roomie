import { ClipboardList, Home, User } from 'lucide-react';
import { NavLink } from 'react-router';

const TABS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/chores', label: 'Chores', Icon: ClipboardList, end: false },
  { to: '/profile', label: 'Profile', Icon: User, end: false },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`}>
          <Icon size={20} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
