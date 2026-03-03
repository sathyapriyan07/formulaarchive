import { supabaseClient } from './supabaseClient'
import {
  fetchSeasonCircuits,
  fetchSeasonDrivers,
  fetchSeasonRaces,
  type ErgastCircuit,
  type ErgastDriver,
  type ErgastRace,
} from './jolpicaErgastService'

type DbTable = 'drivers' | 'circuits' | 'races' | 'seasons'

export type ImportProgress = {
  total: number
  processed: number
  message: string
}

export type DriversImportSummary = {
  source: 'jolpica' | 'ergast'
  year: number
  driversImported: number
  driversUpdated: number
  failedDrivers: Array<{ driverId: string; reason: string }>
}

export type CircuitsImportSummary = {
  source: 'jolpica' | 'ergast'
  year: number
  circuitsImported: number
  circuitsUpdated: number
  failedCircuits: Array<{ circuitId: string; reason: string }>
}

export type RacesImportSummary = {
  source: 'jolpica' | 'ergast'
  year: number
  racesImported: number
  racesUpdated: number
  failedRaces: Array<{ round: number; reason: string }>
}

function fallbackImage(name: string, background: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=ffffff&size=512&bold=true`
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

function isMissingOnConflictConstraint(error: unknown) {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : ''
  return message.toLowerCase().includes('no unique or exclusion constraint matching the on conflict specification')
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

async function rowExists(table: DbTable, column: string, value: string | number) {
  const { data, error } = await supabaseClient.from(table).select('id').eq(column, value).maybeSingle()
  if (error) throw new Error(error.message)
  return Boolean(data?.id)
}

async function safeUpsert(
  table: DbTable,
  payload: Record<string, unknown>,
  onConflict: string,
  lookup: Array<{ column: string; value: string | number }>,
) {
  const candidate: Record<string, unknown> = { ...payload }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabaseClient.from(table).upsert(candidate, { onConflict })
    if (!error) return

    if (isMissingOnConflictConstraint(error)) {
      for (const entry of lookup) {
        const { data: existing } = await supabaseClient.from(table).select('id').eq(entry.column, entry.value).maybeSingle()
        if (existing?.id) {
          const { error: updateErr } = await supabaseClient.from(table).update(candidate).eq('id', existing.id)
          if (updateErr) throw new Error(updateErr.message)
          return
        }
      }
      const { error: insertErr } = await supabaseClient.from(table).insert(candidate)
      if (insertErr) throw new Error(insertErr.message)
      return
    }

    const missingColumn = extractMissingColumn(error)
    if (missingColumn && missingColumn in candidate) {
      delete candidate[missingColumn]
      continue
    }

    throw new Error(error.message)
  }

  const { error: finalInsertErr } = await supabaseClient.from(table).insert(candidate)
  if (finalInsertErr) throw new Error(finalInsertErr.message)
}

async function ensureSeason(year: number) {
  await safeUpsert('seasons', { year }, 'year', [{ column: 'year', value: year }])
  const { data, error } = await supabaseClient.from('seasons').select('*').eq('year', year).maybeSingle()
  if (error || !data) throw new Error(error?.message ?? `Season ${year} not found`)
  return (data as { id?: string; year?: number }).id ?? (data as { year: number }).year
}

async function upsertDriver(driver: ErgastDriver) {
  const name = `${driver.givenName} ${driver.familyName}`.trim()
  const number = driver.permanentNumber || '0'
  const payload = {
    api_driver_id: driver.driverId,
    first_name: driver.givenName,
    last_name: driver.familyName,
    name,
    nationality: driver.nationality ?? null,
    dob: driver.dateOfBirth ?? null,
    number,
    permanent_number: number,
    image_url: fallbackImage(name, '0D0D11'),
  }

  await safeUpsert('drivers', payload, 'api_driver_id', [
    { column: 'api_driver_id', value: driver.driverId },
    { column: 'name', value: name },
    { column: 'number', value: number },
  ])
}

async function upsertCircuit(circuit: ErgastCircuit) {
  const payload = {
    api_circuit_id: circuit.circuitId,
    name: circuit.circuitName,
    locality: circuit.Location.locality ?? null,
    country: circuit.Location.country,
    image_url: fallbackImage(circuit.circuitName, '38383F'),
    layout_image_url: fallbackImage(`${circuit.circuitName} Layout`, '25252E'),
  }

  await safeUpsert('circuits', payload, 'api_circuit_id', [
    { column: 'api_circuit_id', value: circuit.circuitId },
    { column: 'name', value: circuit.circuitName },
  ])
}

async function upsertRace(race: ErgastRace, seasonId: string | number, circuitId: string) {
  const round = Number(race.round)
  const apiRaceId = `${race.season}-${round}`
  const payload = {
    api_race_id: apiRaceId,
    season_id: seasonId,
    circuit_id: circuitId,
    round,
    name: race.raceName,
    date: race.date,
  }

  await safeUpsert('races', payload, 'api_race_id', [
    { column: 'api_race_id', value: apiRaceId },
    { column: 'round', value: round },
  ])
}

export async function importDriversByYear(
  inputYear: number | undefined,
  onProgress?: (progress: ImportProgress) => void,
): Promise<DriversImportSummary> {
  await ensureAdminSession()
  const year = inputYear ?? new Date().getFullYear()
  if (!Number.isInteger(year) || year < 1950) throw new Error('Year must be 1950 or later')

  const { drivers, source } = await fetchSeasonDrivers(year)

  let driversImported = 0
  let driversUpdated = 0
  const failedDrivers: Array<{ driverId: string; reason: string }> = []

  for (let index = 0; index < drivers.length; index += 1) {
    const driver = drivers[index]
    onProgress?.({
      total: drivers.length,
      processed: index + 1,
      message: `Importing driver ${driver.driverId}`,
    })

    try {
      const existed = await rowExists('drivers', 'api_driver_id', driver.driverId)
      await upsertDriver(driver)
      if (existed) driversUpdated += 1
      else driversImported += 1
    } catch (error) {
      failedDrivers.push({
        driverId: driver.driverId,
        reason: error instanceof Error ? error.message : 'Unknown driver error',
      })
    }
  }

  return { source, year, driversImported, driversUpdated, failedDrivers }
}

export async function importCircuitsByYear(
  inputYear: number | undefined,
  onProgress?: (progress: ImportProgress) => void,
): Promise<CircuitsImportSummary> {
  await ensureAdminSession()
  const year = inputYear ?? new Date().getFullYear()
  if (!Number.isInteger(year) || year < 1950) throw new Error('Year must be 1950 or later')

  const { circuits, source } = await fetchSeasonCircuits(year)

  let circuitsImported = 0
  let circuitsUpdated = 0
  const failedCircuits: Array<{ circuitId: string; reason: string }> = []

  for (let index = 0; index < circuits.length; index += 1) {
    const circuit = circuits[index]
    onProgress?.({
      total: circuits.length,
      processed: index + 1,
      message: `Importing circuit ${circuit.circuitId}`,
    })

    try {
      const existed = await rowExists('circuits', 'api_circuit_id', circuit.circuitId)
      await upsertCircuit(circuit)
      if (existed) circuitsUpdated += 1
      else circuitsImported += 1
    } catch (error) {
      failedCircuits.push({
        circuitId: circuit.circuitId,
        reason: error instanceof Error ? error.message : 'Unknown circuit error',
      })
    }
  }

  return { source, year, circuitsImported, circuitsUpdated, failedCircuits }
}

export async function importRacesByYear(
  year: number,
  onProgress?: (progress: ImportProgress) => void,
): Promise<RacesImportSummary> {
  await ensureAdminSession()
  if (!Number.isInteger(year) || year < 1950) throw new Error('Year must be 1950 or later')

  const { races, source } = await fetchSeasonRaces(year)
  const seasonId = await ensureSeason(year)

  let racesImported = 0
  let racesUpdated = 0
  const failedRaces: Array<{ round: number; reason: string }> = []

  for (let index = 0; index < races.length; index += 1) {
    const race = races[index]
    const round = Number(race.round)

    onProgress?.({
      total: races.length,
      processed: index + 1,
      message: `Importing round ${round}: ${race.raceName}`,
    })

    try {
      const existed = await rowExists('races', 'api_race_id', `${race.season}-${round}`)
      await upsertCircuit(race.Circuit)

      const { data: circuitRow, error: circuitErr } = await supabaseClient
        .from('circuits')
        .select('id')
        .eq('api_circuit_id', race.Circuit.circuitId)
        .maybeSingle()
      if (circuitErr || !circuitRow?.id) throw new Error(circuitErr?.message ?? 'Circuit lookup failed')

      await upsertRace(race, seasonId, circuitRow.id)
      if (existed) racesUpdated += 1
      else racesImported += 1
    } catch (error) {
      failedRaces.push({
        round,
        reason: error instanceof Error ? error.message : 'Unknown race error',
      })
    }
  }

  return { source, year, racesImported, racesUpdated, failedRaces }
}
