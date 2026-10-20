// The save button on the settings screens: runs the write, refreshes the state, says so, and goes back.
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useToast } from '@/ui/toast';
import { messageOf, STATE_KEY } from './state';

export function useSave(write: () => Promise<unknown>, done = 'Saved.', { stay = false } = {}) {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await write();
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show(done, { tick: true });
      if (stay) setBusy(false);
      else router.back();
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  };
  return { run, busy, error, setError };
}
