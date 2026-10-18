/** Exhaust explicit pages rather than silently accepting the API row cap. */
export async function collectPages<T>(fetchPage: (offset: number, size: number) => Promise<T[]>, size = 500): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; offset < 100_000; offset += size) {
    const page = await fetchPage(offset, size);
    result.push(...page);
    if (page.length < size) return result;
  }
  throw new Error('Result exceeds safe export size; use a paginated export');
}
