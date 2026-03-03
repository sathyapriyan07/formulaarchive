import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import SeasonsPage from './pages/SeasonsPage'
import SeasonDetailPage from './pages/SeasonDetailPage'
import TeamsPage from './pages/TeamsPage'
import TeamDetailPage from './pages/TeamDetailPage'
import DriversPage from './pages/DriversPage'
import DriverDetailPage from './pages/DriverDetailPage'
import CircuitsPage from './pages/CircuitsPage'
import CircuitDetailPage from './pages/CircuitDetailPage'
import RacesPage from './pages/RacesPage'
import RaceDetailPage from './pages/RaceDetailPage'
import ResultDetailPage from './pages/ResultDetailPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import AdminSeasons from './pages/admin/AdminSeasons'
import AdminTeams from './pages/admin/AdminTeams'
import AdminDrivers from './pages/admin/AdminDrivers'
import AdminCircuits from './pages/admin/AdminCircuits'
import AdminRaces from './pages/admin/AdminRaces'
import AdminResults from './pages/admin/AdminResults'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="seasons" element={<SeasonsPage />} />
            <Route path="seasons/:year" element={<SeasonDetailPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="teams/:id" element={<TeamDetailPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="drivers/:id" element={<DriverDetailPage />} />
            <Route path="circuits" element={<CircuitsPage />} />
            <Route path="circuits/:id" element={<CircuitDetailPage />} />
            <Route path="races" element={<RacesPage />} />
            <Route path="races/:id" element={<RaceDetailPage />} />
            <Route path="results/:id" element={<ResultDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/seasons" element={<AdminSeasons />} />
            <Route path="admin/teams" element={<AdminTeams />} />
            <Route path="admin/drivers" element={<AdminDrivers />} />
            <Route path="admin/circuits" element={<AdminCircuits />} />
            <Route path="admin/races" element={<AdminRaces />} />
            <Route path="admin/results" element={<AdminResults />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
