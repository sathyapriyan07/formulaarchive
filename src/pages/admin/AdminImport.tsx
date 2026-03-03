import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import {
  getImportJob,
  getLatestImportJob,
  processBulkImport,
  resumeBulkImport,
  startBulkImport,
  type ImportJob,
} from '../../services/import/bulkImportClient'

const STEP_DELAY_MS = 250

function toFriendlyError(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}

export default function AdminImport() {
  const { isAdmin, loading } = useAuth() as { isAdmin: boolean; loading: boolean }
  const navigate = useNavigate()

  const [fromYear, setFromYear] = useState(1950)
  const [toYear, setToYear] = useState(new Date().getFullYear())
  const [job, setJob] = useState<ImportJob | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const isProcessingRef = useRef(false)

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/')
  }, [loading, isAdmin, navigate])

  useEffect(() => {
    if (!isAdmin) return
    let ignore = false

    const hydrate = async () => {
      try {
        const latest = await getLatestImportJob()
        if (!ignore && latest) setJob(latest)
      } catch {
        // ignore initial fetch failure
      }
    }

    hydrate()
    return () => {
      ignore = true
      isProcessingRef.current = false
    }
  }, [isAdmin])

  if (loading) return <div>Loading...</div>
  if (!isAdmin) return null

  const runProcessingLoop = async (jobId: string, mode: 'process' | 'resume' = 'process') => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setIsProcessing(true)

    try {
      let action: 'process' | 'resume' = mode

      while (isProcessingRef.current) {
        const step = action === 'resume' ? await resumeBulkImport(jobId) : await processBulkImport(jobId)
        action = 'process'

        const fresh = await getImportJob(jobId)
        setJob(fresh)

        if (!step.ok || step.status === 'failed') {
          throw new Error(step.error || fresh.last_error || 'Import failed')
        }

        if (step.status === 'completed' || fresh.status === 'completed') {
          toast.success('Historical import completed')
          break
        }

        await new Promise((resolve) => setTimeout(resolve, STEP_DELAY_MS))
      }
    } catch (error) {
      toast.error(toFriendlyError(error))
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
    }
  }

  const handleStart = async () => {
    if (fromYear < 1950 || fromYear > toYear) {
      toast.error('Invalid year range. Start year must be >= 1950 and <= end year.')
      return
    }

    setIsStarting(true)
    try {
      const response = await startBulkImport(fromYear, toYear)
      setJob(response.job)
      toast.success(`Import job created (${fromYear} -> ${toYear})`)
      await runProcessingLoop(response.job.id, 'process')
    } catch (error) {
      toast.error(toFriendlyError(error))
    } finally {
      setIsStarting(false)
    }
  }

  const handleResume = async () => {
    if (!job?.id) {
      toast.error('No import job found to resume')
      return
    }

    setIsResuming(true)
    try {
      await runProcessingLoop(job.id, 'resume')
    } finally {
      setIsResuming(false)
    }
  }

  const progress = useMemo(() => {
    if (!job) return 0
    const total = Math.max(1, job.to_year - job.from_year + 1)
    const done = Math.max(0, Math.min(total, job.current_year - job.from_year))
    return Number(((done / total) * 100).toFixed(2))
  }, [job])

  const statusTone = useMemo(() => {
    if (!job) return 'neutral'
    if (job.status === 'completed') return 'success'
    if (job.status === 'failed') return 'danger'
    return 'warning'
  }, [job])

  const logs = (job?.logs ?? []).slice(-40)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-f1-red">F1 Historical Data Import</h1>

      <Card className="space-y-4">
        <p className="text-sm text-gray-300">Production-safe importer: one season per request, resumable, and progress tracked via import_jobs.</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="fromYear" className="mb-1 block text-sm text-gray-300">From Year</label>
            <input
              id="fromYear"
              type="number"
              min={1950}
              max={toYear}
              value={fromYear}
              onChange={(event) => setFromYear(Number(event.target.value))}
              className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="toYear" className="mb-1 block text-sm text-gray-300">To Year</label>
            <input
              id="toYear"
              type="number"
              min={fromYear}
              max={new Date().getFullYear()}
              value={toYear}
              onChange={(event) => setToYear(Number(event.target.value))}
              className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" disabled={isStarting || isProcessing} onClick={handleStart}>
            {isStarting || isProcessing ? 'Processing...' : 'Import 1950 -> Current'}
          </button>
          <button type="button" className="btn-secondary" disabled={!job || isResuming || isProcessing} onClick={handleResume}>
            {isResuming ? 'Resuming...' : 'Resume Import'}
          </button>
        </div>
      </Card>

      {job ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">Import Progress</h2>
            <Badge label={job.status.toUpperCase()} tone={statusTone as 'neutral' | 'danger' | 'success' | 'warning'} />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-300">{job.message ?? 'Running...'}</p>
            <div className="h-2 overflow-hidden rounded bg-f1-gray">
              <div className="h-full bg-f1-red transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400">
              Year {job.current_year} in range {job.from_year} {'->'} {job.to_year} ({progress.toFixed(2)}%)
            </p>
          </div>

          <div className="grid gap-2 text-sm md:grid-cols-3">
            <p>Seasons: {job.seasons_imported}</p>
            <p>Races: {job.races_imported}</p>
            <p>Drivers: {job.drivers_imported}</p>
            <p>Teams: {job.teams_imported}</p>
            <p>Circuits: {job.circuits_imported}</p>
            <p>Results: {job.results_imported}</p>
          </div>

          {job.last_error || job.error_message ? <p className="text-sm text-red-300">{job.last_error || job.error_message}</p> : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-200">Live Log</h3>
            <div className="max-h-80 overflow-auto rounded border border-f1-gray bg-f1-darker p-3 font-mono text-xs text-gray-200">
              {logs.length ? logs.map((line, idx) => <p key={`${idx}-${line}`}>{line}</p>) : <p>No logs yet</p>}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
