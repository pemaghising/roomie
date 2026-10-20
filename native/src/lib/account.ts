import { unregisterPush } from './push';
import { supabase } from './supabase';

/**
 * Permanently delete the signed-in account: remove the avatar files, stop reminders on this device, delete the account on the server,
 * then clear the local session. Throws if the server refuses, so the caller can tell the person and keep them signed in.
 */
export async function deleteAccount(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const files = await supabase.storage.from('avatars').list(user.id);
    if (files.data?.length) await supabase.storage.from('avatars').remove(files.data.map((f) => `${user.id}/${f.name}`));
  }
  await unregisterPush();
  const { error } = await supabase.rpc('delete_account');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}
