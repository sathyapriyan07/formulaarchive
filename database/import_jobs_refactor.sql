CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_year INTEGER NOT NULL,
  to_year INTEGER NOT NULL,
  current_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  last_error TEXT,
  message TEXT,
  logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  processed_seasons INTEGER NOT NULL DEFAULT 0,
  total_seasons INTEGER NOT NULL DEFAULT 0,
  seasons_imported INTEGER NOT NULL DEFAULT 0,
  races_imported INTEGER NOT NULL DEFAULT 0,
  drivers_imported INTEGER NOT NULL DEFAULT 0,
  teams_imported INTEGER NOT NULL DEFAULT 0,
  circuits_imported INTEGER NOT NULL DEFAULT 0,
  results_imported INTEGER NOT NULL DEFAULT 0,
  current_season INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.import_jobs
  ADD COLUMN IF NOT EXISTS current_year INTEGER,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_seasons INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_seasons INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seasons_imported INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS races_imported INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS drivers_imported INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS teams_imported INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS circuits_imported INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS results_imported INTEGER NOT NULL DEFAULT 0;

UPDATE public.import_jobs
SET current_year = COALESCE(current_year, current_season, from_year)
WHERE current_year IS NULL;

ALTER TABLE public.import_jobs
  ALTER COLUMN current_year SET NOT NULL;

ALTER TABLE public.import_jobs
  DROP CONSTRAINT IF EXISTS import_jobs_status_check;

ALTER TABLE public.import_jobs
  ADD CONSTRAINT import_jobs_status_check
  CHECK (status IN ('pending', 'running', 'completed', 'failed'));

UPDATE public.import_jobs
SET status = CASE
  WHEN status = 'queued' THEN 'pending'
  WHEN status = 'stopped' THEN 'failed'
  ELSE status
END;

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
CREATE POLICY import_jobs_admin_read ON public.import_jobs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS import_jobs_admin_insert ON public.import_jobs;
CREATE POLICY import_jobs_admin_insert ON public.import_jobs FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS import_jobs_admin_update ON public.import_jobs;
CREATE POLICY import_jobs_admin_update ON public.import_jobs FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS import_jobs_admin_delete ON public.import_jobs;
CREATE POLICY import_jobs_admin_delete ON public.import_jobs FOR DELETE USING (public.is_admin());
