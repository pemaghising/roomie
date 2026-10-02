import { useState } from 'react';
import { normalizeCode } from '../../lib/code';
import { Button } from '../../ui/Button';
import { OtpInput } from '../../ui/OtpInput';
import { useDraft } from './draft';
import { Step } from './Step';
import { useJoinNext } from './useJoinNext';

export default function JoinStep() {
  const [draft] = useDraft();
  const [code, setCode] = useState(() => normalizeCode(sessionStorage.getItem('roomie-invite') ?? draft.code));
  const next = useJoinNext();
  return (
    <Step title="Join your home" subtitle="Enter the code your roommate shared." step={1} total={2}
      footer={<Button block disabled={code.length !== 6} onClick={() => next(code)}>Continue</Button>}>
      <OtpInput label="Household code" alphanumeric value={code} onChange={setCode} />
    </Step>
  );
}
