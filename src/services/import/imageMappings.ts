const TEAM_LOGO_BY_CONSTRUCTOR: Record<string, string> = {
  red_bull: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Red_Bull_Racing_logo.svg',
  mercedes: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
  ferrari: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Scuderia_Ferrari_Logo.svg',
  mclaren: 'https://upload.wikimedia.org/wikipedia/en/4/4f/McLaren_Racing_logo.svg',
  aston_martin: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Aston_Martin_Aramco_F1_Team_Logo.svg',
  alpine: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Logo_of_BWT_Alpine_F1_Team.svg',
  rb: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Scuderia_AlphaTauri.svg',
  alphatauri: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Scuderia_AlphaTauri.svg',
  williams: 'https://upload.wikimedia.org/wikipedia/en/9/91/Williams_Grand_Prix_Engineering_logo.svg',
  sauber: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Stake_F1_Team_Kick_Sauber_logo.svg',
  alfa: 'https://upload.wikimedia.org/wikipedia/en/4/45/Alfa_Romeo_Racing_logo.svg',
  haas: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Haas_F1_Team_logo.svg',
  renault: 'https://upload.wikimedia.org/wikipedia/en/0/05/Renault_Sport_Formula_One_Team_logo.png',
}

const TEAM_CAR_BY_CONSTRUCTOR: Record<string, string> = {
  red_bull: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=1600&q=80',
  mercedes: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=80',
  ferrari: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
  mclaren: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80',
}

const DRIVER_IMAGE_BY_ID: Record<string, string> = {
  max_verstappen: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Max_Verstappen_2017_Malaysia_3.jpg',
  leclerc: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Charles_Leclerc_2019_Singapore_Grand_Prix.jpg',
  sainz: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Carlos_Sainz_Jr._2018.jpg',
  hamilton: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Lewis_Hamilton_2016_Malaysia_2.jpg',
  russell: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/George_Russell_2019_Formula_One_testing_Barcelona.jpg',
  norris: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Lando_Norris_2019_Formula_One_testing_Barcelona.jpg',
  piastri: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Oscar_Piastri_2022.jpg',
  alonso: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Fernando_Alonso_2016_Malaysia_2.jpg',
}

function encoded(value: string) {
  return encodeURIComponent(value.trim())
}

export function getTeamLogoUrl(constructorId: string, teamName: string) {
  return (
    TEAM_LOGO_BY_CONSTRUCTOR[constructorId] ??
    `https://ui-avatars.com/api/?name=${encoded(teamName)}&background=E10600&color=ffffff&size=256&bold=true`
  )
}

export function getTeamCarImageUrl(constructorId: string, teamName: string) {
  return (
    TEAM_CAR_BY_CONSTRUCTOR[constructorId] ??
    `https://ui-avatars.com/api/?name=${encoded(teamName)}+Car&background=15151E&color=ffffff&size=1024&bold=true`
  )
}

export function getDriverImageUrl(driverId: string, fullName: string) {
  return (
    DRIVER_IMAGE_BY_ID[driverId] ??
    `https://ui-avatars.com/api/?name=${encoded(fullName)}&background=0D0D11&color=ffffff&size=512&bold=true`
  )
}

export function getCircuitImageUrl(circuitId: string, circuitName: string) {
  return `https://ui-avatars.com/api/?name=${encoded(circuitName)}&background=38383F&color=ffffff&size=1024&bold=true&format=svg`
}
