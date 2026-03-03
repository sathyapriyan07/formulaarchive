-- Remove API import persistence artifacts
DROP TRIGGER IF EXISTS trg_import_jobs_updated_at ON public.import_jobs;
DROP FUNCTION IF EXISTS public.touch_import_job_updated_at();

DROP POLICY IF EXISTS import_jobs_admin_read ON public.import_jobs;
DROP POLICY IF EXISTS import_jobs_admin_insert ON public.import_jobs;
DROP POLICY IF EXISTS import_jobs_admin_update ON public.import_jobs;
DROP POLICY IF EXISTS import_jobs_admin_delete ON public.import_jobs;

DROP TABLE IF EXISTS public.import_jobs;
