import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  Results?: ApiResult[]
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

type JobSummary = {
  seasonsImported: number
  racesImported: number
  driversImported: number
  teamsImported: number
  circuitsImported: number
  resultsImported: number
  errors: Array<{ season: number; message: string }>
}

type ImportJobRow = {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'stopped'
  from_year: number
  to_year: number
  current_season: number | null
  message: string | null
  summary: JobSummary | null
  error_message: string | null
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

async function shouldStop(admin: any, jobId: string) {
  const { data } = await admin.from('import_jobs').select('stop_requested').eq('id', jobId).single()
  return Boolean(data?.stop_requested)
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
    if (isFinished(status) && position > 0 && position <= 3) d.podiums += 1
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

  const championDriverId = driverRows[0]?.driver_id ?? null
  const championTeamId = teamRows[0]?.team_id ?? null
  await admin.from('seasons').update({ champion_driver_id: championDriverId, champion_team_id: championTeamId }).eq('year', year)
}

async function refreshChampionshipCounts(admin: any) {
  const { data: seasons } = await admin.from('seasons').select('champion_driver_id, champion_team_id')

  const driverCount = new Map<string, number>()
  const teamCount = new Map<string, number>()

  for (const season of seasons ?? []) {
    if (season.champion_driver_id) {
      driverCount.set(season.champion_driver_id, (driverCount.get(season.champion_driver_id) ?? 0) + 1)
    }
    if (season.champion_team_id) {
      teamCount.set(season.champion_team_id, (teamCount.get(season.champion_team_id) ?? 0) + 1)
    }
  }

  await admin.from('drivers').update({ championships: 0 }).neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('teams').update({ championships: 0 }).neq('id', '00000000-0000-0000-0000-000000000000')

  for (const [driverId, championships] of driverCount.entries()) {
    await admin.from('drivers').update({ championships }).eq('id', driverId)
  }

  for (const [teamId, championships] of teamCount.entries()) {
    await admin.from('teams').update({ championships }).eq('id', teamId)
  }
}

async function refreshActiveTeams(admin: any, currentYear: number) {
  await admin.from('teams').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')

  const { data } = await admin
    .from('race_results')
    .select('team_id, races!inner(season_id)')
    .eq('races.season_id', currentYear)

  const teamIds = [...new Set((data ?? []).map((row: any) => row.team_id))]
  if (teamIds.length) {
    await admin.from('teams').update({ is_active: true }).in('id', teamIds)
  }
}

async function runBulkImport(admin: any, jobId: string, fromYear: number, toYear: number) {
  const summary: JobSummary = {
    seasonsImported: 0,
    racesImported: 0,
    driversImported: 0,
    teamsImported: 0,
    circuitsImported: 0,
    resultsImported: 0,
    errors: [],
  }

  const totalSeasons = Math.max(0, toYear - fromYear + 1)

  await admin.from('import_jobs').update({
    status: 'running',
    started_at: new Date().toISOString(),
    total_seasons: totalSeasons,
    progress_percent: 0,
    message: `Starting import ${fromYear}-${toYear}`,
    logs: [],
  }).eq('id', jobId)

  await appendLog(admin, jobId, `Import started for ${fromYear} -> ${toYear}`)

  for (let year = fromYear; year <= toYear; year += 1) {
    if (await shouldStop(admin, jobId)) {
      await admin.from('import_jobs').update({
        status: 'stopped',
        finished_at: new Date().toISOString(),
        summary,
        message: `Stopped at season ${year}`,
      }).eq('id', jobId)
      await appendLog(admin, jobId, `Stopped by admin at season ${year}`)
      return
    }

    try {
      await appendLog(admin, jobId, `Importing season ${year}`)
      await admin.from('seasons').upsert({ year }, { onConflict: 'year' })

      const { data: seasonResp } = await fetchWithFallback(`/${year}/races.json?limit=200`)
      const races: ApiRace[] = seasonResp?.MRData?.RaceTable?.Races ?? []

      const seasonDriverIds = new Set<string>()
      const seasonTeamIds = new Set<string>()
      const seasonCircuitIds = new Set<string>()
      let seasonRaceCount = 0
      let seasonResultCount = 0

      for (const race of races) {
        const round = Number(race.round)
        const apiRaceId = `${year}-${round}`

        const circuitPayload = {
          api_circuit_id: race.Circuit.circuitId,
          name: race.Circuit.circuitName,
          country: race.Circuit.Location.country,
          image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(race.Circuit.circuitName)}&background=38383F&color=ffffff&size=1024&bold=true`,
        }

        const { data: circuit, error: circuitErr } = await admin
          .from('circuits')
          .upsert(circuitPayload, { onConflict: 'api_circuit_id' })
          .select('id')
          .single()

        if (circuitErr) throw circuitErr
        seasonCircuitIds.add(race.Circuit.circuitId)

        const racePayload = {
          api_race_id: apiRaceId,
          name: race.raceName,
          season_id: year,
          circuit_id: circuit.id,
          date: race.date,
          round,
          status: 'upcoming',
        }

        const { data: raceRow, error: raceErr } = await admin
          .from('races')
          .upsert(racePayload, { onConflict: 'api_race_id' })
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
            results.map((result) => [result.Constructor.constructorId, {
              api_constructor_id: result.Constructor.constructorId,
              name: result.Constructor.name,
              logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.Constructor.name)}&background=E10600&color=ffffff&size=256&bold=true`,
              car_image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.Constructor.name)}+Car&background=15151E&color=ffffff&size=1024&bold=true`,
            }]),
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
              return [result.Driver.driverId, {
                api_driver_id: result.Driver.driverId,
                name: fullName,
                number: result.Driver.permanentNumber || '0',
                dob: result.Driver.dateOfBirth || null,
                nationality: result.Driver.nationality || null,
                image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D0D11&color=ffffff&size=512&bold=true`,
              }]
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
          const { error } = await admin
            .from('race_results')
            .upsert(batch, { onConflict: 'race_id,driver_id' })
          if (error) throw error
        }

        seasonResultCount += resultPayload.length
        await admin.from('races').update({ status: 'completed' }).eq('id', raceRow.id)
        await sleep(100)
      }

      await recalcSeason(admin, year)

      summary.seasonsImported += 1
      summary.racesImported += seasonRaceCount
      summary.resultsImported += seasonResultCount
      summary.driversImported += seasonDriverIds.size
      summary.teamsImported += seasonTeamIds.size
      summary.circuitsImported += seasonCircuitIds.size

      const processedSeasons = year - fromYear + 1
      const progressPercent = Number(((processedSeasons / totalSeasons) * 100).toFixed(2))

      await admin
        .from('import_jobs')
        .update({
          current_season: year,
          processed_seasons: processedSeasons,
          progress_percent: progressPercent,
          seasons_imported: summary.seasonsImported,
          races_imported: summary.racesImported,
          drivers_imported: summary.driversImported,
          teams_imported: summary.teamsImported,
          circuits_imported: summary.circuitsImported,
          results_imported: summary.resultsImported,
          summary,
          message: `Season ${year} imported`,
        })
        .eq('id', jobId)

      await appendLog(admin, jobId, `Season ${year} complete: races=${seasonRaceCount}, results=${seasonResultCount}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown season import error'
      summary.errors.push({ season: year, message })
      await appendLog(admin, jobId, `Season ${year} failed: ${message}`)
    }
  }

  await refreshChampionshipCounts(admin)
  await refreshActiveTeams(admin, toYear)

  await admin
    .from('import_jobs')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      current_season: toYear,
      progress_percent: 100,
      summary,
      message: `Import complete. Seasons=${summary.seasonsImported}, Races=${summary.racesImported}, Results=${summary.resultsImported}`,
      seasons_imported: summary.seasonsImported,
      races_imported: summary.racesImported,
      drivers_imported: summary.driversImported,
      teams_imported: summary.teamsImported,
      circuits_imported: summary.circuitsImported,
      results_imported: summary.resultsImported,
      error_message: summary.errors.length ? `${summary.errors.length} season(s) skipped` : null,
    })
    .eq('id', jobId)

  await appendLog(admin, jobId, 'Import completed')
}

async function resolveResumeRange(admin: any, userId: string, defaultToYear: number) {
  const { data: lastJob, error } = await admin
    .from('import_jobs')
    .select('id, status, from_year, to_year, current_season, message, summary, error_message')
    .eq('created_by', userId)
    .or('status.eq.failed,status.eq.stopped,error_message.not.is.null')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!lastJob) {
    throw new Error('No failed/stopped import job found to resume')
  }

  const job = lastJob as ImportJobRow
  const summaryErrors = Array.isArray(job.summary?.errors) ? job.summary?.errors : []
  const firstFailedSeason = summaryErrors.length
    ? Math.min(...summaryErrors.map((item: { season: number }) => Number(item.season)).filter((year: number) => Number.isFinite(year)))
    : null

  let startYear = job.current_season ?? job.from_year
  if (job.status === 'stopped') {
    const match = (job.message ?? '').match(/Stopped at season\\s+(\\d{4})/i)
    if (match?.[1]) {
      startYear = Number(match[1])
    } else if (job.current_season) {
      startYear = job.current_season + 1
    }
  }
  if (firstFailedSeason && Number.isFinite(firstFailedSeason)) {
    startYear = Math.min(startYear, firstFailedSeason)
  }

  const toYear = Math.max(startYear, Math.min(defaultToYear, job.to_year))
  return { fromYear: Math.max(1950, startYear), toYear, resumeFromJobId: job.id }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing required Supabase env vars')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), {
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({})) as {
      action?: 'start' | 'stop' | 'resume'
      fromYear?: number
      toYear?: number
      jobId?: string
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    if (body.action === 'stop') {
      if (!body.jobId) {
        return new Response(JSON.stringify({ error: 'jobId is required for stop action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: stopErr } = await admin.from('import_jobs').update({ stop_requested: true, message: 'Stop requested by admin' }).eq('id', body.jobId)
      if (stopErr) throw stopErr

      return new Response(JSON.stringify({ ok: true, jobId: body.jobId, message: 'Stop requested' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date()
    const currentYear = now.getUTCFullYear()
    let fromYear = Math.max(1950, Number(body.fromYear ?? 1950))
    let toYear = Math.min(currentYear, Number(body.toYear ?? currentYear))

    let resumeFromJobId: string | null = null
    if (body.action === 'resume') {
      const resolved = await resolveResumeRange(admin, user.id, toYear)
      fromYear = resolved.fromYear
      toYear = resolved.toYear
      resumeFromJobId = resolved.resumeFromJobId
    }

    if (fromYear > toYear) {
      return new Response(JSON.stringify({ error: 'fromYear must be <= toYear' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: job, error: jobErr } = await admin
      .from('import_jobs')
      .insert({
        created_by: user.id,
        status: 'queued',
        from_year: fromYear,
        to_year: toYear,
        total_seasons: toYear - fromYear + 1,
        message: body.action === 'resume'
          ? `Queued resumed import ${fromYear}-${toYear} from job ${resumeFromJobId}`
          : `Queued import ${fromYear}-${toYear}`,
      })
      .select('id')
      .single()

    if (jobErr || !job) throw jobErr ?? new Error('Failed to create import job')

    const task = runBulkImport(admin, job.id, fromYear, toYear).catch(async (error) => {
      await admin
        .from('import_jobs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Bulk import failed',
          message: 'Import failed',
        })
        .eq('id', job.id)
    })

    // @ts-ignore: available in Supabase Edge Runtime
    if (globalThis.EdgeRuntime && typeof EdgeRuntime.waitUntil === 'function') {
      // @ts-ignore
      EdgeRuntime.waitUntil(task)
    } else {
      task.catch(() => {})
    }

    return new Response(
      JSON.stringify({
        ok: true,
        jobId: job.id,
        fromYear,
        toYear,
        resumeFromJobId,
        message: body.action === 'resume' ? 'Bulk import resume started' : 'Bulk import started',
      }),
      {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
