-- OpenF1 import support (idempotent)

ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS api_race_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_races_api_race_id
  ON public.races(api_race_id)
  WHERE api_race_id IS NOT NULL;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS openf1_driver_number TEXT;

UPDATE public.drivers
SET openf1_driver_number = COALESCE(openf1_driver_number, permanent_number, number)
WHERE openf1_driver_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_drivers_openf1_driver_number
  ON public.drivers(openf1_driver_number)
  WHERE openf1_driver_number IS NOT NULL;

ALTER TABLE public.race_results
  ADD COLUMN IF NOT EXISTS points NUMERIC(8, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_races_season_id ON public.races(season_id);
CREATE INDEX IF NOT EXISTS idx_race_results_race_id ON public.race_results(race_id);
CREATE INDEX IF NOT EXISTS idx_race_results_driver_id ON public.race_results(driver_id);
