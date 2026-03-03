import { supabaseClient } from './supabaseClient'

type Source = 'jolpica' | 'ergast'

type ApiRace = {
  season: string
  round: string
  raceName: string
  date: string
  Circuit: {
    circuitId: string
    circuitName: string
    Location: {
      locality?: string
      country: string
    }
  }
}

type ApiResult = {
  position?: string
  laps?: string
  status?: string
  points?: string
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

export type SeasonImportProgress = {
  totalRounds: number
  processedRounds: number
  currentRound?: number
  message: string
}

export type SeasonImportSummary = {
  success: boolean
  seasonYear: number
  racesImported: number
  driversImported: number
  teamsImported: number
  circuitsImported: number
  resultsInserted: number
  failedRounds: Array<{ round: number; reason: string }>
}

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'
const ERGAST_BASE = 'https://ergast.com/api/f1'

function fallbackTeamLogo(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E10600&color=ffffff&size=512&bold=true`
}

function fallbackDriverImage(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D0D11&color=ffffff&size=512&bold=true`
}

function fallbackCircuitImage(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=38383F&color=ffffff&size=1024&bold=true`
}

function normalizeResultStatus(status?: string) {
  const s = (status ?? '').toLowerCase().trim()
  if (s.includes('disqual')) return 'DSQ'
  if (s.includes('finished') || s.startsWith('+')) return 'Finished'
  return 'DNF'
}

function isMissingOnConflictConstraint(error: unknown) {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : ''
  return message.toLowerCase().includes('no unique or exclusion constraint matching the on conflict specification')
}

function extractMissingColumn(error: unknown) {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : ''
  const fromSchemaCache = message.match(/Could not find the '([^']+)' column/i)
  if (fromSchemaCache?.[1]) return fromSchemaCache[1]
  const fromRelation = message.match(/column "([^"]+)" of relation/i)
  if (fromRelation?.[1]) return fromRelation[1]
  return null
}

async function fetchJson(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl}${path}`)
  if (!response.ok) throw new Error(`API ${response.status} for ${path}`)
  return response.json()
}

async function fetchWithFallback(path: string): Promise<{ data: any; source: Source }> {
  try {
    const data = await fetchJson(JOLPICA_BASE, path)
    return { data, source: 'jolpica' }
  } catch {
    const data = await fetchJson(ERGAST_BASE, path)
    return { data, source: 'ergast' }
  }
}

async function ensureAdminSession() {
  const { data: sessionData } = await supabaseClient.auth.getSession()
  const user = sessionData.session?.user
  if (!user) throw new Error('User not logged in')

  const { data: roleData, error: roleErr } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleErr) throw new Error(roleErr.message)
  if (roleData?.role !== 'admin') throw new Error('Admin access required')
}

async function upsertByLookup(
  table: 'circuits' | 'teams' | 'drivers' | 'races',
  lookups: Array<{ column: string; value: string | number }>,
  payload: Record<string, unknown>,
) {
  let existingId: string | null = null
  for (const lookup of lookups) {
    const { data, error } = await supabaseClient.from(table).select('id').eq(lookup.column, lookup.value).maybeSingle()
    if (!error && data?.id) {
      existingId = data.id as string
      break
    }
  }

  if (existingId) {
    const { data, error } = await supabaseClient.from(table).update(payload).eq('id', existingId).select('id').maybeSingle()
    if (error || !data?.id) throw new Error(error?.message ?? `Failed to update ${table}`)
    return data.id as string
  }

  const { data, error } = await supabaseClient.from(table).insert(payload).select('id').maybeSingle()
  if (error || !data?.id) throw new Error(error?.message ?? `Failed to insert ${table}`)
  return data.id as string
}

async function safeUpsertId(
  table: 'circuits' | 'teams' | 'drivers' | 'races',
  payload: Record<string, unknown>,
  onConflict: string,
  lookups: Array<{ column: string; value: string | number }>,
) {
  const candidate: Record<string, unknown> = { ...payload }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabaseClient.from(table).upsert(candidate, { onConflict }).select('id').maybeSingle()
    if (!error && data?.id) return data.id as string

    if (error && isMissingOnConflictConstraint(error)) {
      return upsertByLookup(table, lookups, candidate)
    }

    const missingColumn = extractMissingColumn(error)
    if (missingColumn && missingColumn in candidate) {
      delete candidate[missingColumn]
      continue
    }

    throw new Error(error?.message ?? `Failed to upsert ${table}`)
  }

  return upsertByLookup(table, lookups, candidate)
}

async function upsertCircuit(race: ApiRace) {
  const id = race.Circuit.circuitId
  const name = race.Circuit.circuitName
  const country = race.Circuit.Location.country
  const locality = race.Circuit.Location.locality ?? null

  return safeUpsertId(
    'circuits',
    {
      api_circuit_id: id,
      name,
      country,
      locality,
      image_url: fallbackCircuitImage(name),
      layout_image_url: fallbackCircuitImage(name),
    },
    'api_circuit_id',
    [
      { column: 'api_circuit_id', value: id },
      { column: 'name', value: name },
    ],
  )
}

async function upsertTeam(result: ApiResult) {
  const constructorId = result.Constructor.constructorId
  const teamName = result.Constructor.name
  return safeUpsertId(
    'teams',
    {
      api_constructor_id: constructorId,
      name: teamName,
      nationality: result.Constructor.nationality ?? null,
      logo_url: fallbackTeamLogo(teamName),
      car_image_url: fallbackTeamLogo(`${teamName} Car`),
    },
    'api_constructor_id',
    [
      { column: 'api_constructor_id', value: constructorId },
      { column: 'name', value: teamName },
    ],
  )
}

async function upsertDriver(result: ApiResult) {
  const driver = result.Driver
  const fullName = `${driver.givenName} ${driver.familyName}`.trim()
  const driverNumber = driver.permanentNumber || '0'
  return safeUpsertId(
    'drivers',
    {
      api_driver_id: driver.driverId,
      name: fullName,
      first_name: driver.givenName,
      last_name: driver.familyName,
      number: driverNumber,
      permanent_number: driverNumber,
      dob: driver.dateOfBirth ?? null,
      nationality: driver.nationality ?? null,
      image_url: fallbackDriverImage(fullName),
    },
    'api_driver_id',
    [
      { column: 'api_driver_id', value: driver.driverId },
      { column: 'name', value: fullName },
      { column: 'number', value: driverNumber },
    ],
  )
}

async function upsertRace(params: {
  seasonId: string | number
  circuitId: string
  year: number
  round: number
  raceName: string
  raceDate: string
}) {
  const apiRaceId = `${params.year}-${params.round}`
  return safeUpsertId(
    'races',
    {
      api_race_id: apiRaceId,
      season_id: params.seasonId,
      circuit_id: params.circuitId,
      round: params.round,
      name: params.raceName,
      date: params.raceDate,
      status: 'completed',
    },
    'api_race_id',
    [
      { column: 'api_race_id', value: apiRaceId },
      { column: 'round', value: params.round },
    ],
  )
}

export async function recalculateSeasonStandingsFromResults(seasonId: string | number) {
  const { data: rows, error } = await supabaseClient
    .from('race_results')
    .select('driver_id, team_id, position, points, status, races!inner(season_id, status)')
    .eq('races.season_id', seasonId)
    .eq('races.status', 'completed')

  if (error) throw new Error(error.message)

  const driverMap = new Map<string, { driver_id: string; team_id: string; wins: number; podiums: number; dnfs: number; points: number }>()
  const teamMap = new Map<string, { team_id: string; wins: number; podiums: number; points: number }>()

  for (const row of rows ?? []) {
    const position = Number(row.position ?? 0)
    const points = Number(row.points ?? 0)
    const status = String(row.status ?? 'DNF')

    const d = driverMap.get(row.driver_id) ?? {
      driver_id: row.driver_id,
      team_id: row.team_id,
      wins: 0,
      podiums: 0,
      dnfs: 0,
      points: 0,
    }
    if (position === 1) d.wins += 1
    if (position > 0 && position <= 3) d.podiums += 1
    if (status !== 'Finished') d.dnfs += 1
    d.points += points
    d.team_id = row.team_id
    driverMap.set(row.driver_id, d)

    const t = teamMap.get(row.team_id) ?? { team_id: row.team_id, wins: 0, podiums: 0, points: 0 }
    if (position === 1) t.wins += 1
    if (position > 0 && position <= 3) t.podiums += 1
    t.points += points
    teamMap.set(row.team_id, t)
  }

  const driverRows = [...driverMap.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || a.driver_id.localeCompare(b.driver_id))
  const teamRows = [...teamMap.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || a.team_id.localeCompare(b.team_id))

  await supabaseClient.from('driver_season_stats').delete().eq('season_id', seasonId)
  await supabaseClient.from('team_season_stats').delete().eq('season_id', seasonId)

  if (driverRows.length) {
    const payload = driverRows.map((row, idx) => ({
      season_id: seasonId,
      driver_id: row.driver_id,
      team_id: row.team_id,
      wins: row.wins,
      podiums: row.podiums,
      poles: 0,
      dnfs: row.dnfs,
      points: row.points,
      position: idx + 1,
    }))
    const { error: upsertErr } = await supabaseClient.from('driver_season_stats').upsert(payload, { onConflict: 'season_id,driver_id' })
    if (upsertErr) throw new Error(upsertErr.message)
  }

  if (teamRows.length) {
    const payload = teamRows.map((row, idx) => ({
      season_id: seasonId,
      team_id: row.team_id,
      wins: row.wins,
      podiums: row.podiums,
      points: row.points,
      position: idx + 1,
    }))
    const { error: upsertErr } = await supabaseClient.from('team_season_stats').upsert(payload, { onConflict: 'season_id,team_id' })
    if (upsertErr) throw new Error(upsertErr.message)
  }
}

export async function importSeasonFromJolpica(
  seasonYear: number,
  onProgress?: (progress: SeasonImportProgress) => void,
): Promise<SeasonImportSummary> {
  await ensureAdminSession()
  if (!Number.isInteger(seasonYear)) throw new Error('Invalid season year')
  if (seasonYear < 1950) throw new Error('Season year must be 1950 or later')

  const { data: seasonResp } = await fetchWithFallback(`/${seasonYear}.json?limit=200`)
  const races: ApiRace[] = seasonResp?.MRData?.RaceTable?.Races ?? []

  if (!races.length) {
    return {
      success: true,
      seasonYear,
      racesImported: 0,
      driversImported: 0,
      teamsImported: 0,
      circuitsImported: 0,
      resultsInserted: 0,
      failedRounds: [],
    }
  }

  const { data: seasonRow, error: seasonErr } = await supabaseClient
    .from('seasons')
    .upsert({ year: seasonYear }, { onConflict: 'year' })
    .select('*')
    .maybeSingle()

  if (seasonErr || !seasonRow) throw new Error(seasonErr?.message ?? 'Failed to upsert season')
  const seasonId = (seasonRow as { id?: string; year?: number }).id ?? (seasonRow as { year: number }).year

  let racesImported = 0
  let resultsInserted = 0
  const circuits = new Set<string>()
  const drivers = new Set<string>()
  const teams = new Set<string>()
  const failedRounds: Array<{ round: number; reason: string }> = []

  for (let index = 0; index < races.length; index += 1) {
    const race = races[index]
    const round = Number(race.round)

    onProgress?.({
      totalRounds: races.length,
      processedRounds: index + 1,
      currentRound: round,
      message: `Importing round ${round}: ${race.raceName}`,
    })

    try {
      const circuitId = await upsertCircuit(race)
      circuits.add(race.Circuit.circuitId)

      const raceId = await upsertRace({
        seasonId,
        circuitId,
        year: seasonYear,
        round,
        raceName: race.raceName,
        raceDate: race.date,
      })

      const { data: resultResp } = await fetchWithFallback(`/${seasonYear}/${round}/results.json?limit=200`)
      const results: ApiResult[] = resultResp?.MRData?.RaceTable?.Races?.[0]?.Results ?? []

      if (!results.length) {
        const { error: raceStatusErr } = await supabaseClient.from('races').update({ status: 'upcoming' }).eq('id', raceId)
        if (raceStatusErr) throw new Error(raceStatusErr.message)
        racesImported += 1
        continue
      }

      const resultRows: Array<{
        race_id: string
        driver_id: string
        team_id: string
        position: number
        points: number
        laps: number
        time: string | null
        status: string
      }> = []

      for (const result of results) {
        const teamId = await upsertTeam(result)
        const driverId = await upsertDriver(result)

        teams.add(result.Constructor.constructorId)
        drivers.add(result.Driver.driverId)

        resultRows.push({
          race_id: raceId,
          driver_id: driverId,
          team_id: teamId,
          position: Number(result.position ?? 0),
          points: Number(result.points ?? 0),
          laps: Number(result.laps ?? 0),
          time: result.Time?.time ?? null,
          status: normalizeResultStatus(result.status),
        })
      }

      if (resultRows.length) {
        const { error: resultsErr } = await supabaseClient
          .from('race_results')
          .upsert(resultRows, { onConflict: 'race_id,driver_id' })

        if (resultsErr && isMissingOnConflictConstraint(resultsErr)) {
          for (const row of resultRows) {
            const { data: existing, error: findErr } = await supabaseClient
              .from('race_results')
              .select('id')
              .eq('race_id', row.race_id)
              .eq('driver_id', row.driver_id)
              .maybeSingle()
            if (findErr) throw new Error(findErr.message)
            if (existing?.id) {
              const { error: updateErr } = await supabaseClient.from('race_results').update(row).eq('id', existing.id)
              if (updateErr) throw new Error(updateErr.message)
            } else {
              const { error: insertErr } = await supabaseClient.from('race_results').insert(row)
              if (insertErr) throw new Error(insertErr.message)
            }
          }
        } else if (resultsErr) {
          throw new Error(resultsErr.message)
        }
        resultsInserted += resultRows.length
      }

      const { error: raceStatusErr } = await supabaseClient.from('races').update({ status: 'completed' }).eq('id', raceId)
      if (raceStatusErr) throw new Error(raceStatusErr.message)
      racesImported += 1
    } catch (error) {
      failedRounds.push({
        round,
        reason: error instanceof Error ? error.message : 'Unknown round error',
      })
    }
  }

  await recalculateSeasonStandingsFromResults(seasonId)

  return {
    success: failedRounds.length === 0,
    seasonYear,
    racesImported,
    driversImported: drivers.size,
    teamsImported: teams.size,
    circuitsImported: circuits.size,
    resultsInserted,
    failedRounds,
  }
}
