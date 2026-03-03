import { useRef, useState } from 'react'
import {
  importSeasonFromJolpica,
  type SeasonImportProgress,
  type SeasonImportSummary,
} from '../services/seasonImportService'

export function useSeasonImport() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<SeasonImportProgress | null>(null)
  const [summary, setSummary] = useState<SeasonImportSummary | null>(null)
  const lastRunRef = useRef(0)

  const runImport = async (seasonYear: number) => {
    const now = Date.now()
    if (loading) return null
    if (now - lastRunRef.current < 800) return null

    lastRunRef.current = now
    setLoading(true)
    setProgress(null)
    setSummary(null)

    try {
      const result = await importSeasonFromJolpica(seasonYear, (next) => setProgress(next))
      setSummary(result)
      return result
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    progress,
    summary,
    runImport,
  }
}
