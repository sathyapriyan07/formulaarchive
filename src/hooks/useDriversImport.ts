import { useRef, useState } from 'react'
import {
  importDriversByYear,
  type DriversImportSummary,
  type ImportProgress,
} from '../services/modularImportService'

export function useDriversImport() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [summary, setSummary] = useState<DriversImportSummary | null>(null)
  const lastRunRef = useRef(0)

  const runImport = async (year?: number) => {
    const now = Date.now()
    if (loading) return null
    if (now - lastRunRef.current < 700) return null
    lastRunRef.current = now

    setLoading(true)
    setProgress(null)
    setSummary(null)
    try {
      const result = await importDriversByYear(year, (next) => setProgress(next))
      setSummary(result)
      return result
    } finally {
      setLoading(false)
    }
  }

  return { loading, progress, summary, runImport }
}
