-- Add API identifier columns for idempotent imports
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS api_driver_id TEXT;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS api_constructor_id TEXT;

ALTER TABLE public.circuits
  ADD COLUMN IF NOT EXISTS api_circuit_id TEXT;

ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS api_race_id TEXT;

-- Ensure race result upserts are safe
ALTER TABLE public.race_results
  DROP CONSTRAINT IF EXISTS race_results_race_id_driver_id_key;

ALTER TABLE public.race_results
  ADD CONSTRAINT race_results_race_id_driver_id_key UNIQUE (race_id, driver_id);

-- Unique indexes for API IDs
CREATE UNIQUE INDEX IF NOT EXISTS uq_drivers_api_driver_id
  ON public.drivers(api_driver_id)
  WHERE api_driver_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_api_constructor_id
  ON public.teams(api_constructor_id)
  WHERE api_constructor_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_circuits_api_circuit_id
  ON public.circuits(api_circuit_id)
  WHERE api_circuit_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_races_api_race_id
  ON public.races(api_race_id)
  WHERE api_race_id IS NOT NULL;
