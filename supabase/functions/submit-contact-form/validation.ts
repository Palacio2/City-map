import { RequestError } from '../_shared/request.ts';
import { feedbackObjectPath } from '../_shared/feedbackStorage.ts';

function field(value: unknown, max: number, required = false): string | null {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || value.length > max) throw new RequestError('Invalid field');
  const clean = value.trim();
  if (required && !clean) throw new RequestError('Missing field');
  return clean || null;
}

export function contactRecord(body: Record<string, unknown>, userId: string | null, supabaseUrl: string) {
  const type = body.type ?? 'contact';
  if (!['contact', 'critical', 'data_error', 'ui_bug', 'suggestion'].includes(String(type))) throw new RequestError('Invalid message type');
  const email = field(body.email, 254, true)!;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RequestError('Invalid email');
  const name = field(body.name, 150);
  const message = field(body.message, 10_000);
  let screenshot: string | null = null;
  if (body.screenshot_url != null) {
    screenshot = feedbackObjectPath(field(body.screenshot_url, 2048), supabaseUrl);
    if (!userId || !screenshot || !screenshot.startsWith(userId + '/')) throw new RequestError('Invalid screenshot');
  }
  if (type === 'contact' && (!name || name.length < 2 || !message || message.length < 10 || body.consent_accepted !== true)) {
    throw new RequestError('Name, message and consent are required');
  }
  if (!message && !screenshot) throw new RequestError('Message or screenshot is required');
  let page = field(body.page_url, 2048);
  if (page) {
    let url: URL;
    try { url = new URL(page); } catch { throw new RequestError('Invalid page URL'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new RequestError('Invalid page URL');
    page = url.origin + url.pathname;
  }
  return {
    name, email, message: message ?? '[Без опису]', type: String(type),
    user_id: userId, // A client-supplied user_id must never assign authorship.
    page_url: page, screenshot_url: screenshot,
    browser_info: field(body.browser_info, 1024), screen_size: field(body.screen_size, 32),
    status: 'new', consent_accepted: type === 'contact' ? true : null,
  };
}
