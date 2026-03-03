# API Documentation - Supabase Queries

## Overview

This document provides examples of all Supabase queries used in the application.

## Authentication

### Sign Up
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign Out
```javascript
await supabase.auth.signOut()
```

### Get Session
```javascript
const { data: { session } } = await supabase.auth.getSession()
```

### Check User Role
```javascript
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single()
```

## Seasons

### Get All Seasons
```javascript
const { data } = await supabase
  .from('seasons')
  .select('*')
  .order('year', { ascending: false })
```

### Get Single Season
```javascript
const { data } = await supabase
  .from('seasons')
  .select('*')
  .eq('year', 2024)
  .single()
```

### Create Season
```javascript
const { data, error } = await supabase
  .from('seasons')
  .insert({ year: 2024 })
```

### Delete Season
```javascript
await supabase
  .from('seasons')
  .delete()
  .eq('year', 2024)
```

## Teams

### Get All Teams
```javascript
const { data } = await supabase
  .from('teams')
  .select('*')
  .order('is_active', { ascending: false })
  .order('name', { ascending: true })
```

### Get Single Team
```javascript
const { data } = await supabase
  .from('teams')
  .select('*')
  .eq('id', teamId)
  .single()
```

### Create Team
```javascript
const { data, error } = await supabase
  .from('teams')
  .insert({
    name: 'Red Bull Racing',
    logo_url: 'https://example.com/logo.png',
    car_image_url: 'https://example.com/car.png',
    is_active: true,
    championships: 6
  })
```

### Update Team
```javascript
await supabase
  .from('teams')
  .update({ championships: 7 })
  .eq('id', teamId)
```

### Delete Team
```javascript
await supabase
  .from('teams')
  .delete()
  .eq('id', teamId)
```

## Drivers

### Get All Drivers
```javascript
const { data } = await supabase
  .from('drivers')
  .select('*')
  .order('name', { ascending: true })
```

### Get Single Driver
```javascript
const { data } = await supabase
  .from('drivers')
  .select('*')
  .eq('id', driverId)
  .single()
```

### Create Driver
```javascript
const { data, error } = await supabase
  .from('drivers')
  .insert({
    name: 'Max Verstappen',
    number: '1',
    dob: '1997-09-30',
    image_url: 'https://example.com/driver.png'
  })
```

### Update Driver
```javascript
await supabase
  .from('drivers')
  .update({ number: '33' })
  .eq('id', driverId)
```

### Delete Driver
```javascript
await supabase
  .from('drivers')
  .delete()
  .eq('id', driverId)
```

## Circuits

### Get All Circuits
```javascript
const { data } = await supabase
  .from('circuits')
  .select('*')
  .order('name', { ascending: true })
```

### Get Single Circuit
```javascript
const { data } = await supabase
  .from('circuits')
  .select('*')
  .eq('id', circuitId)
  .single()
```

### Create Circuit
```javascript
const { data, error } = await supabase
  .from('circuits')
  .insert({
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    length: 5.891,
    first_race_year: 1950,
    image_url: 'https://example.com/circuit.png'
  })
```

### Update Circuit
```javascript
await supabase
  .from('circuits')
  .update({ length: 5.900 })
  .eq('id', circuitId)
```

### Delete Circuit
```javascript
await supabase
  .from('circuits')
  .delete()
  .eq('id', circuitId)
```

## Races

### Get All Races
```javascript
const { data } = await supabase
  .from('races')
  .select('*, circuits(*)')
  .order('date', { ascending: false })
```

### Get Races by Season
```javascript
const { data } = await supabase
  .from('races')
  .select('*, circuits(*)')
  .eq('season_id', 2024)
  .order('round', { ascending: true })
```

### Get Next Race
```javascript
const { data } = await supabase
  .from('races')
  .select('*, circuits(*)')
  .eq('season_id', currentYear)
  .gte('date', new Date().toISOString())
  .order('date', { ascending: true })
  .limit(1)
```

### Get Single Race
```javascript
const { data } = await supabase
  .from('races')
  .select('*, circuits(*)')
  .eq('id', raceId)
  .single()
```

### Create Race
```javascript
const { data, error } = await supabase
  .from('races')
  .insert({
    name: 'British Grand Prix',
    season_id: 2024,
    circuit_id: circuitId,
    date: '2024-07-07',
    round: 10,
    status: 'upcoming'
  })
```

### Update Race Status
```javascript
await supabase
  .from('races')
  .update({ status: 'completed' })
  .eq('id', raceId)
```

### Delete Race
```javascript
await supabase
  .from('races')
  .delete()
  .eq('id', raceId)
```

## Race Results

### Get Results by Race
```javascript
const { data } = await supabase
  .from('race_results')
  .select('*, drivers(*), teams(*)')
  .eq('race_id', raceId)
  .order('position', { ascending: true })
```

### Get Podium (Top 3)
```javascript
const { data } = await supabase
  .from('race_results')
  .select('*, drivers(*), teams(*)')
  .eq('race_id', raceId)
  .order('position', { ascending: true })
  .limit(3)
```

### Create Result
```javascript
const { data, error } = await supabase
  .from('race_results')
  .insert({
    race_id: raceId,
    driver_id: driverId,
    team_id: teamId,
    position: 1,
    laps: 58,
    time: '1:32:15.123',
    status: 'Finished'
  })
```

### Update Result
```javascript
await supabase
  .from('race_results')
  .update({ position: 2 })
  .eq('id', resultId)
```

### Delete Result
```javascript
await supabase
  .from('race_results')
  .delete()
  .eq('id', resultId)
```

## Driver Season Stats

### Get Driver Standings by Season
```javascript
const { data } = await supabase
  .from('driver_season_stats')
  .select('*, drivers(*), teams(*)')
  .eq('season_id', 2024)
  .order('points', { ascending: false })
```

### Get Top 5 Drivers
```javascript
const { data } = await supabase
  .from('driver_season_stats')
  .select('*, drivers(*), teams(*)')
  .eq('season_id', currentYear)
  .order('points', { ascending: false })
  .limit(5)
```

### Get Driver Stats by Driver
```javascript
const { data } = await supabase
  .from('driver_season_stats')
  .select('*, teams(*)')
  .eq('driver_id', driverId)
  .order('season_id', { ascending: false })
```

### Get Current Team for Driver
```javascript
const { data } = await supabase
  .from('driver_season_stats')
  .select('*, teams(*)')
  .eq('driver_id', driverId)
  .eq('season_id', currentYear)
  .single()
```

### Create Driver Season Stats
```javascript
const { data, error } = await supabase
  .from('driver_season_stats')
  .insert({
    driver_id: driverId,
    team_id: teamId,
    season_id: 2024,
    position: 1,
    points: 575,
    wins: 19,
    podiums: 21,
    poles: 8,
    dnfs: 1
  })
```

### Update Driver Season Stats
```javascript
await supabase
  .from('driver_season_stats')
  .update({ points: 600, wins: 20 })
  .eq('id', statId)
```

## Team Season Stats

### Get Team Standings by Season
```javascript
const { data } = await supabase
  .from('team_season_stats')
  .select('*, teams(*)')
  .eq('season_id', 2024)
  .order('points', { ascending: false })
```

### Get Top 5 Teams
```javascript
const { data } = await supabase
  .from('team_season_stats')
  .select('*, teams(*)')
  .eq('season_id', currentYear)
  .order('points', { ascending: false })
  .limit(5)
```

### Get Team Stats by Team
```javascript
const { data } = await supabase
  .from('team_season_stats')
  .select('*')
  .eq('team_id', teamId)
  .order('season_id', { ascending: false })
```

### Create Team Season Stats
```javascript
const { data, error } = await supabase
  .from('team_season_stats')
  .insert({
    team_id: teamId,
    season_id: 2024,
    position: 1,
    points: 860
  })
```

### Update Team Season Stats
```javascript
await supabase
  .from('team_season_stats')
  .update({ points: 900 })
  .eq('id', statId)
```

## Complex Queries

### Get Current Drivers for Team
```javascript
const { data } = await supabase
  .from('driver_season_stats')
  .select('*, drivers(*)')
  .eq('team_id', teamId)
  .eq('season_id', currentYear)
```

### Get Past Drivers for Team (Unique)
```javascript
const { data } = await supabase
  .from('driver_season_stats')
  .select('driver_id, drivers(*)')
  .eq('team_id', teamId)
  .neq('season_id', currentYear)

// Remove duplicates in JavaScript
const uniquePast = [...new Map(data?.map(item => [item.driver_id, item]) || []).values()]
```

### Get Races at Circuit
```javascript
const { data } = await supabase
  .from('races')
  .select('*')
  .eq('circuit_id', circuitId)
  .order('date', { ascending: false })
```

### Get Completed Races for Season
```javascript
const { data } = await supabase
  .from('races')
  .select('*, circuits(*)')
  .eq('season_id', 2024)
  .eq('status', 'completed')
  .order('round', { ascending: true })
```

## Error Handling

Always handle errors in your queries:

```javascript
const { data, error } = await supabase
  .from('drivers')
  .select('*')

if (error) {
  console.error('Error fetching drivers:', error)
  // Handle error appropriately
  return
}

// Use data
console.log(data)
```

## Real-time Subscriptions (Optional)

Subscribe to changes:

```javascript
const subscription = supabase
  .channel('races')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'races' },
    (payload) => {
      console.log('Change received!', payload)
      // Update UI
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

## Performance Tips

1. **Select only needed columns**
```javascript
.select('id, name, points')  // Instead of .select('*')
```

2. **Use indexes** (already created in schema)

3. **Limit results when appropriate**
```javascript
.limit(10)
```

4. **Use single() for single records**
```javascript
.single()  // Returns object instead of array
```

5. **Batch operations when possible**
```javascript
.insert([item1, item2, item3])  // Instead of multiple inserts
```

## Testing Queries

Use Supabase SQL Editor to test queries:

```sql
SELECT * FROM drivers WHERE name LIKE '%Max%';
SELECT * FROM races WHERE season_id = 2024 ORDER BY round;
SELECT d.name, t.name, dss.points 
FROM driver_season_stats dss
JOIN drivers d ON d.id = dss.driver_id
JOIN teams t ON t.id = dss.team_id
WHERE dss.season_id = 2024
ORDER BY dss.points DESC;
```
