CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Safe admin helper to avoid recursive RLS checks
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

-- Season champion fields for historical import metadata
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

-- Driver championships cache (extra feature)
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS championships INTEGER NOT NULL DEFAULT 0;

-- Bulk import job tracking table
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'stopped')),
  from_year INTEGER NOT NULL,
  to_year INTEGER NOT NULL,
  current_season INTEGER,
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  processed_seasons INTEGER NOT NULL DEFAULT 0,
  total_seasons INTEGER NOT NULL DEFAULT 0,
  seasons_imported INTEGER NOT NULL DEFAULT 0,
  races_imported INTEGER NOT NULL DEFAULT 0,
  drivers_imported INTEGER NOT NULL DEFAULT 0,
  teams_imported INTEGER NOT NULL DEFAULT 0,
  circuits_imported INTEGER NOT NULL DEFAULT 0,
  results_imported INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  error_message TEXT,
  logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  stop_requested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON public.import_jobs(created_by);

CREATE OR REPLACE FUNCTION public.touch_import_job_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_import_jobs_updated_at ON public.import_jobs;
CREATE TRIGGER trg_import_jobs_updated_at
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.touch_import_job_updated_at();

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS import_jobs_admin_read ON public.import_jobs;
CREATE POLICY import_jobs_admin_read
ON public.import_jobs
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS import_jobs_admin_insert ON public.import_jobs;
CREATE POLICY import_jobs_admin_insert
ON public.import_jobs
FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS import_jobs_admin_update ON public.import_jobs;
CREATE POLICY import_jobs_admin_update
ON public.import_jobs
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS import_jobs_admin_delete ON public.import_jobs;
CREATE POLICY import_jobs_admin_delete
ON public.import_jobs
FOR DELETE
USING (public.is_admin());
