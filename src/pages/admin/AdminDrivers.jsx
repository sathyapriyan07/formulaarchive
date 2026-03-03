import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminDrivers() {
  const { isAdmin } = useAuth()
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({ name: '', number: '', dob: '', image_url: '' })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    if (isAdmin) fetchDrivers()
  }, [isAdmin])

  const fetchDrivers = async () => {
    const { data } = await supabase.from('drivers').select('*').order('name')
    setDrivers(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('drivers').update(form).eq('id', editId)
    } else {
      await supabase.from('drivers').insert(form)
    }
    setForm({ name: '', number: '', dob: '', image_url: '' })
    setEditId(null)
    fetchDrivers()
  }

  const handleEdit = (driver) => {
    setForm(driver)
    setEditId(driver.id)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this driver?')) {
      await supabase.from('drivers').delete().eq('id', id)
      fetchDrivers()
    }
  }

  if (!isAdmin) return <div>Access Denied</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-f1-red">Manage Drivers</h1>
      
      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            placeholder="Driver Name"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="number"
            value={form.number}
            onChange={(e) => setForm({...form, number: e.target.value})}
            placeholder="Driver Number"
            className="w-full px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <input
            type="date"
            value={form.dob}
            onChange={(e) => setForm({...form, dob: e.target.value})}
            placeholder="Date of Birth"
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
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Driver</button>
            {editId && (
              <button type="button" onClick={() => { setForm({ name: '', number: '', dob: '', image_url: '' }); setEditId(null); }} className="btn-secondary">
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
              <th className="text-left p-2">Number</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver.id} className="border-b border-f1-gray">
                <td className="p-2">{driver.name}</td>
                <td className="p-2">#{driver.number}</td>
                <td className="text-right p-2 space-x-2">
                  <button onClick={() => handleEdit(driver)} className="text-blue-500">Edit</button>
                  <button onClick={() => handleDelete(driver.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
