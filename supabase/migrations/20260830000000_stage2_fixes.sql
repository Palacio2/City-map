-- 1. Create view for popular cities
CREATE OR REPLACE VIEW popular_cities_view AS
SELECT 
    c.id as city_id,
    c.name as city_name,
    c.is_available,
    co.name as country_name,
    COUNT(DISTINCT d.id) as districts_count,
    COALESCE(SUM(udv.visit_count), 0) as total_visits
FROM cities c
JOIN countries co ON c.country_id = co.id
LEFT JOIN districts d ON d.city_id = c.id AND d.is_available = true
LEFT JOIN user_district_visits udv ON udv.district_data->>'city' = c.name
WHERE c.is_available = true
GROUP BY c.id, c.name, c.is_available, co.name;

-- 2. Fix Parser Jobs Policy (Restrict to admins)
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.parser_jobs;
CREATE POLICY "Allow admin read own jobs" ON public.parser_jobs
    FOR SELECT TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM admin_users));

