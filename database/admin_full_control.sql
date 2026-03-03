CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS champion_driver_id UUID,
  ADD COLUMN IF NOT EXISTS champion_team_id UUID;

ALTER TABLE public.seasons
  DROP CONSTRAINT IF EXISTS seasons_champion_driver_id_fkey;

ALTER TABLE public.seasons
  ADD CONSTRAINT seasons_champion_driver_id_fkey
  FOREIGN KEY (champion_driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

ALTER TABLE public.seasons
  DROP CONSTRAINT IF EXISTS seasons_champion_team_id_fkey;

ALTER TABLE public.seasons
  ADD CONSTRAINT seasons_champion_team_id_fkey
  FOREIGN KEY (champion_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.driver_team_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id INTEGER NOT NULL REFERENCES public.seasons(year) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(season_id, driver_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_team_assignments_season ON public.driver_team_assignments(season_id);
CREATE INDEX IF NOT EXISTS idx_driver_team_assignments_driver ON public.driver_team_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_team_assignments_team ON public.driver_team_assignments(team_id);

ALTER TABLE public.driver_team_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read driver_team_assignments" ON public.driver_team_assignments;
CREATE POLICY "Public read driver_team_assignments"
ON public.driver_team_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin insert driver_team_assignments" ON public.driver_team_assignments;
CREATE POLICY "Admin insert driver_team_assignments"
ON public.driver_team_assignments FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin update driver_team_assignments" ON public.driver_team_assignments;
CREATE POLICY "Admin update driver_team_assignments"
ON public.driver_team_assignments FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin delete driver_team_assignments" ON public.driver_team_assignments;
CREATE POLICY "Admin delete driver_team_assignments"
ON public.driver_team_assignments FOR DELETE
USING (public.is_admin());
