CREATE TABLE IF NOT EXISTS public.parser_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    progress INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb,
    results JSONB DEFAULT NULL,
    logs JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Увімкнути RLS, щоб дозволити доступ лише адмінам або сервісному ключу
ALTER TABLE public.parser_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role access" ON public.parser_jobs
    FOR ALL
    USING (auth.role() = 'service_role');
    
CREATE POLICY "Allow authenticated read access" ON public.parser_jobs
    FOR SELECT
    TO authenticated
    USING (true);
