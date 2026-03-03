import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminTeams() {
  const { isAdmin } = useAuth()
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState({ name: '', logo_url: '', car_image_url: '', is_active: true, championships: 0 })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    if (isAdmin) fetchTeams()
  }, [isAdmin])

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('name')
    setTeams(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('teams').update(form).eq('id', editId)
    } else {
      await supabase.from('teams').insert(form)
    }
    setForm({ name: '', logo_url: '', car_image_url: '', is_active: true, championships: 0 })
    setEditId(null)
    fetchTeams()
  }

  const handleEdit = (team) => {
    setForm(team)
    setEditId(team.id)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this team?')) {
      await supabase.from('teams').delete().eq('id', id)
      fetchTeams()
    }
  }

  if (!isAdmin) return <div>Access Denied</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-f1-red">Manage Teams</h1>
      
      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            placeholder="Team Name"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="url"
            value={form.logo_url}
            onChange={(e) => setForm({...form, logo_url: e.target.value})}
            placeholder="Logo URL"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="url"
            value={form.car_image_url}
            onChange={(e) => setForm({...form, car_image_url: e.target.value})}
            placeholder="Car Image URL"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
          />
          <input
            type="number"
            value={form.championships}
            onChange={(e) => setForm({...form, championships: parseInt(e.target.value)})}
            placeholder="Championships"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({...form, is_active: e.target.checked})}
            />
            <span>Active Team</span>
          </label>
          <div className="flex gap-4">
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Team</button>
            {editId && (
              <button type="button" onClick={() => { setForm({ name: '', logo_url: '', car_image_url: '', is_active: true, championships: 0 }); setEditId(null); }} className="btn-secondary">
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
              <th className="text-left p-2">Active</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id} className="border-b border-f1-gray">
                <td className="p-2">{team.name}</td>
                <td className="p-2">{team.is_active ? '✓' : '✗'}</td>
                <td className="text-right p-2 space-x-2">
                  <button onClick={() => handleEdit(team)} className="text-blue-500">Edit</button>
                  <button onClick={() => handleDelete(team.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
