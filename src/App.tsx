import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import MainLayout from './layouts/MainLayout'
import LoadingSkeleton from './components/common/LoadingSkeleton'

const HomePage = lazy(() => import('./pages/HomePage'))
const SeasonsPage = lazy(() => import('./pages/SeasonsPage'))
const SeasonDetailPage = lazy(() => import('./pages/SeasonDetailPage'))
const TeamsPage = lazy(() => import('./pages/TeamsPage'))
const TeamDetailPage = lazy(() => import('./pages/TeamDetailPage'))
const DriversPage = lazy(() => import('./pages/DriversPage'))
const DriverDetailPage = lazy(() => import('./pages/DriverDetailPage'))
const CircuitsPage = lazy(() => import('./pages/CircuitsPage'))
const CircuitDetailPage = lazy(() => import('./pages/CircuitDetailPage'))
const RacesPage = lazy(() => import('./pages/RacesPage'))
const RaceDetailPage = lazy(() => import('./pages/RaceDetailPage'))
const ResultDetailPage = lazy(() => import('./pages/ResultDetailPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminSeasons = lazy(() => import('./pages/admin/AdminSeasons'))
const AdminTeams = lazy(() => import('./pages/admin/AdminTeams'))
const AdminDrivers = lazy(() => import('./pages/admin/AdminDrivers'))
const AdminCircuits = lazy(() => import('./pages/admin/AdminCircuits'))
const AdminRaces = lazy(() => import('./pages/admin/AdminRaces'))
const AdminResults = lazy(() => import('./pages/admin/AdminResults'))
const AdminImport = lazy(() => import('./pages/admin/AdminImport'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSkeleton count={3} className="h-32 mb-4" />}>
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
              <Route path="admin/import" element={<AdminImport />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
