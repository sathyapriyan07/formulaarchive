export type ApiSource = 'jolpica' | 'ergast'

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'
const ERGAST_BASE = 'https://ergast.com/api/f1'

export type ErgastDriver = {
  driverId: string
  permanentNumber?: string
  givenName: string
  familyName: string
  dateOfBirth?: string
  nationality?: string
}

export type ErgastCircuit = {
  circuitId: string
  circuitName: string
  Location: {
    locality?: string
    country: string
  }
}

export type ErgastRace = {
  season: string
  round: string
  raceName: string
  date: string
  Circuit: ErgastCircuit
}

async function fetchJson(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl}${path}`)
  if (!response.ok) throw new Error(`API ${response.status} for ${path}`)
  return response.json()
}

export async function fetchWithFallback(path: string): Promise<{ data: any; source: ApiSource }> {
  try {
    const data = await fetchJson(JOLPICA_BASE, path)
    return { data, source: 'jolpica' }
  } catch {
    const data = await fetchJson(ERGAST_BASE, path)
    return { data, source: 'ergast' }
  }
}

export async function fetchSeasonDrivers(year: number) {
  const { data, source } = await fetchWithFallback(`/${year}/drivers.json?limit=300`)
  const drivers: ErgastDriver[] = data?.MRData?.DriverTable?.Drivers ?? []
  return { drivers, source }
}

export async function fetchSeasonCircuits(year: number) {
  const { data, source } = await fetchWithFallback(`/${year}/circuits.json?limit=200`)
  const circuits: ErgastCircuit[] = data?.MRData?.CircuitTable?.Circuits ?? []
  return { circuits, source }
}

export async function fetchSeasonRaces(year: number) {
  const { data, source } = await fetchWithFallback(`/${year}.json?limit=200`)
  const races: ErgastRace[] = data?.MRData?.RaceTable?.Races ?? []
  return { races, source }
}
