import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDraft } from './draft';
import { Step } from './Step';

export default function StartStep() {
  const navigate = useNavigate();
  const [, update] = useDraft();
  useEffect(() => { if (sessionStorage.getItem('roomie-invite')) navigate('/onboarding/join', { replace: true }); }, [navigate]);
  return (
    <Step title="Your space." subtitle="Each peaceful home begins with clear intentions. Choose how you want to set up your shared world." step={1} total={5}>
      <button className="choice-card choice-card--lav" onClick={() => { update({ mode: 'create' }); navigate('/onboarding/home'); }}>
        <strong>Create a new home</strong><span>Establish a fresh shared sanctuary and invite your roommates to collaborate.</span>
        <span className="choice-card__go" aria-hidden><ArrowRight size={16} /></span>
      </button>
      <button className="choice-card choice-card--peach" onClick={() => { update({ mode: 'join' }); navigate('/onboarding/join'); }}>
        <strong>Join an existing home</strong><span>Enter your household code to seamlessly step into an established shared community.</span>
        <span className="choice-card__go" aria-hidden><ArrowRight size={16} /></span>
      </button>
    </Step>
  );
}
