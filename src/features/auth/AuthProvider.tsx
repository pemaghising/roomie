import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { persister, queryClient } from '../../lib/queryClient';

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export async function signOut() {
  await supabase.auth.signOut();
  queryClient.clear();
  sessionStorage.clear(); // onboarding draft + pending contact belong to this user only
  await persister.removeClient();
}
