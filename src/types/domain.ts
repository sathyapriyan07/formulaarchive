export type Role = 'user' | 'admin'
export type RaceStatus = 'scheduled' | 'completed' | 'cancelled'
export type ResultStatus = 'Finished' | 'DNF' | 'DSQ' | 'DNS'

export interface Season {
  id: string
  year: number
  champion_driver_id: string | null
  champion_team_id: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  logo_url: string
  car_image_url: string | null
  is_active: boolean
  championships: number
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  name: string
  image_url: string
  dob: string | null
  number: string
  nationality: string | null
  created_at: string
  updated_at: string
}

export interface Circuit {
  id: string
  name: string
  country: string
  length_km: number | null
  first_race_year: number | null
  layout_image_url: string | null
  created_at: string
  updated_at: string
}

export interface Race {
  id: string
  season_id: string
  circuit_id: string
  name: string
  round: number
  date: string
  status: RaceStatus
  created_at: string
  updated_at: string
}

export interface RaceResult {
  id: string
  race_id: string
  driver_id: string
  team_id: string
  position: number
  laps: number
  time: string | null
  status: ResultStatus
  created_at: string
  updated_at: string
}
