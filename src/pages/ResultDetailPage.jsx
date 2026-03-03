import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function ResultDetailPage() {
  const { id } = useParams()
  const [race, setRace] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: raceData } = await supabase
      .from('races')
      .select('*, circuits(*), seasons(year)')
      .eq('id', id)
      .single()

    setRace(raceData)

    const { data: resultsData } = await supabase
      .from('race_results')
      .select('*, drivers(*), teams(*)')
      .eq('race_id', id)
      .order('position', { ascending: true })

    setResults(resultsData || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={3} className="h-64 mb-4" />

  const podium = results.slice(0, 3)

  return (
    <div>
      <div className="card mb-8">
        <h1 className="text-4xl font-bold mb-2">{race?.name}</h1>
        <p className="text-xl text-gray-400 mb-4">{race?.circuits?.name}</p>
        <img src={race?.circuits?.layout_image_url} alt={race?.circuits?.name} className="w-full h-64 object-cover rounded-lg" />
      </div>

      {podium.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6 text-f1-red">Podium</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {podium[1] && (
              <div className="order-1 md:order-1">
                <div className="bg-gray-600 text-center py-20 rounded-t-lg">
                  <img src={podium[1].drivers?.image_url} alt={podium[1].drivers?.name} className="w-32 h-32 rounded-full object-cover mx-auto mb-4" />
                  <p className="text-6xl font-bold mb-2">2</p>
                  <p className="text-xl font-bold">{podium[1].drivers?.name}</p>
                  <img src={podium[1].teams?.logo_url} alt={podium[1].teams?.name} className="w-12 h-12 object-contain mx-auto mt-2" />
                </div>
              </div>
            )}
            
            {podium[0] && (
              <div className="order-2 md:order-2">
                <div className="bg-yellow-600 text-center py-24 rounded-t-lg">
                  <img src={podium[0].drivers?.image_url} alt={podium[0].drivers?.name} className="w-40 h-40 rounded-full object-cover mx-auto mb-4" />
                  <p className="text-7xl font-bold mb-2">1</p>
                  <p className="text-2xl font-bold">{podium[0].drivers?.name}</p>
                  <img src={podium[0].teams?.logo_url} alt={podium[0].teams?.name} className="w-16 h-16 object-contain mx-auto mt-2" />
                </div>
              </div>
            )}
            
            {podium[2] && (
              <div className="order-3 md:order-3">
                <div className="bg-orange-800 text-center py-16 rounded-t-lg">
                  <img src={podium[2].drivers?.image_url} alt={podium[2].drivers?.name} className="w-28 h-28 rounded-full object-cover mx-auto mb-4" />
                  <p className="text-5xl font-bold mb-2">3</p>
                  <p className="text-lg font-bold">{podium[2].drivers?.name}</p>
                  <img src={podium[2].teams?.logo_url} alt={podium[2].teams?.name} className="w-10 h-10 object-contain mx-auto mt-2" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-f1-red">Full Classification</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-f1-gray">
                <th className="text-left p-2">Pos</th>
                <th className="text-left p-2">Driver</th>
                <th className="text-left p-2">Team</th>
                <th className="text-right p-2">Laps</th>
                <th className="text-right p-2">Points</th>
                <th className="text-right p-2">Time</th>
                <th className="text-right p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map(result => (
                <tr key={result.id} className="border-b border-f1-gray hover:bg-f1-darker">
                  <td className="p-2 font-bold">{result.position}</td>
                  <td className="p-2">
                    <Link to={`/drivers/${result.driver_id}`} className="flex items-center space-x-2 hover:text-f1-red">
                      <img src={result.drivers?.image_url} alt={result.drivers?.name} className="w-10 h-10 rounded-full object-cover" />
                      <span>{result.drivers?.name}</span>
                    </Link>
                  </td>
                  <td className="p-2">
                    <Link to={`/teams/${result.team_id}`} className="flex items-center space-x-2 hover:text-f1-red">
                      <img src={result.teams?.logo_url} alt={result.teams?.name} className="w-6 h-6 object-contain" />
                      <span>{result.teams?.name}</span>
                    </Link>
                  </td>
                  <td className="text-right p-2">{result.laps}</td>
                  <td className="text-right p-2">{result.points ?? 0}</td>
                  <td className="text-right p-2">{result.time || '-'}</td>
                  <td className="text-right p-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.status === 'Finished' ? 'bg-green-600' : 
                      result.status === 'DNF' ? 'bg-red-600' : 'bg-gray-600'
                    }`}>
                      {result.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
