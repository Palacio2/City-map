// Accept existing public URLs and new object paths, never another host/bucket.
export function feedbackObjectPath(value: unknown, supabaseUrl: string): string | null {
  if (typeof value !== 'string' || !value) return null;
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.origin !== new URL(supabaseUrl).origin) return null;
      const prefix = ['/storage/v1/object/public/feedback_images/', '/storage/v1/object/sign/feedback_images/']
        .find(candidate => url.pathname.startsWith(candidate));
      if (!prefix) return null;
      path = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch {
      return null;
    }
  }
  if (!path.split('/').every(segment => /^[\w.-]+$/.test(segment) && segment !== '.' && segment !== '..')) return null;
  return path;
}

export function canManageFeedback(role: string, tabs: readonly string[], action: string): boolean {
  const permissions: Record<string, string> = { get_messages: 'feedback', change_status: 'feedback.change_status', delete_message: 'feedback.delete' };
  const permission = Object.hasOwn(permissions, action) ? permissions[action] : undefined;
  return Boolean(permission && (role === 'super_admin' || (role === 'admin' && tabs.includes(permission))));
}
