import { useNavigate } from 'react-router';
import { useMe } from '../../lib/state';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { Step } from './Step';

export default function InviteStep() {
  const { state } = useMe();
  const navigate = useNavigate();
  const toast = useToast();
  const code = state.household!.invite_code;
  const link = `${window.location.origin}/j/${code}`;
  const text = `Join ${state.household!.name} on Roomie — code ${code}: ${link}`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Join our home on Roomie', text, url: link }); return; } catch { /* cancelled */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); toast.show('Code copied.'); }
    catch { toast.show("Couldn't copy — long-press the code instead."); }
  };

  // no back button: /onboarding/busy would run create_household a second time
  return (
    <Step title="Invite your roommates." subtitle="Share this code with your housemates." step={5} total={5} back={false} bodyClass="step__body--center"
      footer={<><Button block onClick={share}>Share Code</Button><Button block variant="ghost" onClick={() => navigate('/', { replace: true })}>I'll invite them later</Button></>}>
      <button type="button" className="invite-card" onClick={copy} aria-label={`Household code ${code.split('').join(' ')}. Tap to copy.`}>
        <span className="invite-card__label">HOUSEHOLD CODE</span>
        <span className="code-big" aria-hidden>{code.slice(0, 3)} {code.slice(3)}</span>
        <span className="invite-card__hint">Roommates can enter this code during onboarding to step right into your shared home.</span>
      </button>
    </Step>
  );
}
