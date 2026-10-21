// The save button on the settings screens: runs the write, refreshes the state, says so, and goes back.
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useBack } from './use-back';
import { useRef, useState } from 'react';
import { useToast } from '@/ui/toast';
import { messageOf, STATE_KEY } from './state';

export function useSave(write: () => Promise<unknown>, done = 'Saved.', { stay = false } = {}) {
  const qc = useQueryClient();
  const router = useRouter();
  const back = useBack();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      await write();
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show(done, { tick: true });
      running.current = false;
      if (stay) setBusy(false);
      else back();
    } catch (e) {
      running.current = false;
      setError(messageOf(e));
      setBusy(false);
    }
  };
  return { run, busy, error, setError };
}
