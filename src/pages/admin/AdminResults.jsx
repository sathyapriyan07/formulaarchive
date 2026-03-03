import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminResults() {
  const { isAdmin } = useAuth()
  const [results, setResults] = useState([])
  const [races, setRaces] = useState([])
  const [drivers, setDrivers] = useState([])
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState({ race_id: '', driver_id: '', team_id: '', position: '', laps: '', time: '', status: 'Finished' })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      fetchResults()
      fetchRaces()
      fetchDrivers()
      fetchTeams()
    }
  }, [isAdmin])

  const fetchResults = async () => {
    const { data } = await supabase.from('race_results').select('*, races(name), drivers(name), teams(name)').order('race_id', { ascending: false })
    setResults(data || [])
  }

  const fetchRaces = async () => {
    const { data } = await supabase.from('races').select('*').order('date', { ascending: false })
    setRaces(data || [])
  }

  const fetchDrivers = async () => {
    const { data } = await supabase.from('drivers').select('*').order('name')
    setDrivers(data || [])
  }

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('name')
    setTeams(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('race_results').update(form).eq('id', editId)
    } else {
      await supabase.from('race_results').insert(form)
    }
    setForm({ race_id: '', driver_id: '', team_id: '', position: '', laps: '', time: '', status: 'Finished' })
    setEditId(null)
    fetchResults()
  }

  const handleEdit = (result) => {
    setForm({ race_id: result.race_id, driver_id: result.driver_id, team_id: result.team_id, position: result.position, laps: result.laps, time: result.time, status: result.status })
    setEditId(result.id)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this result?')) {
      await supabase.from('race_results').delete().eq('id', id)
      fetchResults()
    }
  }

  if (!isAdmin) return <div>Access Denied</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-f1-red">Manage Results</h1>
      
      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={form.race_id}
            onChange={(e) => setForm({...form, race_id: e.target.value})}
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          >
            <option value="">Select Race</option>
            {races.map(r => <option key={r.id} value={r.id}>{r.name} - {r.season_id}</option>)}
          </select>
          <select
            value={form.driver_id}
            onChange={(e) => setForm({...form, driver_id: e.target.value})}
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          >
            <option value="">Select Driver</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={form.team_id}
            onChange={(e) => setForm({...form, team_id: e.target.value})}
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          >
            <option value="">Select Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input
            type="number"
            value={form.position}
            onChange={(e) => setForm({...form, position: e.target.value})}
            placeholder="Position"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="number"
            value={form.laps}
            onChange={(e) => setForm({...form, laps: e.target.value})}
            placeholder="Laps"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="text"
            value={form.time}
            onChange={(e) => setForm({...form, time: e.target.value})}
            placeholder="Time (e.g., 1:32:15.123)"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({...form, status: e.target.value})}
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
          >
            <option value="Finished">Finished</option>
            <option value="DNF">DNF</option>
            <option value="DSQ">DSQ</option>
          </select>
          <div className="flex gap-4">
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Result</button>
            {editId && (
              <button type="button" onClick={() => { setForm({ race_id: '', driver_id: '', team_id: '', position: '', laps: '', time: '', status: 'Finished' }); setEditId(null); }} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-f1-gray">
              <th className="text-left p-2">Race</th>
              <th className="text-left p-2">Driver</th>
              <th className="text-left p-2">Position</th>
              <th className="text-left p-2">Status</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map(result => (
              <tr key={result.id} className="border-b border-f1-gray">
                <td className="p-2">{result.races?.name}</td>
                <td className="p-2">{result.drivers?.name}</td>
                <td className="p-2">{result.position}</td>
                <td className="p-2">{result.status}</td>
                <td className="text-right p-2 space-x-2">
                  <button onClick={() => handleEdit(result)} className="text-blue-500">Edit</button>
                  <button onClick={() => handleDelete(result.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
