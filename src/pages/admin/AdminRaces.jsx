import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminRaces() {
  const { isAdmin } = useAuth()
  const [races, setRaces] = useState([])
  const [circuits, setCircuits] = useState([])
  const [seasons, setSeasons] = useState([])
  const [form, setForm] = useState({ name: '', season_id: '', circuit_id: '', date: '', round: '', status: 'upcoming' })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      fetchRaces()
      fetchCircuits()
      fetchSeasons()
    }
  }, [isAdmin])

  const fetchRaces = async () => {
    const { data } = await supabase.from('races').select('*, circuits(name)').order('date', { ascending: false })
    setRaces(data || [])
  }

  const fetchCircuits = async () => {
    const { data } = await supabase.from('circuits').select('*').order('name')
    setCircuits(data || [])
  }

  const fetchSeasons = async () => {
    const { data } = await supabase.from('seasons').select('*').order('year', { ascending: false })
    setSeasons(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('races').update(form).eq('id', editId)
    } else {
      await supabase.from('races').insert(form)
    }
    setForm({ name: '', season_id: '', circuit_id: '', date: '', round: '', status: 'upcoming' })
    setEditId(null)
    fetchRaces()
  }

  const handleEdit = (race) => {
    setForm({ name: race.name, season_id: race.season_id, circuit_id: race.circuit_id, date: race.date, round: race.round, status: race.status })
    setEditId(race.id)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this race?')) {
      await supabase.from('races').delete().eq('id', id)
      fetchRaces()
    }
  }

  if (!isAdmin) return <div>Access Denied</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-f1-red">Manage Races</h1>
      
      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            placeholder="Race Name"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <select
            value={form.season_id}
            onChange={(e) => setForm({...form, season_id: e.target.value})}
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          >
            <option value="">Select Season</option>
            {seasons.map(s => <option key={s.year} value={s.year}>{s.year}</option>)}
          </select>
          <select
            value={form.circuit_id}
            onChange={(e) => setForm({...form, circuit_id: e.target.value})}
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          >
            <option value="">Select Circuit</option>
            {circuits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({...form, date: e.target.value})}
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="number"
            value={form.round}
            onChange={(e) => setForm({...form, round: e.target.value})}
            placeholder="Round"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <select
            value={form.status}
            onChange={(e) => setForm({...form, status: e.target.value})}
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
          >
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
          <div className="flex gap-4">
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Race</button>
            {editId && (
              <button type="button" onClick={() => { setForm({ name: '', season_id: '', circuit_id: '', date: '', round: '', status: 'upcoming' }); setEditId(null); }} className="btn-secondary">
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
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Circuit</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Status</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {races.map(race => (
              <tr key={race.id} className="border-b border-f1-gray">
                <td className="p-2">{race.name}</td>
                <td className="p-2">{race.circuits?.name}</td>
                <td className="p-2">{new Date(race.date).toLocaleDateString()}</td>
                <td className="p-2">{race.status}</td>
                <td className="text-right p-2 space-x-2">
                  <button onClick={() => handleEdit(race)} className="text-blue-500">Edit</button>
                  <button onClick={() => handleDelete(race.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
