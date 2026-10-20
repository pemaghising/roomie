import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { persister, queryClient } from '../../lib/queryClient';
import { disablePush } from '../../lib/push';
import { exitDemo, isDemo, ME as DEMO_USER } from '../../demo/demo';

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isDemo()) { setSession({ user: { id: DEMO_USER } } as unknown as Session); setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_OUT') clearLocalData(); // expired token or another tab: the next account must not see this one's cache
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

function clearLocalData() {
  queryClient.clear();
  sessionStorage.clear(); // onboarding draft + pending contact belong to this user only
  return persister.removeClient();
}

export async function signOut() {
  if (isDemo()) { exitDemo(); window.location.replace('/welcome'); return; }
  // before auth.signOut: the delete RPC needs the session, and this device must stop getting this user's private pushes
  try { await disablePush(); } catch { /* offline or no push support: still sign out */ }
  await supabase.auth.signOut();
  await clearLocalData();
}
