-- Admin import RLS guardrails: public read-only, admin write

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_season_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read seasons" ON public.seasons;
CREATE POLICY "Public read seasons" ON public.seasons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read drivers" ON public.drivers;
CREATE POLICY "Public read drivers" ON public.drivers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read circuits" ON public.circuits;
CREATE POLICY "Public read circuits" ON public.circuits FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read races" ON public.races;
CREATE POLICY "Public read races" ON public.races FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read race_results" ON public.race_results;
CREATE POLICY "Public read race_results" ON public.race_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read driver_season_stats" ON public.driver_season_stats;
CREATE POLICY "Public read driver_season_stats" ON public.driver_season_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read team_season_stats" ON public.team_season_stats;
CREATE POLICY "Public read team_season_stats" ON public.team_season_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin insert seasons" ON public.seasons;
CREATE POLICY "Admin insert seasons" ON public.seasons FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin update seasons" ON public.seasons;
CREATE POLICY "Admin update seasons" ON public.seasons FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin insert teams" ON public.teams;
CREATE POLICY "Admin insert teams" ON public.teams FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin update teams" ON public.teams;
CREATE POLICY "Admin update teams" ON public.teams FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin insert drivers" ON public.drivers;
CREATE POLICY "Admin insert drivers" ON public.drivers FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin update drivers" ON public.drivers;
CREATE POLICY "Admin update drivers" ON public.drivers FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin insert circuits" ON public.circuits;
CREATE POLICY "Admin insert circuits" ON public.circuits FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin update circuits" ON public.circuits;
CREATE POLICY "Admin update circuits" ON public.circuits FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin insert races" ON public.races;
CREATE POLICY "Admin insert races" ON public.races FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin update races" ON public.races;
CREATE POLICY "Admin update races" ON public.races FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin insert race_results" ON public.race_results;
CREATE POLICY "Admin insert race_results" ON public.race_results FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin update race_results" ON public.race_results;
CREATE POLICY "Admin update race_results" ON public.race_results FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin insert driver_season_stats" ON public.driver_season_stats;
CREATE POLICY "Admin insert driver_season_stats" ON public.driver_season_stats FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin update driver_season_stats" ON public.driver_season_stats;
CREATE POLICY "Admin update driver_season_stats" ON public.driver_season_stats FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin insert team_season_stats" ON public.team_season_stats;
CREATE POLICY "Admin insert team_season_stats" ON public.team_season_stats FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin update team_season_stats" ON public.team_season_stats;
CREATE POLICY "Admin update team_season_stats" ON public.team_season_stats FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
