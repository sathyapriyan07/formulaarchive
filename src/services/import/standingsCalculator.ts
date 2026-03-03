import { supabaseClient } from '../supabaseClient'

const FIA_POINTS: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
}

function pointsFor(position: number, status: string) {
  if (status !== 'Finished') return 0
  return FIA_POINTS[position] ?? 0
}

export async function recalculateSeasonStandings(seasonYear: number) {
  const { data: rows, error } = await supabaseClient
    .from('race_results')
    .select('driver_id, team_id, position, status, races!inner(season_id, status)')
    .eq('races.season_id', seasonYear)
    .eq('races.status', 'completed')

  if (error) throw error

  const driverMap = new Map<
    string,
    { driver_id: string; team_id: string; wins: number; podiums: number; poles: number; dnfs: number; points: number }
  >()
  const teamMap = new Map<string, { team_id: string; points: number }>()

  for (const row of rows ?? []) {
    const key = row.driver_id as string
    const existing = driverMap.get(key) ?? {
      driver_id: row.driver_id as string,
      team_id: row.team_id as string,
      wins: 0,
      podiums: 0,
      poles: 0,
      dnfs: 0,
      points: 0,
    }

    existing.team_id = row.team_id as string
    if (row.status === 'Finished' && Number(row.position) === 1) existing.wins += 1
    if (row.status === 'Finished' && Number(row.position) <= 3) existing.podiums += 1
    if (row.status === 'DNF') existing.dnfs += 1
    existing.points += pointsFor(Number(row.position), row.status as string)
    driverMap.set(key, existing)

    const teamExisting = teamMap.get(row.team_id as string) ?? { team_id: row.team_id as string, points: 0 }
    teamExisting.points += pointsFor(Number(row.position), row.status as string)
    teamMap.set(row.team_id as string, teamExisting)
  }

  const driverRows = [...driverMap.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums)
  const teamRows = [...teamMap.values()].sort((a, b) => b.points - a.points)

  const driverPayload = driverRows.map((row, idx) => ({
    season_id: seasonYear,
    driver_id: row.driver_id,
    team_id: row.team_id,
    wins: row.wins,
    podiums: row.podiums,
    poles: row.poles,
    dnfs: row.dnfs,
    points: row.points,
    position: idx + 1,
  }))

  const teamPayload = teamRows.map((row, idx) => ({
    season_id: seasonYear,
    team_id: row.team_id,
    points: row.points,
    position: idx + 1,
  }))

  await supabaseClient.from('driver_season_stats').delete().eq('season_id', seasonYear)
  await supabaseClient.from('team_season_stats').delete().eq('season_id', seasonYear)

  if (driverPayload.length) {
    const { error: driverError } = await supabaseClient.from('driver_season_stats').upsert(driverPayload, { onConflict: 'driver_id,season_id' })
    if (driverError) throw driverError
  }
  if (teamPayload.length) {
    const { error: teamError } = await supabaseClient.from('team_season_stats').upsert(teamPayload, { onConflict: 'team_id,season_id' })
    if (teamError) throw teamError
  }

  return {
    driverStandingsCount: driverPayload.length,
    teamStandingsCount: teamPayload.length,
  }
}
