-- Archive-first relational refactor (season -> races -> results -> drivers/teams/circuits)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Teams: add constructor history fields
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS active_from INTEGER,
  ADD COLUMN IF NOT EXISTS active_to INTEGER;

-- Drivers: split names and permanent number while keeping compatibility column `name`
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS permanent_number TEXT;

UPDATE public.drivers
SET
  first_name = COALESCE(first_name, split_part(name, ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(regexp_replace(name, '^\S+\s*', ''), '')),
  permanent_number = COALESCE(permanent_number, number)
WHERE first_name IS NULL
   OR last_name IS NULL
   OR permanent_number IS NULL;

ALTER TABLE public.drivers
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN permanent_number SET NOT NULL;

-- Keep legacy `name` in sync for existing UI/relations
CREATE OR REPLACE FUNCTION public.sync_driver_name_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.first_name IS NULL OR btrim(NEW.first_name) = '' THEN
    NEW.first_name := split_part(COALESCE(NEW.name, ''), ' ', 1);
  END IF;

  IF NEW.last_name IS NULL OR btrim(NEW.last_name) = '' THEN
    NEW.last_name := NULLIF(regexp_replace(COALESCE(NEW.name, ''), '^\S+\s*', ''), '');
  END IF;

  NEW.name := trim(concat_ws(' ', NEW.first_name, NEW.last_name));
  NEW.number := COALESCE(NEW.permanent_number, NEW.number, '0');
  NEW.permanent_number := COALESCE(NEW.permanent_number, NEW.number, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drivers_sync_name_fields ON public.drivers;
CREATE TRIGGER trg_drivers_sync_name_fields
BEFORE INSERT OR UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.sync_driver_name_fields();

-- Circuits: locality + archive naming
ALTER TABLE public.circuits
  ADD COLUMN IF NOT EXISTS locality TEXT,
  ADD COLUMN IF NOT EXISTS length_km NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS layout_image_url TEXT;

UPDATE public.circuits
SET layout_image_url = COALESCE(layout_image_url, image_url)
WHERE layout_image_url IS NULL;

UPDATE public.circuits
SET length_km = COALESCE(length_km, length)
WHERE length_km IS NULL;

-- Race results: explicit points from race result record
ALTER TABLE public.race_results
  ADD COLUMN IF NOT EXISTS points NUMERIC(8, 2) NOT NULL DEFAULT 0;

-- Team season stats: wins + podiums derived from race_results
ALTER TABLE public.team_season_stats
  ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS podiums INTEGER NOT NULL DEFAULT 0;

-- Ensure key archive constraints
ALTER TABLE public.races
  DROP CONSTRAINT IF EXISTS races_season_id_round_key;
ALTER TABLE public.races
  ADD CONSTRAINT races_season_id_round_key UNIQUE (season_id, round);

ALTER TABLE public.race_results
  DROP CONSTRAINT IF EXISTS race_results_race_id_driver_id_key;
ALTER TABLE public.race_results
  ADD CONSTRAINT race_results_race_id_driver_id_key UNIQUE (race_id, driver_id);

-- Keep result points aligned when omitted/zero
CREATE OR REPLACE FUNCTION public.apply_race_result_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.points IS NULL OR NEW.points = 0 THEN
    NEW.points := CASE NEW.position
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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_race_results_apply_points ON public.race_results;
CREATE TRIGGER trg_race_results_apply_points
BEFORE INSERT OR UPDATE ON public.race_results
FOR EACH ROW
EXECUTE FUNCTION public.apply_race_result_points();

-- Standings must be derived from race_results points, wins/podiums computed
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
      ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driver_id) AS position
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

  UPDATE public.seasons s
  SET
    champion_driver_id = dss.driver_id,
    champion_team_id = tss.team_id
  FROM (
    SELECT driver_id
    FROM public.driver_season_stats
    WHERE season_id = p_season_id
    ORDER BY points DESC, wins DESC, driver_id
    LIMIT 1
  ) dss,
  (
    SELECT team_id
    FROM public.team_season_stats
    WHERE season_id = p_season_id
    ORDER BY points DESC, wins DESC, team_id
    LIMIT 1
  ) tss
  WHERE s.id = p_season_id;
END;
$$;

-- Archive read models
CREATE OR REPLACE VIEW public.v_driver_career AS
SELECT
  d.id AS driver_id,
  trim(concat_ws(' ', d.first_name, d.last_name)) AS driver_name,
  COUNT(DISTINCT dss.season_id) AS seasons_participated,
  COALESCE(SUM(dss.points), 0) AS career_points,
  COALESCE(SUM(dss.wins), 0) AS career_wins,
  COALESCE(SUM(dss.podiums), 0) AS career_podiums,
  COALESCE(SUM(dss.dnfs), 0) AS career_dnfs,
  COALESCE(SUM(CASE WHEN s.champion_driver_id = d.id THEN 1 ELSE 0 END), 0) AS championships
FROM public.drivers d
LEFT JOIN public.driver_season_stats dss ON dss.driver_id = d.id
LEFT JOIN public.seasons s ON s.year = dss.season_id
GROUP BY d.id, d.first_name, d.last_name;

CREATE OR REPLACE VIEW public.v_team_history AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  COALESCE(MIN(s.year), t.active_from) AS first_season,
  COALESCE(MAX(s.year), t.active_to) AS last_season,
  COALESCE(SUM(tss.points), 0) AS total_points,
  COALESCE(SUM(tss.wins), 0) AS total_wins,
  COALESCE(SUM(CASE WHEN s.champion_team_id = t.id THEN 1 ELSE 0 END), 0) AS championships
FROM public.teams t
LEFT JOIN public.team_season_stats tss ON tss.team_id = t.id
LEFT JOIN public.seasons s ON s.year = tss.season_id
GROUP BY t.id, t.name, t.active_from, t.active_to;

CREATE OR REPLACE VIEW public.v_circuit_history AS
SELECT
  c.id AS circuit_id,
  c.name AS circuit_name,
  c.country,
  c.locality,
  c.first_race_year,
  COUNT(r.id) AS races_hosted
FROM public.circuits c
LEFT JOIN public.races r ON r.circuit_id = c.id
GROUP BY c.id, c.name, c.country, c.locality, c.first_race_year;

-- Archive performance indexes
CREATE INDEX IF NOT EXISTS idx_races_season_id ON public.races(season_id);
CREATE INDEX IF NOT EXISTS idx_race_results_driver_id ON public.race_results(driver_id);
CREATE INDEX IF NOT EXISTS idx_race_results_race_id ON public.race_results(race_id);
CREATE INDEX IF NOT EXISTS idx_driver_season_stats_season_driver ON public.driver_season_stats(season_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_team_season_stats_season_team ON public.team_season_stats(season_id, team_id);
