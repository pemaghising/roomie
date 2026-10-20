import { useEffect } from 'react';
import { Splash } from '../ui/Splash';
import { exitDemo, isDemo, resetDemo, startDemo } from './demo';
import './demo.css';

/** /demo: switch this tab into demo mode, then reload so auth and the cache start in demo. */
export function DemoStart() {
  useEffect(() => { startDemo(); window.location.replace('/'); }, []);
  return <Splash />;
}

export function DemoBar() {
  if (!isDemo()) return null;
  return (
    <div className="demo-bar" role="region" aria-label="Demo mode">
      <span className="demo-bar__text"><b>Demo flat</b> · nothing is saved</span>
      <span className="demo-bar__actions">
        <button type="button" onClick={() => { resetDemo(); window.location.reload(); }}>Reset</button>
        <button type="button" onClick={() => { exitDemo(); window.location.replace('/welcome'); }}>Exit</button>
      </span>
    </div>
  );
}
