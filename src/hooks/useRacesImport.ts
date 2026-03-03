import { useRef, useState } from 'react'
import {
  importRacesByYear,
  type ImportProgress,
  type RacesImportSummary,
} from '../services/modularImportService'

export function useRacesImport() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [summary, setSummary] = useState<RacesImportSummary | null>(null)
  const lastRunRef = useRef(0)

  const runImport = async (year: number) => {
    const now = Date.now()
    if (loading) return null
    if (now - lastRunRef.current < 700) return null
    lastRunRef.current = now

    setLoading(true)
    setProgress(null)
    setSummary(null)
    try {
      const result = await importRacesByYear(year, (next) => setProgress(next))
      setSummary(result)
      return result
    } finally {
      setLoading(false)
    }
  }

  return { loading, progress, summary, runImport }
}
