import { supabaseClient } from './supabaseClient'

type EntityName =
  | 'seasons'
  | 'teams'
  | 'drivers'
  | 'circuits'
  | 'races'
  | 'race_results'
  | 'driver_season_stats'
  | 'team_season_stats'
  | 'driver_team_assignments'

export async function listTable<T>(table: EntityName, orderBy = 'created_at') {
  const { data, error } = await supabaseClient.from(table).select('*').order(orderBy, { ascending: false })
  if (error) throw error
  return (data ?? []) as T[]
}

export async function createRow<T extends Record<string, unknown>>(table: EntityName, values: T) {
  const { data, error } = await supabaseClient.from(table).insert(values).select('*').single()
  if (error) throw error
  return data
}

export async function updateRow<T extends Record<string, unknown>>(table: EntityName, id: string, values: T) {
  const { data, error } = await supabaseClient.from(table).update(values).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteRow(table: EntityName, id: string) {
  const { error } = await supabaseClient.from(table).delete().eq('id', id)
  if (error) throw error
}

export async function getHomepageSnapshot() {
  const [{ data: nextRace, error: nextRaceError }, { data: topDrivers, error: topDriversError }, { data: topTeams, error: topTeamsError }] =
    await Promise.all([
      supabaseClient
        .from('v_upcoming_race')
        .select('*')
        .limit(1)
        .maybeSingle(),
      supabaseClient
        .from('v_current_driver_standings')
        .select('*')
        .order('position', { ascending: true })
        .limit(5),
      supabaseClient
        .from('v_current_team_standings')
        .select('*')
        .order('position', { ascending: true })
        .limit(5),
    ])

  if (nextRaceError) throw nextRaceError
  if (topDriversError) throw topDriversError
  if (topTeamsError) throw topTeamsError

  return {
    nextRace,
    topDrivers: topDrivers ?? [],
    topTeams: topTeams ?? [],
  }
}
