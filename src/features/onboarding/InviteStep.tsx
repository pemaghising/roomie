import { Copy, Share2 } from 'lucide-react';
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
  const copy = async () => { await navigator.clipboard.writeText(link); toast.show('Invite link copied.'); };

  return (
    <Step title="Invite your roommates" subtitle="Share this code. Everyone who joins is part of next week's plan." step={4} total={4} back={false}
      footer={<><Button block onClick={share}><Share2 size={18} aria-hidden /> Share invite</Button><Button block variant="ghost" onClick={() => navigate('/', { replace: true })}>Done</Button></>}>
      <div className="code-big" aria-label={`Household code ${code.split('').join(' ')}`}>{code}</div>
      <Button variant="secondary" onClick={copy}><Copy size={16} aria-hidden /> Copy link</Button>
    </Step>
  );
}
