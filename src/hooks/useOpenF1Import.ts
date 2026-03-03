import { useState } from 'react'
import {
  importSeasonFromOpenF1,
  type OpenF1ImportProgress,
  type OpenF1ImportSummary,
} from '../services/openF1ImportService'

export function useOpenF1Import() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<OpenF1ImportProgress | null>(null)
  const [summary, setSummary] = useState<OpenF1ImportSummary | null>(null)

  const runImport = async (seasonYear: number) => {
    if (loading) return null
    setLoading(true)
    setSummary(null)
    setProgress(null)
    try {
      const result = await importSeasonFromOpenF1(seasonYear, (next) => setProgress(next))
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
