import { supabaseClient } from '../supabaseClient'

export interface ImportJob {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'stopped'
  from_year: number
  to_year: number
  current_season: number | null
  progress_percent: number
  processed_seasons: number
  total_seasons: number
  seasons_imported: number
  races_imported: number
  drivers_imported: number
  teams_imported: number
  circuits_imported: number
  results_imported: number
  message: string | null
  error_message: string | null
  logs: string[]
  summary: Record<string, unknown>
  stop_requested: boolean
  created_at: string
  started_at: string | null
  finished_at: string | null
}

async function normalizeInvokeError(error: unknown) {
  const e = error as {
    message?: string
    context?: { status?: number; json?: () => Promise<{ error?: string; message?: string }> }
  }

  if (e?.context?.json) {
    try {
      const body = await e.context.json()
      const message = body?.error || body?.message
      if (message) {
        throw new Error(message)
      }
    } catch {
      // fall through to base message
    }
  }

  throw new Error(e?.message || 'Edge function failed')
}

export async function startBulkImport(fromYear = 1950, toYear = new Date().getFullYear()) {
  const { data, error } = await supabaseClient.functions.invoke('bulkImportF1History', {
    body: { action: 'start', fromYear, toYear },
  })
  if (error) await normalizeInvokeError(error)
  if (!data?.jobId) throw new Error('Failed to create import job')
  return data as { jobId: string; fromYear: number; toYear: number; message: string; resumeFromJobId?: string | null }
}

export async function resumeBulkImport(toYear = new Date().getFullYear()) {
  const { data, error } = await supabaseClient.functions.invoke('bulkImportF1History', {
    body: { action: 'resume', toYear },
  })
  if (error) await normalizeInvokeError(error)
  if (!data?.jobId) throw new Error('Failed to create resumed import job')
  return data as { jobId: string; fromYear: number; toYear: number; message: string; resumeFromJobId?: string | null }
}

export async function stopBulkImport(jobId: string) {
  const { data, error } = await supabaseClient.functions.invoke('bulkImportF1History', {
    body: { action: 'stop', jobId },
  })
  if (error) await normalizeInvokeError(error)
  return data as { ok: boolean; jobId: string; message: string }
}

export async function getImportJob(jobId: string) {
  const { data, error } = await supabaseClient.from('import_jobs').select('*').eq('id', jobId).single()
  if (error) throw error
  return data as ImportJob
}

export async function getLatestImportJob() {
  const { data, error } = await supabaseClient.from('import_jobs').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return (data as ImportJob | null) ?? null
}
