import { useRef, useState } from 'react'
import {
  importCircuitsByYear,
  type CircuitsImportSummary,
  type ImportProgress,
} from '../services/modularImportService'

export function useCircuitsImport() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [summary, setSummary] = useState<CircuitsImportSummary | null>(null)
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
      const result = await importCircuitsByYear(year, (next) => setProgress(next))
      setSummary(result)
      return result
    } finally {
      setLoading(false)
    }
  }

  return { loading, progress, summary, runImport }
}
