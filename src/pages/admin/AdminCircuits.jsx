import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminCircuits() {
  const { isAdmin } = useAuth()
  const [circuits, setCircuits] = useState([])
  const [form, setForm] = useState({ name: '', country: '', length: '', first_race_year: '', image_url: '' })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    if (isAdmin) fetchCircuits()
  }, [isAdmin])

  const fetchCircuits = async () => {
    const { data } = await supabase.from('circuits').select('*').order('name')
    setCircuits(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('circuits').update(form).eq('id', editId)
    } else {
      await supabase.from('circuits').insert(form)
    }
    setForm({ name: '', country: '', length: '', first_race_year: '', image_url: '' })
    setEditId(null)
    fetchCircuits()
  }

  const handleEdit = (circuit) => {
    setForm(circuit)
    setEditId(circuit.id)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this circuit?')) {
      await supabase.from('circuits').delete().eq('id', id)
      fetchCircuits()
    }
  }

  if (!isAdmin) return <div>Access Denied</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-f1-red">Manage Circuits</h1>
      
      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            placeholder="Circuit Name"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="text"
            value={form.country}
            onChange={(e) => setForm({...form, country: e.target.value})}
            placeholder="Country"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="number"
            step="0.001"
            value={form.length}
            onChange={(e) => setForm({...form, length: e.target.value})}
            placeholder="Length (km)"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
          />
          <input
            type="number"
            value={form.first_race_year}
            onChange={(e) => setForm({...form, first_race_year: e.target.value})}
            placeholder="First Race Year"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
          />
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => setForm({...form, image_url: e.target.value})}
            placeholder="Image URL"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <div className="flex gap-4">
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Circuit</button>
            {editId && (
              <button type="button" onClick={() => { setForm({ name: '', country: '', length: '', first_race_year: '', image_url: '' }); setEditId(null); }} className="btn-secondary">
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
              <th className="text-left p-2">Country</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {circuits.map(circuit => (
              <tr key={circuit.id} className="border-b border-f1-gray">
                <td className="p-2">{circuit.name}</td>
                <td className="p-2">{circuit.country}</td>
                <td className="text-right p-2 space-x-2">
                  <button onClick={() => handleEdit(circuit)} className="text-blue-500">Edit</button>
                  <button onClick={() => handleDelete(circuit.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
