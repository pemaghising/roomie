import { useNavigate } from 'react-router';
import { Button } from '../../ui/Button';
import { useDraft } from './draft';
import { Step } from './Step';

export default function HomeNameStep() {
  const navigate = useNavigate();
  const [draft, update] = useDraft();
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (draft.homeName.trim()) navigate('/onboarding/chores'); }}>
      <Step title="Name your home" subtitle="Your roommates will see this." step={1} total={4}
        footer={<Button block type="submit" disabled={!draft.homeName.trim()}>Continue</Button>}>
        <label className="field">
          <span className="field__label">Home name</span>
          <span className="field__control">
            <input autoFocus maxLength={40} placeholder="Flat 4B" value={draft.homeName} onChange={(e) => update({ homeName: e.target.value })} />
          </span>
        </label>
      </Step>
    </form>
  );
}
