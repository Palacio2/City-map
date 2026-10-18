export class RequestError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export async function readJsonObject(req: Request, maxBytes = 32_768): Promise<Record<string, unknown>> {
  if (!req.body) throw new RequestError('Missing request body');
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let length = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new RequestError('Request too large', 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new RequestError('Invalid JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError('Invalid request');
  return value as Record<string, unknown>;
}
