import { useState } from 'react';
import { useNavigate } from 'react-router';
import { normalizeCode } from '../../lib/code';
import { Button } from '../../ui/Button';
import { OtpInput } from '../../ui/OtpInput';
import { useDraft } from './draft';
import { Step } from './Step';

export default function JoinStep() {
  const navigate = useNavigate();
  const [draft, update] = useDraft();
  const [code, setCode] = useState(() => normalizeCode(sessionStorage.getItem('roomie-invite') ?? draft.code));
  const next = (c: string) => { update({ mode: 'join', code: c }); sessionStorage.removeItem('roomie-invite'); navigate('/onboarding/busy'); };
  return (
    <Step title="Join your home" subtitle="Enter the code your roommate shared." step={1} total={2}
      footer={<Button block disabled={code.length !== 6} onClick={() => next(code)}>Continue</Button>}>
      <OtpInput label="Household code" alphanumeric value={code} onChange={setCode} />
    </Step>
  );
}
