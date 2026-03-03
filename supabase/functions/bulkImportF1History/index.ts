/// <reference path="../types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
      country: string
    }
  }
}

type ApiResult = {
  position: string
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
  }
  Time?: {
    time?: string
  }
}

type ImportJob = {
  id: string
  from_year: number
  to_year: number
  current_year: number
  status: 'pending' | 'running' | 'completed' | 'failed'
}

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'
const ERGAST_BASE = 'https://ergast.com/api/f1'
const BATCH_SIZE = 500

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function isFinished(status: string) {
  const s = status.toLowerCase().trim()
  return s.includes('finished') || s.startsWith('+')
}

function normalizeResultStatus(status: string) {
  const s = status.toLowerCase()
  if (s.includes('disqual')) return 'DSQ'
  if (isFinished(status)) return 'Finished'
  return 'DNF'
}

function pointsForPosition(year: number, position: number, status: string) {
  if (!isFinished(status)) return 0

  let table: number[]
  if (year <= 1959) table = [8, 6, 4, 3, 2]
  else if (year === 1960) table = [8, 6, 4, 3, 2, 1]
  else if (year <= 1990) table = [9, 6, 4, 3, 2, 1]
  else if (year <= 2002) table = [10, 6, 4, 3, 2, 1]
  else if (year <= 2009) table = [10, 8, 6, 5, 4, 3, 2, 1]
  else table = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

  if (position <= 0 || position > table.length) return 0
  return table[position - 1]
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

async function appendLog(admin: any, jobId: string, line: string) {
  const { data: job } = await admin.from('import_jobs').select('logs').eq('id', jobId).single()
  const logs = (job?.logs ?? []) as string[]
  logs.push(`${new Date().toISOString()} ${line}`)
  const capped = logs.slice(-300)
  await admin.from('import_jobs').update({ logs: capped, message: line }).eq('id', jobId)
}

async function recalcSeason(admin: any, year: number) {
  const { data: rows, error } = await admin
    .from('race_results')
    .select('driver_id, team_id, position, status, races!inner(season_id, status)')
    .eq('races.season_id', year)
    .eq('races.status', 'completed')

  if (error) throw error

  const driverMap = new Map<string, { driver_id: string; team_id: string; wins: number; podiums: number; poles: number; dnfs: number; points: number }>()
  const teamMap = new Map<string, { team_id: string; points: number }>()

  for (const row of rows ?? []) {
    const position = Number(row.position)
    const status = String(row.status)
    const points = pointsForPosition(year, position, status)

    const d = driverMap.get(row.driver_id) ?? {
      driver_id: row.driver_id,
      team_id: row.team_id,
      wins: 0,
      podiums: 0,
      poles: 0,
      dnfs: 0,
      points: 0,
    }

    d.team_id = row.team_id
    if (isFinished(status) && position === 1) d.wins += 1
    if (isFinished(status) && position <= 3) d.podiums += 1
    if (!isFinished(status)) d.dnfs += 1
    d.points += points
    driverMap.set(row.driver_id, d)

    const t = teamMap.get(row.team_id) ?? { team_id: row.team_id, points: 0 }
    t.points += points
    teamMap.set(row.team_id, t)
  }

  const driverRows = [...driverMap.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums)
  const teamRows = [...teamMap.values()].sort((a, b) => b.points - a.points)

  await admin.from('driver_season_stats').delete().eq('season_id', year)
  await admin.from('team_season_stats').delete().eq('season_id', year)

  if (driverRows.length) {
    const payload = driverRows.map((row, idx) => ({
      season_id: year,
      driver_id: row.driver_id,
      team_id: row.team_id,
      wins: row.wins,
      podiums: row.podiums,
      poles: row.poles,
      dnfs: row.dnfs,
      points: row.points,
      position: idx + 1,
    }))
    const { error: upsertErr } = await admin.from('driver_season_stats').upsert(payload, { onConflict: 'driver_id,season_id' })
    if (upsertErr) throw upsertErr
  }

  if (teamRows.length) {
    const payload = teamRows.map((row, idx) => ({
      season_id: year,
      team_id: row.team_id,
      points: row.points,
      position: idx + 1,
    }))
    const { error: upsertErr } = await admin.from('team_season_stats').upsert(payload, { onConflict: 'team_id,season_id' })
    if (upsertErr) throw upsertErr
  }

  await admin
    .from('seasons')
    .update({
      champion_driver_id: driverRows[0]?.driver_id ?? null,
      champion_team_id: teamRows[0]?.team_id ?? null,
    })
    .eq('year', year)
}

async function importSeason(admin: any, jobId: string, year: number) {
  await appendLog(admin, jobId, `Importing season ${year}`)
  await admin.from('seasons').upsert({ year }, { onConflict: 'year' })

  const { data: seasonResp, source } = await fetchWithFallback(`/${year}/races.json?limit=200`)
  const races: ApiRace[] = seasonResp?.MRData?.RaceTable?.Races ?? []

  const seasonDriverIds = new Set<string>()
  const seasonTeamIds = new Set<string>()
  const seasonCircuitIds = new Set<string>()
  let seasonRaceCount = 0
  let seasonResultCount = 0

  for (const race of races) {
    const round = Number(race.round)
    const apiRaceId = `${year}-${round}`

    const { data: circuit, error: circuitErr } = await admin
      .from('circuits')
      .upsert(
        {
          api_circuit_id: race.Circuit.circuitId,
          name: race.Circuit.circuitName,
          country: race.Circuit.Location.country,
          image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(race.Circuit.circuitName)}&background=38383F&color=ffffff&size=1024&bold=true`,
        },
        { onConflict: 'api_circuit_id' },
      )
      .select('id')
      .single()

    if (circuitErr) throw circuitErr
    seasonCircuitIds.add(race.Circuit.circuitId)

    const { data: raceRow, error: raceErr } = await admin
      .from('races')
      .upsert(
        {
          api_race_id: apiRaceId,
          name: race.raceName,
          season_id: year,
          circuit_id: circuit.id,
          date: race.date,
          round,
          status: 'upcoming',
        },
        { onConflict: 'api_race_id' },
      )
      .select('id')
      .single()

    if (raceErr) throw raceErr
    seasonRaceCount += 1

    const { data: resultsResp } = await fetchWithFallback(`/${year}/${round}/results.json?limit=200`)
    const results: ApiResult[] = resultsResp?.MRData?.RaceTable?.Races?.[0]?.Results ?? []

    if (!results.length) {
      await sleep(90)
      continue
    }

    const teamsPayload = Array.from(
      new Map(
        results.map((result) => [
          result.Constructor.constructorId,
          {
            api_constructor_id: result.Constructor.constructorId,
            name: result.Constructor.name,
            logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.Constructor.name)}&background=E10600&color=ffffff&size=256&bold=true`,
            car_image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.Constructor.name)}+Car&background=15151E&color=ffffff&size=1024&bold=true`,
          },
        ]),
      ).values(),
    )

    for (const batch of chunk(teamsPayload, BATCH_SIZE)) {
      const { error } = await admin.from('teams').upsert(batch, { onConflict: 'api_constructor_id' })
      if (error) throw error
    }

    const driversPayload = Array.from(
      new Map(
        results.map((result) => {
          const fullName = `${result.Driver.givenName} ${result.Driver.familyName}`.trim()
          return [
            result.Driver.driverId,
            {
              api_driver_id: result.Driver.driverId,
              name: fullName,
              number: result.Driver.permanentNumber || '0',
              dob: result.Driver.dateOfBirth || null,
              nationality: result.Driver.nationality || null,
              image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D0D11&color=ffffff&size=512&bold=true`,
            },
          ]
        }),
      ).values(),
    )

    for (const batch of chunk(driversPayload, BATCH_SIZE)) {
      const { error } = await admin.from('drivers').upsert(batch, { onConflict: 'api_driver_id' })
      if (error) throw error
    }

    const { data: teamRows, error: teamRowsErr } = await admin
      .from('teams')
      .select('id, api_constructor_id')
      .in('api_constructor_id', teamsPayload.map((item) => item.api_constructor_id))
    if (teamRowsErr) throw teamRowsErr

    const { data: driverRows, error: driverRowsErr } = await admin
      .from('drivers')
      .select('id, api_driver_id')
      .in('api_driver_id', driversPayload.map((item) => item.api_driver_id))
    if (driverRowsErr) throw driverRowsErr

    const teamIdMap = new Map((teamRows ?? []).map((row: any) => [row.api_constructor_id, row.id]))
    const driverIdMap = new Map((driverRows ?? []).map((row: any) => [row.api_driver_id, row.id]))

    const resultPayload = results
      .map((result) => {
        const driverId = driverIdMap.get(result.Driver.driverId)
        const teamId = teamIdMap.get(result.Constructor.constructorId)
        if (!driverId || !teamId) return null

        seasonDriverIds.add(result.Driver.driverId)
        seasonTeamIds.add(result.Constructor.constructorId)

        return {
          race_id: raceRow.id,
          driver_id: driverId,
          team_id: teamId,
          position: Number(result.position || 0),
          laps: Number(result.laps || 0),
          time: result.Time?.time || null,
          status: normalizeResultStatus(result.status),
        }
      })
      .filter(Boolean)

    for (const batch of chunk(resultPayload, BATCH_SIZE)) {
      const { error } = await admin.from('race_results').upsert(batch, { onConflict: 'race_id,driver_id' })
      if (error) throw error
    }

    seasonResultCount += resultPayload.length
    await admin.from('races').update({ status: 'completed' }).eq('id', raceRow.id)
    await sleep(100)
  }

  await recalcSeason(admin, year)
  await appendLog(admin, jobId, `Season ${year} complete via ${source}: races=${seasonRaceCount}, results=${seasonResultCount}`)

  return {
    source,
    seasonRaceCount,
    seasonResultCount,
    drivers: seasonDriverIds.size,
    teams: seasonTeamIds.size,
    circuits: seasonCircuitIds.size,
  }
}

function progress(fromYear: number, toYear: number, currentYear: number) {
  const total = Math.max(1, toYear - fromYear + 1)
  const done = Math.max(0, Math.min(total, currentYear - fromYear))
  return Number(((done / total) * 100).toFixed(2))
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ?? Deno.env.get('APP_SUPABASE_URL')
    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('APP_SUPABASE_ANON_KEY')
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing required Supabase function secrets')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser()

    if (userErr || !user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: roleRow, error: roleErr } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleErr || roleRow?.role !== 'admin') {
      return new Response(JSON.stringify({ ok: false, error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: 'start' | 'process' | 'resume'
      fromYear?: number
      toYear?: number
      jobId?: string
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const action = body.action ?? 'process'

    if (action === 'start') {
      const currentYear = new Date().getUTCFullYear()
      const fromYear = Math.max(1950, Number(body.fromYear ?? 1950))
      const toYear = Math.min(currentYear, Number(body.toYear ?? currentYear))

      if (fromYear > toYear) {
        return new Response(JSON.stringify({ ok: false, error: 'fromYear must be <= toYear' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: job, error: jobErr } = await admin
        .from('import_jobs')
        .insert({
          created_by: user.id,
          from_year: fromYear,
          to_year: toYear,
          current_year: fromYear,
          status: 'running',
          last_error: null,
          progress_percent: 0,
          processed_seasons: 0,
          total_seasons: toYear - fromYear + 1,
          logs: [],
          message: `Import job started for ${fromYear}-${toYear}`,
        })
        .select('*')
        .single()

      if (jobErr || !job) throw jobErr ?? new Error('Failed to create import job')

      return new Response(JSON.stringify({ ok: true, job, message: 'Import job created' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!body.jobId) {
      return new Response(JSON.stringify({ ok: false, error: 'jobId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: existingJob, error: jobErr } = await admin
      .from('import_jobs')
      .select('*')
      .eq('id', body.jobId)
      .single()

    if (jobErr || !existingJob) {
      return new Response(JSON.stringify({ ok: false, error: 'Import job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const job = existingJob as ImportJob & Record<string, any>

    if (action === 'resume' && job.status === 'failed') {
      await admin
        .from('import_jobs')
        .update({ status: 'running', last_error: null, error_message: null, message: `Resuming from ${job.current_year}` })
        .eq('id', job.id)
      job.status = 'running'
    }

    if (job.status === 'completed') {
      return new Response(JSON.stringify({ ok: true, status: 'completed', job, progress: 100 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (job.status === 'failed') {
      return new Response(JSON.stringify({ ok: false, status: 'failed', error: job.last_error || 'Import job is in failed state', job }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const year = Number(job.current_year)
    if (year > Number(job.to_year)) {
      await admin
        .from('import_jobs')
        .update({ status: 'completed', progress_percent: 100, message: 'Import completed', updated_at: new Date().toISOString() })
        .eq('id', job.id)

      return new Response(JSON.stringify({ ok: true, status: 'completed', progress: 100, currentYear: year, jobId: job.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    try {
      const seasonSummary = await importSeason(admin, job.id, year)
      const nextYear = year + 1
      const done = nextYear > Number(job.to_year)
      const nextProgress = done ? 100 : progress(Number(job.from_year), Number(job.to_year), nextYear)

      const { data: updatedJob, error: updateErr } = await admin
        .from('import_jobs')
        .update({
          status: done ? 'completed' : 'running',
          current_year: nextYear,
          current_season: year,
          processed_seasons: Math.max(0, year - Number(job.from_year) + 1),
          progress_percent: nextProgress,
          seasons_imported: (Number(job.seasons_imported) || 0) + 1,
          races_imported: (Number(job.races_imported) || 0) + seasonSummary.seasonRaceCount,
          results_imported: (Number(job.results_imported) || 0) + seasonSummary.seasonResultCount,
          drivers_imported: (Number(job.drivers_imported) || 0) + seasonSummary.drivers,
          teams_imported: (Number(job.teams_imported) || 0) + seasonSummary.teams,
          circuits_imported: (Number(job.circuits_imported) || 0) + seasonSummary.circuits,
          last_error: null,
          error_message: null,
          message: done ? `Import completed at ${year}` : `Season ${year} imported. Next ${nextYear}`,
          finished_at: done ? new Date().toISOString() : null,
        })
        .eq('id', job.id)
        .select('*')
        .single()

      if (updateErr) throw updateErr

      return new Response(
        JSON.stringify({
          ok: true,
          status: done ? 'completed' : 'running',
          job: updatedJob,
          processedYear: year,
          nextYear,
          progress: nextProgress,
          seasonSummary,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Season import failed'
      await appendLog(admin, job.id, `Season ${year} failed: ${message}`)
      await admin
        .from('import_jobs')
        .update({
          status: 'failed',
          last_error: message,
          error_message: message,
          message: `Failed at season ${year}`,
        })
        .eq('id', job.id)

      return new Response(JSON.stringify({ ok: false, status: 'failed', error: message, failedYear: year, jobId: job.id }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unexpected error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
