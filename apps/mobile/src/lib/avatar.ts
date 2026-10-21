import * as ImagePicker from 'expo-image-picker';
import { rpc } from './state';
import { supabase } from './supabase';

export const avatarUrl = (path: string) => `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;

const TYPES: Record<string, { mime: string; ext: string }> = {
  'image/png': { mime: 'image/png', ext: 'png' },
  'image/webp': { mime: 'image/webp', ext: 'webp' },
};

export type PickResult = 'saved' | 'cancelled' | 'denied';

/** Pick a square-cropped photo, upload it to my folder under a new name (so caches never show the old one), then save the path. */
export async function pickAndUploadAvatar(userId: string, oldPath: string | null): Promise<PickResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return 'denied';
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, exif: false });
  if (res.canceled || !res.assets[0]) return 'cancelled';
  const asset = res.assets[0];
  const t = TYPES[asset.mimeType ?? ''] ?? { mime: 'image/jpeg', ext: 'jpg' };
  const bytes = await (await fetch(asset.uri)).arrayBuffer();
  const path = `${userId}/avatar-${Date.now()}.${t.ext}`;
  const up = await supabase.storage.from('avatars').upload(path, bytes, { contentType: t.mime });
  if (up.error) throw up.error;
  await rpc('set_avatar', { p_path: path });
  if (oldPath) void supabase.storage.from('avatars').remove([oldPath]);
  return 'saved';
}

export async function removeAvatar(oldPath: string) {
  await rpc('set_avatar', { p_path: null });
  void supabase.storage.from('avatars').remove([oldPath]);
}
