import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDraft } from './draft';
import { Step } from './Step';

export default function StartStep() {
  const navigate = useNavigate();
  const [, update] = useDraft();
  useEffect(() => { if (sessionStorage.getItem('roomie-invite')) navigate('/onboarding/join', { replace: true }); }, [navigate]);
  return (
    <Step title="Your space" subtitle="Start a new home, or join the one your roommates already set up." back={false}>
      <button className="choice-card" onClick={() => { update({ mode: 'create' }); navigate('/onboarding/home'); }}>
        <strong>Create a home</strong><span className="muted">Set up chores and invite your roommates.</span>
      </button>
      <button className="choice-card" onClick={() => { update({ mode: 'join' }); navigate('/onboarding/join'); }}>
        <strong>Join with a code</strong><span className="muted">Got a 6-character code or a link? Use it here.</span>
      </button>
    </Step>
  );
}
