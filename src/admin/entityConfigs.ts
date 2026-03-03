export type AdminEntityKey =
  | 'seasons'
  | 'teams'
  | 'drivers'
  | 'circuits'
  | 'races'
  | 'race_results'
  | 'driver_season_stats'
  | 'team_season_stats'
  | 'driver_team_assignments'

export type AdminFieldType = 'text' | 'number' | 'date' | 'checkbox' | 'select'

export interface AdminFieldConfig {
  key: string
  label: string
  type: AdminFieldType
  required?: boolean
  readOnlyOnCreate?: boolean
  readOnlyOnEdit?: boolean
  searchable?: boolean
  options?: Array<{ label: string; value: string | number }>
  relation?: {
    table: string
    valueKey: string
    labelKey: string
  }
}

export interface AdminEntityConfig {
  key: AdminEntityKey
  title: string
  table: AdminEntityKey
  keyField: string
  defaultSort: string
  fields: AdminFieldConfig[]
  searchFields: string[]
  filters?: Array<{ key: string; label: string; options: Array<{ label: string; value: string }> }>
}

export const ADMIN_ENTITY_CONFIGS: Record<AdminEntityKey, AdminEntityConfig> = {
  seasons: {
    key: 'seasons',
    title: 'Manage Seasons',
    table: 'seasons',
    keyField: 'year',
    defaultSort: 'year',
    searchFields: ['year'],
    fields: [
      { key: 'year', label: 'Year', type: 'number', required: true },
      { key: 'champion_driver_id', label: 'Champion Driver', type: 'select', relation: { table: 'drivers', valueKey: 'id', labelKey: 'name' } },
      { key: 'champion_team_id', label: 'Champion Team', type: 'select', relation: { table: 'teams', valueKey: 'id', labelKey: 'name' } },
    ],
  },
  teams: {
    key: 'teams',
    title: 'Manage Teams',
    table: 'teams',
    keyField: 'id',
    defaultSort: 'created_at',
    searchFields: ['name', 'api_constructor_id'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'api_constructor_id', label: 'API Constructor ID', type: 'text' },
      { key: 'logo_url', label: 'Logo URL', type: 'text', required: true },
      { key: 'car_image_url', label: 'Car Image URL', type: 'text' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
      { key: 'championships', label: 'Championships', type: 'number' },
    ],
  },
  drivers: {
    key: 'drivers',
    title: 'Manage Drivers',
    table: 'drivers',
    keyField: 'id',
    defaultSort: 'created_at',
    searchFields: ['name', 'number', 'nationality', 'api_driver_id'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'api_driver_id', label: 'API Driver ID', type: 'text' },
      { key: 'number', label: 'Number', type: 'text', required: true },
      { key: 'dob', label: 'Date of Birth', type: 'date' },
      { key: 'nationality', label: 'Nationality', type: 'text' },
      { key: 'image_url', label: 'Image URL', type: 'text', required: true },
      { key: 'championships', label: 'Championships', type: 'number' },
    ],
  },
  circuits: {
    key: 'circuits',
    title: 'Manage Circuits',
    table: 'circuits',
    keyField: 'id',
    defaultSort: 'created_at',
    searchFields: ['name', 'country', 'api_circuit_id'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'api_circuit_id', label: 'API Circuit ID', type: 'text' },
      { key: 'country', label: 'Country', type: 'text', required: true },
      { key: 'length', label: 'Length (km)', type: 'number' },
      { key: 'first_race_year', label: 'First Race Year', type: 'number' },
      { key: 'image_url', label: 'Layout Image URL', type: 'text', required: true },
    ],
  },
  races: {
    key: 'races',
    title: 'Manage Races',
    table: 'races',
    keyField: 'id',
    defaultSort: 'date',
    searchFields: ['name', 'api_race_id'],
    filters: [{ key: 'status', label: 'Status', options: [{ label: 'All', value: '' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Completed', value: 'completed' }] }],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'api_race_id', label: 'API Race ID', type: 'text' },
      { key: 'season_id', label: 'Season', type: 'select', required: true, relation: { table: 'seasons', valueKey: 'year', labelKey: 'year' } },
      { key: 'circuit_id', label: 'Circuit', type: 'select', required: true, relation: { table: 'circuits', valueKey: 'id', labelKey: 'name' } },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'round', label: 'Round', type: 'number', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: [{ label: 'upcoming', value: 'upcoming' }, { label: 'completed', value: 'completed' }] },
    ],
  },
  race_results: {
    key: 'race_results',
    title: 'Manage Results',
    table: 'race_results',
    keyField: 'id',
    defaultSort: 'position',
    searchFields: ['status', 'time'],
    filters: [{ key: 'status', label: 'Status', options: [{ label: 'All', value: '' }, { label: 'Finished', value: 'Finished' }, { label: 'DNF', value: 'DNF' }, { label: 'DSQ', value: 'DSQ' }] }],
    fields: [
      { key: 'race_id', label: 'Race', type: 'select', required: true, relation: { table: 'races', valueKey: 'id', labelKey: 'name' } },
      { key: 'driver_id', label: 'Driver', type: 'select', required: true, relation: { table: 'drivers', valueKey: 'id', labelKey: 'name' } },
      { key: 'team_id', label: 'Team', type: 'select', required: true, relation: { table: 'teams', valueKey: 'id', labelKey: 'name' } },
      { key: 'position', label: 'Position', type: 'number', required: true },
      { key: 'laps', label: 'Laps', type: 'number', required: true },
      { key: 'time', label: 'Time', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', required: true, options: [{ label: 'Finished', value: 'Finished' }, { label: 'DNF', value: 'DNF' }, { label: 'DSQ', value: 'DSQ' }] },
    ],
  },
  driver_season_stats: {
    key: 'driver_season_stats',
    title: 'Manage Driver Season Stats',
    table: 'driver_season_stats',
    keyField: 'id',
    defaultSort: 'points',
    searchFields: ['position', 'points'],
    fields: [
      { key: 'season_id', label: 'Season', type: 'select', required: true, relation: { table: 'seasons', valueKey: 'year', labelKey: 'year' } },
      { key: 'driver_id', label: 'Driver', type: 'select', required: true, relation: { table: 'drivers', valueKey: 'id', labelKey: 'name' } },
      { key: 'team_id', label: 'Team', type: 'select', required: true, relation: { table: 'teams', valueKey: 'id', labelKey: 'name' } },
      { key: 'position', label: 'Position', type: 'number' },
      { key: 'points', label: 'Points', type: 'number' },
      { key: 'wins', label: 'Wins', type: 'number' },
      { key: 'podiums', label: 'Podiums', type: 'number' },
      { key: 'poles', label: 'Poles', type: 'number' },
      { key: 'dnfs', label: 'DNFs', type: 'number' },
    ],
  },
  team_season_stats: {
    key: 'team_season_stats',
    title: 'Manage Team Season Stats',
    table: 'team_season_stats',
    keyField: 'id',
    defaultSort: 'points',
    searchFields: ['position', 'points'],
    fields: [
      { key: 'season_id', label: 'Season', type: 'select', required: true, relation: { table: 'seasons', valueKey: 'year', labelKey: 'year' } },
      { key: 'team_id', label: 'Team', type: 'select', required: true, relation: { table: 'teams', valueKey: 'id', labelKey: 'name' } },
      { key: 'position', label: 'Position', type: 'number' },
      { key: 'points', label: 'Points', type: 'number' },
    ],
  },
  driver_team_assignments: {
    key: 'driver_team_assignments',
    title: 'Driver-Team Assignments',
    table: 'driver_team_assignments',
    keyField: 'id',
    defaultSort: 'created_at',
    searchFields: ['is_primary'],
    fields: [
      { key: 'season_id', label: 'Season', type: 'select', required: true, relation: { table: 'seasons', valueKey: 'year', labelKey: 'year' } },
      { key: 'driver_id', label: 'Driver', type: 'select', required: true, relation: { table: 'drivers', valueKey: 'id', labelKey: 'name' } },
      { key: 'team_id', label: 'Team', type: 'select', required: true, relation: { table: 'teams', valueKey: 'id', labelKey: 'name' } },
      { key: 'is_primary', label: 'Primary', type: 'checkbox' },
    ],
  },
}
