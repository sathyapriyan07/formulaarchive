import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminSeasons() {
  const { isAdmin } = useAuth()
  const [seasons, setSeasons] = useState([])
  const [year, setYear] = useState('')
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    if (isAdmin) fetchSeasons()
  }, [isAdmin])

  const fetchSeasons = async () => {
    const { data } = await supabase.from('seasons').select('*').order('year', { ascending: false })
    setSeasons(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('seasons').update({ year }).eq('year', editId)
    } else {
      await supabase.from('seasons').insert({ year })
    }
    setYear('')
    setEditId(null)
    fetchSeasons()
  }

  const handleEdit = (season) => {
    setYear(season.year)
    setEditId(season.year)
  }

  const handleDelete = async (year) => {
    if (confirm('Delete this season?')) {
      await supabase.from('seasons').delete().eq('year', year)
      fetchSeasons()
    }
  }

  if (!isAdmin) return <div>Access Denied</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-f1-red">Manage Seasons</h1>
      
      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year"
            className="flex-1 px-4 py-2 bg-f1-darker border border-f1-gray rounded"
            required
          />
          <button type="submit" className="btn-primary">
            {editId ? 'Update' : 'Add'} Season
          </button>
          {editId && (
            <button type="button" onClick={() => { setYear(''); setEditId(null); }} className="btn-secondary">
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-f1-gray">
              <th className="text-left p-2">Year</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map(season => (
              <tr key={season.year} className="border-b border-f1-gray">
                <td className="p-2">{season.year}</td>
                <td className="text-right p-2 space-x-2">
                  <button onClick={() => handleEdit(season)} className="text-blue-500">Edit</button>
                  <button onClick={() => handleDelete(season.year)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
