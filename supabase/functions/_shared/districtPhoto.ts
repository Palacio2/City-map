// Stored URLs are locators, never public download grants. Only sign this
// project's bucket and a filename belonging to the requested district.
export function districtPhotoPath(value: unknown, districtId: string): string | null {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(districtId)) return null;
  let path = value;
  if (/^https?:/i.test(value)) {
    try {
      const url = new URL(value);
      if (url.origin !== new URL(Deno.env.get('SUPABASE_URL') ?? '').origin || url.search || url.hash) return null;
      const prefix = '/storage/v1/object/public/district-photos/';
      if (!url.pathname.startsWith(prefix)) return null;
      path = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch { return null; }
  }
  return new RegExp(`^${districtId}-[0-9]+\\.(?:webp|jpe?g|png)$`, 'i').test(path) ? path : null;
}

export function districtPhotoUrl(districtId: string): string {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/get-district-photo?id=${encodeURIComponent(districtId)}`;
}

export async function signDistrictPhoto(db: { storage: { from: (bucket: string) => { createSignedUrl: (path: string, seconds: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }> } } }, value: unknown, districtId: string, seconds = 60) {
  const path = districtPhotoPath(value, districtId);
  if (!path) return null;
  const { data, error } = await db.storage.from('district-photos').createSignedUrl(path, seconds);
  if (error || !data?.signedUrl) throw new Error('Photo unavailable');
  return data.signedUrl;
}
