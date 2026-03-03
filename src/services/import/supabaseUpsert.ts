import { supabaseClient } from '../supabaseClient'
import type { ApiRace, ApiResult } from './f1ApiClients'
import { getCircuitImageUrl, getDriverImageUrl, getTeamCarImageUrl, getTeamLogoUrl } from './imageMappings'

function fullName(result: ApiResult) {
  return `${result.Driver.givenName} ${result.Driver.familyName}`.trim()
}

function toResultStatus(rawStatus: string) {
  const value = rawStatus.toLowerCase()
  if (value.includes('disqual')) return 'DSQ'
  if (value.includes('did not start')) return 'DNF'
  if (value.includes('finish') || value.includes('lap') || value.startsWith('+')) return 'Finished'
  return 'DNF'
}

export async function upsertSeason(seasonYear: number) {
  const { data, error } = await supabaseClient.from('seasons').upsert({ year: seasonYear }, { onConflict: 'year' }).select('*').single()
  if (error) throw error
  return data
}

export async function upsertCircuit(race: ApiRace) {
  const payload = {
    api_circuit_id: race.Circuit.circuitId,
    name: race.Circuit.circuitName,
    country: race.Circuit.Location.country,
    image_url: getCircuitImageUrl(race.Circuit.circuitId, race.Circuit.circuitName),
  }

  const { data, error } = await supabaseClient.from('circuits').upsert(payload, { onConflict: 'api_circuit_id' }).select('*').single()
  if (error) throw error
  return data
}

export async function upsertTeams(results: ApiResult[]) {
  const unique = new Map<string, ApiResult['Constructor']>()
  for (const result of results) unique.set(result.Constructor.constructorId, result.Constructor)

  if (!unique.size) return new Map<string, string>()

  const payload = [...unique.values()].map((constructor) => ({
    api_constructor_id: constructor.constructorId,
    name: constructor.name,
    logo_url: getTeamLogoUrl(constructor.constructorId, constructor.name),
    car_image_url: getTeamCarImageUrl(constructor.constructorId, constructor.name),
  }))

  const { data, error } = await supabaseClient.from('teams').upsert(payload, { onConflict: 'api_constructor_id' }).select('id, api_constructor_id')
  if (error) throw error

  const map = new Map<string, string>()
  for (const team of data ?? []) {
    map.set(team.api_constructor_id, team.id)
  }
  return map
}

export async function upsertDrivers(results: ApiResult[]) {
  const unique = new Map<string, ApiResult['Driver']>()
  for (const result of results) unique.set(result.Driver.driverId, result.Driver)

  if (!unique.size) return new Map<string, string>()

  const payload = [...unique.values()].map((driver) => ({
    api_driver_id: driver.driverId,
    name: `${driver.givenName} ${driver.familyName}`.trim(),
    number: driver.permanentNumber || '0',
    dob: driver.dateOfBirth || null,
    nationality: driver.nationality || null,
    image_url: getDriverImageUrl(driver.driverId, `${driver.givenName} ${driver.familyName}`),
  }))

  const { data, error } = await supabaseClient.from('drivers').upsert(payload, { onConflict: 'api_driver_id' }).select('id, api_driver_id')
  if (error) throw error

  const map = new Map<string, string>()
  for (const driver of data ?? []) {
    map.set(driver.api_driver_id, driver.id)
  }
  return map
}

export async function upsertRace(race: ApiRace, circuitId: string) {
  const seasonYear = Number(race.season)
  const round = Number(race.round)
  const apiRaceId = `${race.season}-${race.round}`

  const payload = {
    api_race_id: apiRaceId,
    season_id: seasonYear,
    circuit_id: circuitId,
    name: race.raceName,
    date: race.date,
    round,
    status: 'upcoming',
  }

  const { data, error } = await supabaseClient.from('races').upsert(payload, { onConflict: 'api_race_id' }).select('*').single()
  if (error) throw error
  return data
}

export async function upsertRaceResults(params: {
  raceId: string
  results: ApiResult[]
  driverIdMap: Map<string, string>
  teamIdMap: Map<string, string>
}) {
  const payload = params.results
    .map((result) => {
      const driverId = params.driverIdMap.get(result.Driver.driverId)
      const teamId = params.teamIdMap.get(result.Constructor.constructorId)
      if (!driverId || !teamId) return null
      return {
        race_id: params.raceId,
        driver_id: driverId,
        team_id: teamId,
        position: Number(result.position),
        laps: Number(result.laps || 0),
        time: result.Time?.time || null,
        status: toResultStatus(result.status),
      }
    })
    .filter(Boolean)

  if (!payload.length) return 0

  const { error } = await supabaseClient.from('race_results').upsert(payload, { onConflict: 'race_id,driver_id' })
  if (error) throw error
  return payload.length
}

export async function markRaceCompleted(raceId: string) {
  const { error } = await supabaseClient.from('races').update({ status: 'completed' }).eq('id', raceId)
  if (error) throw error
}

export async function clearSeasonResultsAndStats(seasonYear: number) {
  const { data: races, error: raceError } = await supabaseClient.from('races').select('id').eq('season_id', seasonYear)
  if (raceError) throw raceError

  const raceIds = (races ?? []).map((race) => race.id)
  if (raceIds.length) {
    const { error: resultsError } = await supabaseClient.from('race_results').delete().in('race_id', raceIds)
    if (resultsError) throw resultsError
  }

  const { error: driverStatsError } = await supabaseClient.from('driver_season_stats').delete().eq('season_id', seasonYear)
  if (driverStatsError) throw driverStatsError
  const { error: teamStatsError } = await supabaseClient.from('team_season_stats').delete().eq('season_id', seasonYear)
  if (teamStatsError) throw teamStatsError
}

export function normalizeResultForSummary(result: ApiResult) {
  return {
    driverApiId: result.Driver.driverId,
    constructorApiId: result.Constructor.constructorId,
    driverName: fullName(result),
    constructorName: result.Constructor.name,
  }
}
