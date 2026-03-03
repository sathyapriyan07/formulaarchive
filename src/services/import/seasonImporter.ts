import { fetchRaceResults, type ImportProgress } from './f1ApiClients'
import {
  clearSeasonResultsAndStats,
  markRaceCompleted,
  upsertCircuit,
  upsertDrivers,
  upsertRace,
  upsertRaceResults,
  upsertSeason,
  upsertTeams,
} from './supabaseUpsert'
import { recalculateSeasonStandings } from './standingsCalculator'
import { supabaseClient } from '../supabaseClient'

export interface ImportSummary {
  success: boolean
  season: number
  source: 'jolpica' | 'ergast'
  racesImported: number
  racesProcessed: number
  racesWithoutResults: number
  failedRaces: Array<{ race: string; round: number; reason: string }>
  driversImported: number
  teamsImported: number
  circuitsImported: number
  resultsInserted: number
  driversUpserted: number
  teamsUpserted: number
  circuitsUpserted: number
  resultsUpserted: number
}

export async function importSeasonFromApi(
  seasonYear: number,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportSummary> {
  onProgress?.({
    totalRaces: 1,
    processedRaces: 0,
    currentRace: `Starting import for ${seasonYear}`,
    source: 'jolpica',
  })

  const { data, error } = await supabaseClient.functions.invoke('bulkImportF1History', {
    body: { action: 'single-season', seasonYear },
  })

  if (error) {
    throw new Error(error.message || 'Single season import failed')
  }

  if (!data) {
    throw new Error('No response from edge function')
  }

  onProgress?.({
    totalRaces: 1,
    processedRaces: 1,
    currentRace: `Season ${seasonYear} import completed`,
    source: (data.source ?? 'jolpica') as 'jolpica' | 'ergast',
  })

  return {
    success: Boolean(data.success),
    season: Number(data.season ?? seasonYear),
    source: (data.source ?? 'jolpica') as 'jolpica' | 'ergast',
    racesImported: Number(data.racesImported ?? 0),
    racesProcessed: Number(data.racesImported ?? 0),
    racesWithoutResults: 0,
    failedRaces: Array.isArray(data.failedRaceRounds)
      ? data.failedRaceRounds.map((row: { round: number; race: string; reason: string }) => ({
          round: row.round,
          race: row.race,
          reason: row.reason,
        }))
      : [],
    driversImported: Number(data.driversImported ?? 0),
    teamsImported: Number(data.teamsImported ?? 0),
    circuitsImported: Number(data.circuitsImported ?? 0),
    resultsInserted: Number(data.resultsInserted ?? 0),
    driversUpserted: Number(data.driversImported ?? 0),
    teamsUpserted: Number(data.teamsImported ?? 0),
    circuitsUpserted: Number(data.circuitsImported ?? 0),
    resultsUpserted: Number(data.resultsInserted ?? 0),
  }
}

export async function importSingleRaceFromApi(seasonYear: number, round: number) {
  await upsertSeason(seasonYear)
  const { race } = await fetchRaceResults(seasonYear, round)
  if (!race) {
    throw new Error(`No race found for season ${seasonYear}, round ${round}`)
  }

  const circuit = await upsertCircuit(race)
  const raceRow = await upsertRace(race, circuit.id)
  const results = race.Results ?? []

  if (results.length > 0) {
    const teamIdMap = await upsertTeams(results)
    const driverIdMap = await upsertDrivers(results)
    await upsertRaceResults({
      raceId: raceRow.id,
      results,
      driverIdMap,
      teamIdMap,
    })
    await markRaceCompleted(raceRow.id)
  }

  await recalculateSeasonStandings(seasonYear)
  return { raceName: race.raceName, round, resultCount: results.length }
}

export async function recalculateSeason(year: number) {
  return recalculateSeasonStandings(year)
}

export async function clearSeason(year: number) {
  return clearSeasonResultsAndStats(year)
}
