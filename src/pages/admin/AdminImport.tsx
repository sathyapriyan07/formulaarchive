import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import {
  getImportJob,
  getLatestImportJob,
  resumeBulkImport,
  startBulkImport,
  stopBulkImport,
  type ImportJob,
} from '../../services/import/bulkImportClient'

const POLL_INTERVAL = 2500

function toFriendlyError(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: string
      context?: { status?: number; json?: () => Promise<{ message?: string }> }
    }

    if (maybeError.context?.status === 404) {
      return 'Edge Function not deployed (404). Deploy bulkImportF1History in Supabase.'
    }

    if (maybeError.message?.includes('Failed to send a request to the Edge Function')) {
      return 'Could not reach Edge Function. Check deploy status, secrets, and project link.'
    }

    if (maybeError.message) return maybeError.message
  }

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
  const [isStopping, setIsStopping] = useState(false)
  const pollTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/')
  }, [loading, isAdmin, navigate])

  useEffect(() => {
    if (!isAdmin) return

    let ignore = false
    const hydrateLatest = async () => {
      try {
        const latest = await getLatestImportJob()
        if (!ignore && latest) {
          setJob(latest)
        }
      } catch (error) {
        console.error(error)
      }
    }

    hydrateLatest()
    return () => {
      ignore = true
    }
  }, [isAdmin])

  useEffect(() => {
    if (!job?.id) return
    if (!['queued', 'running'].includes(job.status)) return

    const tick = async () => {
      try {
        const fresh = await getImportJob(job.id)
        setJob(fresh)
      } catch (error) {
        console.error(error)
      }
    }

    tick()
    pollTimerRef.current = window.setInterval(tick, POLL_INTERVAL)

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current)
      }
    }
  }, [job?.id, job?.status])

  if (loading) return <div>Loading...</div>
  if (!isAdmin) return null

  const progress = job?.progress_percent ?? 0
  const isRunning = job?.status === 'running' || job?.status === 'queued'

  const handleStart = async () => {
    if (fromYear < 1950 || fromYear > toYear) {
      toast.error('Invalid year range. Start year must be >= 1950 and <= end year.')
      return
    }

    setIsStarting(true)
    try {
      const response = await startBulkImport(fromYear, toYear)
      const fresh = await getImportJob(response.jobId)
      setJob(fresh)
      toast.success(`Bulk import started (${fromYear} -> ${toYear})`)
    } catch (error) {
      toast.error(toFriendlyError(error))
    } finally {
      setIsStarting(false)
    }
  }

  const handleStop = async () => {
    if (!job?.id) return

    setIsStopping(true)
    try {
      await stopBulkImport(job.id)
      toast.success('Stop request sent')
    } catch (error) {
      toast.error(toFriendlyError(error))
    } finally {
      setIsStopping(false)
    }
  }

  const handleResume = async () => {
    setIsResuming(true)
    try {
      const response = await resumeBulkImport(toYear)
      const fresh = await getImportJob(response.jobId)
      setJob(fresh)
      toast.success(
        response.resumeFromJobId
          ? `Resumed import from ${response.fromYear} (source job: ${response.resumeFromJobId})`
          : `Resumed import from ${response.fromYear}`,
      )
    } catch (error) {
      toast.error(toFriendlyError(error))
    } finally {
      setIsResuming(false)
    }
  }

  const statusTone = useMemo(() => {
    if (!job) return 'neutral'
    if (job.status === 'completed') return 'success'
    if (job.status === 'failed') return 'danger'
    if (job.status === 'stopped') return 'warning'
    return 'neutral'
  }, [job])

  const logs = (job?.logs ?? []).slice(-40)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-f1-red">F1 Historical Data Import</h1>

      <Card className="space-y-4">
        <p className="text-sm text-gray-300">Import all Formula 1 data from 1950 to current season using Jolpica (primary) and Ergast (fallback).</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="fromYear" className="mb-1 block text-sm text-gray-300">
              From Year
            </label>
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
            <label htmlFor="toYear" className="mb-1 block text-sm text-gray-300">
              To Year
            </label>
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
          <button type="button" className="btn-primary" disabled={isStarting || isRunning} onClick={handleStart}>
            {isStarting ? 'Starting...' : 'Import 1950 -> Current'}
          </button>
          <button type="button" className="btn-secondary" disabled={isRunning || isResuming} onClick={handleResume}>
            {isResuming ? 'Resuming...' : 'Resume Last Failed/Stopped'}
          </button>
          <button type="button" className="btn-secondary" disabled={!isRunning || isStopping} onClick={handleStop}>
            {isStopping ? 'Stopping...' : 'Stop Import'}
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
              {job.processed_seasons}/{job.total_seasons} seasons processed ({progress.toFixed(2)}%)
              {job.current_season ? ` | Current season: ${job.current_season}` : ''}
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

          {job.error_message ? <p className="text-sm text-red-300">{job.error_message}</p> : null}

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
