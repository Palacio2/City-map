/** Only sign an author's own avatar; never sign arbitrary paths from editable user metadata. */
export function commentAvatar(value: unknown, owner: unknown, supabaseUrl: string): { path?: string; url?: string } {
  if (typeof value !== 'string' || value.length > 2048 || typeof owner !== 'string') return {};
  let path = value;
  if (/^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.username || url.password) return {};
      if (url.origin !== new URL(supabaseUrl).origin) return { url: url.href };
      const prefix = ['/storage/v1/object/public/avatars/', '/storage/v1/object/sign/avatars/'].find(p => url.pathname.startsWith(p));
      if (!prefix) return {};
      path = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch { return {}; }
  }
  const parts = path.split('/');
  if (parts.length !== 2 || parts[0] !== owner || !/^[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(parts[1])) return {};
  return { path };
}
