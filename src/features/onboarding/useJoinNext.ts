import { useNavigate } from 'react-router';
import { useDraft } from './draft';

/** Switch the draft to join mode and continue; BusyStep makes the join_household call. */
export function useJoinNext() {
  const navigate = useNavigate();
  const [, update] = useDraft();
  return (code: string) => { update({ mode: 'join', code }); sessionStorage.removeItem('roomie-invite'); navigate('/onboarding/busy'); };
}
