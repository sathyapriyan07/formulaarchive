import { supabaseClient } from './supabaseClient'

export type OpenF1ImportProgress = {
  totalSessions: number
  processedSessions: number
  currentSessionKey?: number
  message: string
}

export type OpenF1ImportSummary = {
  success: boolean
  seasonYear: number
  racesImported: number
  driversImported: number
  teamsImported: number
  resultsInserted: number
  failedSessions: Array<{ session_key: number; reason: string }>
}

type OpenF1Session = {
  session_key: number
  session_name?: string
  country_name?: string
  location?: string
  circuit_short_name?: string
  date_start?: string
  meeting_name?: string
}

type OpenF1Result = {
  driver_number?: number
  full_name?: string
  team_name?: string
  position?: number
  points?: number
  status?: string
}

type OpenF1Driver = {
  driver_number?: number
  full_name?: string
  first_name?: string
  last_name?: string
  nationality?: string
  team_name?: string
}

function splitName(fullName?: string) {
  const safe = (fullName ?? '').trim()
  if (!safe) return { firstName: 'Unknown', lastName: '' }
  const parts = safe.split(/\s+/)
  return {
    firstName: parts[0] ?? 'Unknown',
    lastName: parts.slice(1).join(' '),
  }
}

function normalizeStatus(status?: string) {
  const s = (status ?? '').toLowerCase()
  if (s.includes('disqual')) return 'DSQ'
  if (s.includes('finish') || s.startsWith('+')) return 'Finished'
  return 'DNF'
}

function fallbackLogo(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E10600&color=ffffff&size=512&bold=true`
}

function fallbackPerson(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D0D11&color=ffffff&size=512&bold=true`
}

async function fetchOpenF1<T>(path: string): Promise<T[]> {
  const response = await fetch(`https://api.openf1.org/v1/${path}`)
  if (!response.ok) throw new Error(`OpenF1 request failed: ${response.status} for ${path}`)
  const data = await response.json()
  if (!Array.isArray(data)) throw new Error(`OpenF1 payload invalid for ${path}`)
  return data as T[]
}

async function fetchRaceSessions(seasonYear: number): Promise<OpenF1Session[]> {
  try {
    return await fetchOpenF1<OpenF1Session>(`sessions?year=${seasonYear}&session_name=Race`)
  } catch {
    return await fetchOpenF1<OpenF1Session>(`sessions?year=${seasonYear}&session_type=Race`)
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

async function upsertCircuit(session: OpenF1Session) {
  const name = session.circuit_short_name || session.meeting_name || `Circuit ${session.session_key}`
  const country = session.country_name || 'Unknown'
  const locality = session.location || null

  const payloadA = {
    name,
    country,
    locality,
    layout_image_url: fallbackLogo(name),
  }
  const payloadB = {
    name,
    country,
    image_url: fallbackLogo(name),
  }

  let data: any = null
  let error: any = null

  ;({ data, error } = await supabaseClient.from('circuits').upsert(payloadA, { onConflict: 'name,country' }).select('id').maybeSingle())
  if (error) {
    ;({ data, error } = await supabaseClient.from('circuits').upsert(payloadB, { onConflict: 'name,country' }).select('id').maybeSingle())
  }
  if (error || !data?.id) throw new Error(error?.message ?? 'Failed to upsert circuit')
  return data.id as string
}

async function upsertTeam(teamName: string) {
  const payloadA = {
    name: teamName,
    nationality: null,
    logo_url: fallbackLogo(teamName),
  }
  const payloadB = {
    name: teamName,
    logo_url: fallbackLogo(teamName),
  }

  let data: any = null
  let error: any = null

  ;({ data, error } = await supabaseClient.from('teams').upsert(payloadA, { onConflict: 'name' }).select('id').maybeSingle())
  if (error) {
    ;({ data, error } = await supabaseClient.from('teams').upsert(payloadB, { onConflict: 'name' }).select('id').maybeSingle())
  }
  if (error || !data?.id) throw new Error(error?.message ?? `Failed to upsert team ${teamName}`)
  return data.id as string
}

async function upsertDriver(driver: OpenF1Driver) {
  const driverNumber = String(driver.driver_number ?? 0)
  const fullName = (driver.full_name ?? '').trim()
  const names = splitName(fullName)
  const displayName = fullName || `${names.firstName} ${names.lastName}`.trim()

  const payloadA = {
    openf1_driver_number: driverNumber,
    first_name: driver.first_name || names.firstName,
    last_name: driver.last_name || names.lastName || null,
    name: displayName,
    permanent_number: driverNumber,
    number: driverNumber,
    nationality: driver.nationality || null,
    image_url: fallbackPerson(displayName),
  }
  const payloadB = {
    name: displayName,
    number: driverNumber,
    nationality: driver.nationality || null,
    image_url: fallbackPerson(displayName),
  }

  let data: any = null
  let error: any = null

  ;({ data, error } = await supabaseClient.from('drivers').upsert(payloadA, { onConflict: 'openf1_driver_number' }).select('id').maybeSingle())
  if (error) {
    ;({ data, error } = await supabaseClient.from('drivers').upsert(payloadB, { onConflict: 'number' }).select('id').maybeSingle())
  }
  if (error || !data?.id) throw new Error(error?.message ?? `Failed to upsert driver ${displayName}`)
  return data.id as string
}

async function upsertRace(params: {
  seasonId: string | number
  circuitId: string
  round: number
  raceName: string
  raceDate: string
  sessionKey: number
}) {
  const payloadA = {
    api_race_id: String(params.sessionKey),
    season_id: params.seasonId,
    circuit_id: params.circuitId,
    round: params.round,
    name: params.raceName,
    date: params.raceDate,
    status: 'completed',
  }
  const payloadB = {
    season_id: params.seasonId,
    circuit_id: params.circuitId,
    round: params.round,
    name: params.raceName,
    date: params.raceDate,
    status: 'completed',
  }

  let data: any = null
  let error: any = null

  ;({ data, error } = await supabaseClient.from('races').upsert(payloadA, { onConflict: 'api_race_id' }).select('id').maybeSingle())
  if (error) {
    ;({ data, error } = await supabaseClient.from('races').upsert(payloadB, { onConflict: 'season_id,round' }).select('id').maybeSingle())
  }
  if (error || !data?.id) throw new Error(error?.message ?? 'Failed to upsert race')
  return data.id as string
}

export async function recalculateSeasonStandingsFromResults(seasonId: string | number) {
  const { data: rows, error } = await supabaseClient
    .from('race_results')
    .select('driver_id, team_id, position, points, status, races!inner(season_id, status)')
    .eq('races.season_id', seasonId)
    .eq('races.status', 'completed')

  if (error) throw new Error(error.message)

  const driverMap = new Map<string, { driver_id: string; team_id: string; wins: number; podiums: number; poles: number; dnfs: number; points: number }>()
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
      poles: 0,
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

export async function importSeasonFromOpenF1(
  seasonYear: number,
  onProgress?: (progress: OpenF1ImportProgress) => void,
): Promise<OpenF1ImportSummary> {
  await ensureAdminSession()

  if (!Number.isInteger(seasonYear)) throw new Error('Invalid season year')
  if (seasonYear < 2023) throw new Error('OpenF1 historical data is available from 2023 onwards')

  const sessions = await fetchRaceSessions(seasonYear)
  if (!sessions.length) {
    return {
      success: true,
      seasonYear,
      racesImported: 0,
      driversImported: 0,
      teamsImported: 0,
      resultsInserted: 0,
      failedSessions: [],
    }
  }

  const ordered = [...sessions].sort((a, b) => {
    const ad = new Date(a.date_start ?? '').getTime()
    const bd = new Date(b.date_start ?? '').getTime()
    return ad - bd
  })

  const { data: seasonRow, error: seasonErr } = await supabaseClient
    .from('seasons')
    .upsert({ year: seasonYear }, { onConflict: 'year' })
    .select('*')
    .maybeSingle()

  if (seasonErr || !seasonRow) throw new Error(seasonErr?.message ?? 'Failed to upsert season')
  const seasonId = (seasonRow as { id?: string; year?: number }).id ?? (seasonRow as { year: number }).year

  let racesImported = 0
  let resultsInserted = 0
  const driverIds = new Set<string>()
  const teamIds = new Set<string>()
  const failedSessions: Array<{ session_key: number; reason: string }> = []

  for (let idx = 0; idx < ordered.length; idx += 1) {
    const session = ordered[idx]
    onProgress?.({
      totalSessions: ordered.length,
      processedSessions: idx + 1,
      currentSessionKey: session.session_key,
      message: `Processing race session ${session.session_key}`,
    })

    try {
      if (!session.session_key) throw new Error('Missing session_key')
      const circuitId = await upsertCircuit(session)

      const results = await fetchOpenF1<OpenF1Result>(`session_result?session_key=${session.session_key}`)
      if (!results.length) continue

      const drivers = await fetchOpenF1<OpenF1Driver>(`drivers?session_key=${session.session_key}`)
      const driverMap = new Map<number, OpenF1Driver>()
      for (const d of drivers) {
        if (typeof d.driver_number === 'number') driverMap.set(d.driver_number, d)
      }

      const raceName = session.meeting_name || `${session.circuit_short_name || 'Grand Prix'} Grand Prix`
      const raceDate = (session.date_start ?? new Date().toISOString()).slice(0, 10)
      const round = idx + 1

      const teamIdByName = new Map<string, string>()
      const driverIdByNumber = new Map<number, string>()

      for (const item of results) {
        const teamName = item.team_name || 'Unknown Team'
        if (!teamIdByName.has(teamName)) {
          const teamId = await upsertTeam(teamName)
          teamIdByName.set(teamName, teamId)
          teamIds.add(teamId)
        }
      }

      for (const item of results) {
        if (typeof item.driver_number !== 'number') continue
        if (!driverIdByNumber.has(item.driver_number)) {
          const details = driverMap.get(item.driver_number) ?? {
            driver_number: item.driver_number,
            full_name: item.full_name || `Driver ${item.driver_number}`,
            team_name: item.team_name || 'Unknown Team',
          }
          const driverId = await upsertDriver(details)
          driverIdByNumber.set(item.driver_number, driverId)
          driverIds.add(driverId)
        }
      }

      const raceId = await upsertRace({
        seasonId,
        circuitId,
        round,
        raceName,
        raceDate,
        sessionKey: session.session_key,
      })

      const raceResultsPayload = results
        .map((item) => {
          if (typeof item.driver_number !== 'number') return null
          const driverId = driverIdByNumber.get(item.driver_number)
          const teamId = teamIdByName.get(item.team_name || 'Unknown Team')
          if (!driverId || !teamId) return null
          return {
            race_id: raceId,
            driver_id: driverId,
            team_id: teamId,
            position: Number(item.position ?? 0),
            points: Number(item.points ?? 0),
            laps: 0,
            time: null,
            status: normalizeStatus(item.status),
          }
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row))

      if (raceResultsPayload.length) {
        const { error } = await supabaseClient.from('race_results').upsert(raceResultsPayload, { onConflict: 'race_id,driver_id' })
        if (error) throw new Error(error.message)
        resultsInserted += raceResultsPayload.length
      }

      racesImported += 1
    } catch (err) {
      failedSessions.push({
        session_key: session.session_key,
        reason: err instanceof Error ? err.message : 'Unknown session error',
      })
    }
  }

  await recalculateSeasonStandingsFromResults(seasonId)

  return {
    success: failedSessions.length === 0,
    seasonYear,
    racesImported,
    driversImported: driverIds.size,
    teamsImported: teamIds.size,
    resultsInserted,
    failedSessions,
  }
}
