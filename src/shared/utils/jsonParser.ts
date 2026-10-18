export const safeParse = <T,>(data: unknown, defaultVal: T): T => {
  if (typeof data === 'string') {
    try { return JSON.parse(data) as T; } catch { return defaultVal; }
  }
  return (data as T) || defaultVal;
};
