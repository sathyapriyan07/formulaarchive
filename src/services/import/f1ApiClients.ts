const JOLPICA_BASE_URL = 'https://api.jolpi.ca/ergast/f1'
const ERGAST_BASE_URL = 'https://ergast.com/api/f1'

interface ErgastResponse<T> {
  MRData: T
}

interface RaceTable {
  RaceTable: {
    season: string
    Races: ApiRace[]
  }
}

export interface ApiRace {
  season: string
  round: string
  raceName: string
  date: string
  time?: string
  Circuit: {
    circuitId: string
    circuitName: string
    Location: {
      locality: string
      country: string
      lat?: string
      long?: string
    }
  }
  Results?: ApiResult[]
}

export interface ApiResult {
  number?: string
  position: string
  positionText?: string
  points?: string
  laps: string
  status: string
  Driver: {
    driverId: string
    permanentNumber?: string
    givenName: string
    familyName: string
    dateOfBirth?: string
    nationality?: string
  }
  Constructor: {
    constructorId: string
    name: string
    nationality?: string
  }
  Time?: {
    time?: string
  }
}

export interface ImportProgress {
  totalRaces: number
  processedRaces: number
  currentRace?: string
  source: 'jolpica' | 'ergast'
}

async function fetchFromSource<T>(baseUrl: string, path: string): Promise<ErgastResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }
  return (await response.json()) as ErgastResponse<T>
}

export async function fetchWithFallback<T>(path: string): Promise<{ data: ErgastResponse<T>; source: 'jolpica' | 'ergast' }> {
  try {
    const data = await fetchFromSource<T>(JOLPICA_BASE_URL, path)
    return { data, source: 'jolpica' }
  } catch {
    const data = await fetchFromSource<T>(ERGAST_BASE_URL, path)
    return { data, source: 'ergast' }
  }
}

export async function fetchSeasonRaces(seasonYear: number) {
  const { data, source } = await fetchWithFallback<RaceTable>(`/${seasonYear}/races.json?limit=100`)
  return {
    races: data.MRData.RaceTable.Races ?? [],
    source,
  }
}

export async function fetchRaceResults(seasonYear: number, round: number) {
  const { data, source } = await fetchWithFallback<RaceTable>(`/${seasonYear}/${round}/results.json?limit=100`)
  return {
    race: data.MRData.RaceTable.Races?.[0] ?? null,
    source,
  }
}

export async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
