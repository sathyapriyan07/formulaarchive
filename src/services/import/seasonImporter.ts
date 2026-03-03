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
  season: number
  source: 'jolpica' | 'ergast'
  racesProcessed: number
  failedRaces: Array<{ race: string; round: number; reason: string }>
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
  let resultsUpserted = 0
  const failedRaces: Array<{ race: string; round: number; reason: string }> = []

  for (let index = 0; index < races.length; index += 1) {
    const race = races[index]
    const round = Number(race.round)
    onProgress?.({
      totalRaces: races.length,
      processedRaces: index + 1,
      currentRace: race.raceName,
      source,
    })

    try {
      const circuit = await upsertCircuit(race)
      circuitApiIds.add(race.Circuit.circuitId)

      const raceRow = await upsertRace(race, circuit.id)
      const { race: raceWithResults } = await fetchRaceResults(seasonYear, round)
      const results = raceWithResults?.Results ?? []

      if (results.length > 0) {
        const teamIdMap = await upsertTeams(results)
        const driverIdMap = await upsertDrivers(results)

        for (const result of results) {
          const summary = normalizeResultForSummary(result)
          teamApiIds.add(summary.constructorApiId)
          driverApiIds.add(summary.driverApiId)
        }

        resultsUpserted += await upsertRaceResults({
          raceId: raceRow.id,
          results,
          driverIdMap,
          teamIdMap,
        })

        await markRaceCompleted(raceRow.id)
      }
    } catch (error) {
      failedRaces.push({
        race: race.raceName,
        round,
        reason: error instanceof Error ? error.message : 'Unknown import error',
      })
    }

    await delay(180)
  }

  await recalculateSeasonStandings(seasonYear)

  return {
    season: seasonYear,
    source,
    racesProcessed: races.length,
    failedRaces,
    driversUpserted: driverApiIds.size,
    teamsUpserted: teamApiIds.size,
    circuitsUpserted: circuitApiIds.size,
    resultsUpserted,
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
