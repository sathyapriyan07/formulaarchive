CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core tables
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE CHECK (year >= 1950 AND year <= 2100),
  champion_driver_id UUID,
  champion_team_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  nationality TEXT,
  logo_url TEXT NOT NULL,
  car_image_url TEXT,
  active_from INTEGER,
  active_to INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  championships INTEGER NOT NULL DEFAULT 0 CHECK (championships >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  dob DATE,
  permanent_number TEXT NOT NULL,
  number TEXT NOT NULL,
  nationality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, dob),
  UNIQUE (number)
);

CREATE TABLE IF NOT EXISTS public.circuits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  locality TEXT,
  length_km NUMERIC(6, 3),
  first_race_year INTEGER CHECK (first_race_year >= 1900 AND first_race_year <= 2100),
  layout_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, country)
);

CREATE TABLE IF NOT EXISTS public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  circuit_id UUID NOT NULL REFERENCES public.circuits(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  round INTEGER NOT NULL CHECK (round > 0),
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, round),
  UNIQUE (season_id, name)
);

CREATE TABLE IF NOT EXISTS public.race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position > 0),
  points NUMERIC(8, 2) NOT NULL DEFAULT 0,
  laps INTEGER NOT NULL CHECK (laps >= 0),
  time TEXT,
  status TEXT NOT NULL DEFAULT 'Finished' CHECK (status IN ('Finished', 'DNF', 'DSQ', 'DNS')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (race_id, driver_id),
  UNIQUE (race_id, position)
);

CREATE TABLE IF NOT EXISTS public.driver_season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  podiums INTEGER NOT NULL DEFAULT 0 CHECK (podiums >= 0),
  poles INTEGER NOT NULL DEFAULT 0 CHECK (poles >= 0),
  dnfs INTEGER NOT NULL DEFAULT 0 CHECK (dnfs >= 0),
  points NUMERIC(8, 2) NOT NULL DEFAULT 0,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, driver_id)
);

CREATE TABLE IF NOT EXISTS public.team_season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  podiums INTEGER NOT NULL DEFAULT 0 CHECK (podiums >= 0),
  points NUMERIC(8, 2) NOT NULL DEFAULT 0,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, team_id)
);

-- Driver to team assignment per season (for current + past team history)
CREATE TABLE IF NOT EXISTS public.driver_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, driver_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add champion references after dependent tables exist
ALTER TABLE public.seasons DROP CONSTRAINT IF EXISTS seasons_champion_driver_id_fkey;
ALTER TABLE public.seasons DROP CONSTRAINT IF EXISTS seasons_champion_team_id_fkey;
ALTER TABLE public.seasons
  ADD CONSTRAINT seasons_champion_driver_id_fkey
  FOREIGN KEY (champion_driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;
ALTER TABLE public.seasons
  ADD CONSTRAINT seasons_champion_team_id_fkey
  FOREIGN KEY (champion_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seasons_updated_at ON public.seasons;
CREATE TRIGGER trg_seasons_updated_at BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_teams_updated_at ON public.teams;
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_drivers_updated_at ON public.drivers;
CREATE TRIGGER trg_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_circuits_updated_at ON public.circuits;
CREATE TRIGGER trg_circuits_updated_at BEFORE UPDATE ON public.circuits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_races_updated_at ON public.races;
CREATE TRIGGER trg_races_updated_at BEFORE UPDATE ON public.races FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_race_results_updated_at ON public.race_results;
CREATE TRIGGER trg_race_results_updated_at BEFORE UPDATE ON public.race_results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_driver_season_stats_updated_at ON public.driver_season_stats;
CREATE TRIGGER trg_driver_season_stats_updated_at BEFORE UPDATE ON public.driver_season_stats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_team_season_stats_updated_at ON public.team_season_stats;
CREATE TRIGGER trg_team_season_stats_updated_at BEFORE UPDATE ON public.team_season_stats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_driver_team_assignments_updated_at ON public.driver_team_assignments;
CREATE TRIGGER trg_driver_team_assignments_updated_at BEFORE UPDATE ON public.driver_team_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: safe admin check (no recursive policy evaluation)
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

-- Points helper
CREATE OR REPLACE FUNCTION public.f1_points_for_position(p_position INTEGER)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_position
    WHEN 1 THEN 25
    WHEN 2 THEN 18
    WHEN 3 THEN 15
    WHEN 4 THEN 12
    WHEN 5 THEN 10
    WHEN 6 THEN 8
    WHEN 7 THEN 6
    WHEN 8 THEN 4
    WHEN 9 THEN 2
    WHEN 10 THEN 1
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.apply_race_result_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.points IS NULL OR NEW.points = 0 THEN
    NEW.points := public.f1_points_for_position(NEW.position);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_race_results_apply_points ON public.race_results;
CREATE TRIGGER trg_race_results_apply_points
BEFORE INSERT OR UPDATE ON public.race_results
FOR EACH ROW
EXECUTE FUNCTION public.apply_race_result_points();

-- Recompute standings for a season whenever results change
CREATE OR REPLACE FUNCTION public.recompute_standings_for_season(p_season_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.driver_season_stats WHERE season_id = p_season_id;

  INSERT INTO public.driver_season_stats (season_id, driver_id, team_id, wins, podiums, poles, dnfs, points, position)
  WITH scored AS (
    SELECT
      r.season_id,
      rr.driver_id,
      rr.team_id,
      SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN rr.position <= 3 THEN 1 ELSE 0 END) AS podiums,
      SUM(CASE WHEN rr.status <> 'Finished' THEN 1 ELSE 0 END) AS dnfs,
      SUM(rr.points) AS points
    FROM public.race_results rr
    JOIN public.races r ON r.id = rr.race_id
    WHERE r.season_id = p_season_id
      AND r.status = 'completed'
    GROUP BY r.season_id, rr.driver_id, rr.team_id
  ), ranked AS (
    SELECT
      season_id,
      driver_id,
      team_id,
      wins,
      podiums,
      0 AS poles,
      dnfs,
      points,
      ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, podiums DESC, driver_id) AS position
    FROM scored
  )
  SELECT season_id, driver_id, team_id, wins, podiums, poles, dnfs, points, position
  FROM ranked;

  DELETE FROM public.team_season_stats WHERE season_id = p_season_id;

  INSERT INTO public.team_season_stats (season_id, team_id, wins, podiums, points, position)
  WITH scored AS (
    SELECT
      r.season_id,
      rr.team_id,
      SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN rr.position <= 3 THEN 1 ELSE 0 END) AS podiums,
      SUM(rr.points) AS points
    FROM public.race_results rr
    JOIN public.races r ON r.id = rr.race_id
    WHERE r.season_id = p_season_id
      AND r.status = 'completed'
    GROUP BY r.season_id, rr.team_id
  ), ranked AS (
    SELECT
      season_id,
      team_id,
      wins,
      podiums,
      points,
      ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, team_id) AS position
    FROM scored
  )
  SELECT season_id, team_id, wins, podiums, points, position
  FROM ranked;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_standings_for_race(p_race_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_season_id UUID;
BEGIN
  SELECT season_id INTO v_season_id FROM public.races WHERE id = p_race_id;
  IF v_season_id IS NOT NULL THEN
    PERFORM public.recompute_standings_for_season(v_season_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_race_results_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_standings_for_race(OLD.race_id);
  ELSE
    PERFORM public.recompute_standings_for_race(NEW.race_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_race_results_recompute ON public.race_results;
CREATE TRIGGER trg_race_results_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.race_results
FOR EACH ROW
EXECUTE FUNCTION public.handle_race_results_change();

CREATE OR REPLACE FUNCTION public.handle_race_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.recompute_standings_for_race(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_races_status_recompute ON public.races;
CREATE TRIGGER trg_races_status_recompute
AFTER UPDATE OF status ON public.races
FOR EACH ROW
EXECUTE FUNCTION public.handle_race_status_change();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seasons_year ON public.seasons(year);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON public.teams(is_active);
CREATE INDEX IF NOT EXISTS idx_drivers_name ON public.drivers(name);
CREATE INDEX IF NOT EXISTS idx_circuits_country ON public.circuits(country);
CREATE INDEX IF NOT EXISTS idx_races_season_round ON public.races(season_id, round);
CREATE INDEX IF NOT EXISTS idx_races_date ON public.races(date);
CREATE INDEX IF NOT EXISTS idx_race_results_race ON public.race_results(race_id);
CREATE INDEX IF NOT EXISTS idx_race_results_driver ON public.race_results(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_stats_season_points ON public.driver_season_stats(season_id, points DESC);
CREATE INDEX IF NOT EXISTS idx_team_stats_season_points ON public.team_season_stats(season_id, points DESC);
CREATE INDEX IF NOT EXISTS idx_driver_team_assignments_lookup ON public.driver_team_assignments(season_id, driver_id, team_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Views for homepage
CREATE OR REPLACE VIEW public.v_upcoming_race AS
SELECT
  r.id,
  r.name,
  r.date,
  r.status,
  r.round,
  s.year AS season_year,
  c.name AS circuit_name,
  c.country AS circuit_country,
  c.layout_image_url AS circuit_layout_image_url
FROM public.races r
JOIN public.seasons s ON s.id = r.season_id
JOIN public.circuits c ON c.id = r.circuit_id
WHERE r.status = 'scheduled'
  AND r.date >= CURRENT_DATE
ORDER BY r.date ASC
LIMIT 1;

CREATE OR REPLACE VIEW public.v_current_driver_standings AS
SELECT
  dss.season_id,
  s.year,
  dss.position,
  dss.points,
  dss.wins,
  dss.podiums,
  dss.poles,
  dss.dnfs,
  d.id AS driver_id,
  d.name AS driver_name,
  d.image_url AS driver_image_url,
  t.id AS team_id,
  t.name AS team_name,
  t.logo_url AS team_logo_url
FROM public.driver_season_stats dss
JOIN public.seasons s ON s.id = dss.season_id
JOIN public.drivers d ON d.id = dss.driver_id
JOIN public.teams t ON t.id = dss.team_id
WHERE s.year = (SELECT MAX(year) FROM public.seasons);

CREATE OR REPLACE VIEW public.v_current_team_standings AS
SELECT
  tss.season_id,
  s.year,
  tss.position,
  tss.points,
  t.id AS team_id,
  t.name AS team_name,
  t.logo_url AS team_logo_url
FROM public.team_season_stats tss
JOIN public.seasons s ON s.id = tss.season_id
JOIN public.teams t ON t.id = tss.team_id
WHERE s.year = (SELECT MAX(year) FROM public.seasons);

-- RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "public_read_seasons" ON public.seasons;
CREATE POLICY "public_read_seasons" ON public.seasons FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_teams" ON public.teams;
CREATE POLICY "public_read_teams" ON public.teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_drivers" ON public.drivers;
CREATE POLICY "public_read_drivers" ON public.drivers FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_circuits" ON public.circuits;
CREATE POLICY "public_read_circuits" ON public.circuits FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_races" ON public.races;
CREATE POLICY "public_read_races" ON public.races FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_race_results" ON public.race_results;
CREATE POLICY "public_read_race_results" ON public.race_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_driver_stats" ON public.driver_season_stats;
CREATE POLICY "public_read_driver_stats" ON public.driver_season_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_team_stats" ON public.team_season_stats;
CREATE POLICY "public_read_team_stats" ON public.team_season_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_driver_team_assignments" ON public.driver_team_assignments;
CREATE POLICY "public_read_driver_team_assignments" ON public.driver_team_assignments FOR SELECT USING (true);

-- Admin write policies
DROP POLICY IF EXISTS "admin_insert_seasons" ON public.seasons;
CREATE POLICY "admin_insert_seasons" ON public.seasons FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_seasons" ON public.seasons;
CREATE POLICY "admin_update_seasons" ON public.seasons FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_seasons" ON public.seasons;
CREATE POLICY "admin_delete_seasons" ON public.seasons FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_teams" ON public.teams;
CREATE POLICY "admin_insert_teams" ON public.teams FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_teams" ON public.teams;
CREATE POLICY "admin_update_teams" ON public.teams FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_teams" ON public.teams;
CREATE POLICY "admin_delete_teams" ON public.teams FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_drivers" ON public.drivers;
CREATE POLICY "admin_insert_drivers" ON public.drivers FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_drivers" ON public.drivers;
CREATE POLICY "admin_update_drivers" ON public.drivers FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_drivers" ON public.drivers;
CREATE POLICY "admin_delete_drivers" ON public.drivers FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_circuits" ON public.circuits;
CREATE POLICY "admin_insert_circuits" ON public.circuits FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_circuits" ON public.circuits;
CREATE POLICY "admin_update_circuits" ON public.circuits FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_circuits" ON public.circuits;
CREATE POLICY "admin_delete_circuits" ON public.circuits FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_races" ON public.races;
CREATE POLICY "admin_insert_races" ON public.races FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_races" ON public.races;
CREATE POLICY "admin_update_races" ON public.races FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_races" ON public.races;
CREATE POLICY "admin_delete_races" ON public.races FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_race_results" ON public.race_results;
CREATE POLICY "admin_insert_race_results" ON public.race_results FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_race_results" ON public.race_results;
CREATE POLICY "admin_update_race_results" ON public.race_results FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_race_results" ON public.race_results;
CREATE POLICY "admin_delete_race_results" ON public.race_results FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_driver_stats" ON public.driver_season_stats;
CREATE POLICY "admin_insert_driver_stats" ON public.driver_season_stats FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_driver_stats" ON public.driver_season_stats;
CREATE POLICY "admin_update_driver_stats" ON public.driver_season_stats FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_driver_stats" ON public.driver_season_stats;
CREATE POLICY "admin_delete_driver_stats" ON public.driver_season_stats FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_team_stats" ON public.team_season_stats;
CREATE POLICY "admin_insert_team_stats" ON public.team_season_stats FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_team_stats" ON public.team_season_stats;
CREATE POLICY "admin_update_team_stats" ON public.team_season_stats FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_team_stats" ON public.team_season_stats;
CREATE POLICY "admin_delete_team_stats" ON public.team_season_stats FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_assignments" ON public.driver_team_assignments;
CREATE POLICY "admin_insert_assignments" ON public.driver_team_assignments FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_assignments" ON public.driver_team_assignments;
CREATE POLICY "admin_update_assignments" ON public.driver_team_assignments FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_assignments" ON public.driver_team_assignments;
CREATE POLICY "admin_delete_assignments" ON public.driver_team_assignments FOR DELETE USING (public.is_admin());

-- user_roles policies (safe, non-recursive)
DROP POLICY IF EXISTS "read_own_role" ON public.user_roles;
CREATE POLICY "read_own_role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin_read_roles" ON public.user_roles;
CREATE POLICY "admin_read_roles" ON public.user_roles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_roles" ON public.user_roles;
CREATE POLICY "admin_insert_roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_roles" ON public.user_roles;
CREATE POLICY "admin_update_roles" ON public.user_roles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_roles" ON public.user_roles;
CREATE POLICY "admin_delete_roles" ON public.user_roles FOR DELETE USING (public.is_admin());
