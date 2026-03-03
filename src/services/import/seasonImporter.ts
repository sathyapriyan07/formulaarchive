import { delay, fetchRaceResults, fetchSeasonRaces, type ImportProgress } from './f1ApiClients'
import {
  clearSeasonResultsAndStats,
  markRaceCompleted,
  normalizeResultForSummary,
  upsertCircuit,
  upsertDrivers,
  upsertRace,
  upsertRaceResults,
  upsertSeason,
  upsertTeams,
} from './supabaseUpsert'
import { recalculateSeasonStandings } from './standingsCalculator'

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
  await upsertSeason(seasonYear)
  const { races, source } = await fetchSeasonRaces(seasonYear)

  const driverApiIds = new Set<string>()
  const teamApiIds = new Set<string>()
  const circuitApiIds = new Set<string>()
  let racesImported = 0
  let racesWithoutResults = 0
  let resultsInserted = 0
  const failedRaces: Array<{ race: string; round: number; reason: string }> = []

  for (let index = 0; index < races.length; index += 1) {
    const race = races[index]
    const round = Number(race.round)
    console.log('Processing race:', race.raceName)
    onProgress?.({
      totalRaces: races.length,
      processedRaces: index + 1,
      currentRace: race.raceName,
      source,
    })

    try {
      const circuit = await upsertCircuit(race)
      circuitApiIds.add(race.Circuit.circuitId)

      const { race: raceWithResults } = await fetchRaceResults(seasonYear, round)
      const results = raceWithResults?.Results ?? []
      console.log('Results count:', results.length)

      // No results is a valid state for future/unavailable races.
      if (!raceWithResults || results.length === 0) {
        await upsertRace(race, circuit.id)
        racesWithoutResults += 1
        racesImported += 1
        await delay(180)
        continue
      }

      // Required order: Circuit -> Teams -> Drivers -> Race -> RaceResults
      const teamIdMap = await upsertTeams(results)
      const driverIdMap = await upsertDrivers(results)
      const raceRow = await upsertRace(race, circuit.id)

      for (const result of results) {
        const summary = normalizeResultForSummary(result)
        teamApiIds.add(summary.constructorApiId)
        driverApiIds.add(summary.driverApiId)
      }

      resultsInserted += await upsertRaceResults({
        raceId: raceRow.id,
        results,
        driverIdMap,
        teamIdMap,
      })

      await markRaceCompleted(raceRow.id)
      racesImported += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown import error'
      console.error('Race failed:', round, message)
      failedRaces.push({
        race: race.raceName,
        round,
        reason: message,
      })
    }

    await delay(180)
  }

  await recalculateSeasonStandings(seasonYear)

  return {
    success: true,
    season: seasonYear,
    source,
    racesImported,
    racesProcessed: races.length,
    racesWithoutResults,
    failedRaces,
    driversImported: driverApiIds.size,
    teamsImported: teamApiIds.size,
    circuitsImported: circuitApiIds.size,
    resultsInserted,
    driversUpserted: driverApiIds.size,
    teamsUpserted: teamApiIds.size,
    circuitsUpserted: circuitApiIds.size,
    resultsUpserted: resultsInserted,
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
