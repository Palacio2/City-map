// Old admin APIs must not retain their service-role capabilities after retirement.
export function retiredEndpoint(req: Request): Response {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  return Response.json(
    { error: 'ENDPOINT_RETIRED', message: 'Use admin-users-manage.' },
    { status: 410, headers },
  );
}
