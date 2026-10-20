import { unregisterPush } from './push';
import { supabase } from './supabase';

/**
 * Permanently delete the signed-in account on the server, then remove the avatar files, stop reminders on this device
 * and clear the local session. Throws if the server refuses, so the caller can tell the person and keep them signed in.
 */
export async function deleteAccount(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const files = user ? (await supabase.storage.from('avatars').list(user.id)).data ?? [] : [];
  // the server delete goes first: if it refuses, the person keeps their account and their photo
  const { error } = await supabase.rpc('delete_account');
  if (error) throw error;
  if (user && files.length) await supabase.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`)).catch(() => {});
  await unregisterPush().catch(() => {});
  await supabase.auth.signOut({ scope: 'local' });
}
