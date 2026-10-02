import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../ui/Button';
import { OtpInput } from '../../ui/OtpInput';
import { useDraft } from './draft';
import { Step } from './Step';
import { useJoinNext } from './useJoinNext';

export default function HomeNameStep() {
  const navigate = useNavigate();
  const [draft, update] = useDraft();
  const [code, setCode] = useState('');
  const join = useJoinNext();
  return (
    <Step title="Name your home" subtitle="Establish a brand new space for your housemates." step={2} total={5}>
      <form className="name-form" onSubmit={(e) => { e.preventDefault(); if (draft.homeName.trim()) navigate('/onboarding/chores'); }}>
        <input className="name-input" aria-label="Home name" autoFocus maxLength={40} placeholder="e.g. Haven Cottage or Apt 4B"
          value={draft.homeName} onChange={(e) => update({ homeName: e.target.value })} />
        <Button block type="submit" disabled={!draft.homeName.trim()}>Continue</Button>
      </form>
      <section className="code-section" aria-labelledby="got-code">
        <h2 id="got-code">Got a code?</h2>
        <p className="muted">Enter the 6-digit code shared by your roommates.</p>
        <OtpInput label="Household code" alphanumeric autoFocus={false} value={code} onChange={setCode} onComplete={join} />
      </section>
    </Step>
  );
}
