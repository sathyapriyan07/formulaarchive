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
const RaceDetailPage = lazy(() => import('./pages/RaceDetailPage'))
const ResultDetailPage = lazy(() => import('./pages/ResultDetailPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

const AdminShell = lazy(() => import('./pages/admin/AdminShell'))
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'))
const AdminEntityPage = lazy(() => import('./pages/admin/AdminEntityPage'))
const AdminStandingsPage = lazy(() => import('./pages/admin/AdminStandingsPage'))
const AdminRecalculatePage = lazy(() => import('./pages/admin/AdminRecalculatePage'))
const AdminIntegrityPage = lazy(() => import('./pages/admin/AdminIntegrityPage'))
const AdminSystemLogsPage = lazy(() => import('./pages/admin/AdminSystemLogsPage'))
const AdminOpenF1ImportPage = lazy(() => import('./pages/admin/AdminOpenF1ImportPage'))
const AdminSeasonImportPage = lazy(() => import('./pages/admin/AdminSeasonImportPage'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSkeleton count={3} className="mb-4 h-32" />}>
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
              <Route path="races/:id" element={<RaceDetailPage />} />
              <Route path="results/:id" element={<ResultDetailPage />} />
              <Route path="seasons/:year/races/:id" element={<RaceDetailPage />} />
              <Route path="seasons/:year/races/:id/results" element={<ResultDetailPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route path="profile" element={<ProfilePage />} />

              <Route path="admin" element={<AdminShell />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="seasons" element={<AdminEntityPage entityKey="seasons" />} />
                <Route path="teams" element={<AdminEntityPage entityKey="teams" />} />
                <Route path="drivers" element={<AdminEntityPage entityKey="drivers" />} />
                <Route path="circuits" element={<AdminEntityPage entityKey="circuits" />} />
                <Route path="races" element={<AdminEntityPage entityKey="races" />} />
                <Route path="results" element={<AdminEntityPage entityKey="race_results" />} />
                <Route path="standings" element={<AdminStandingsPage />} />
                <Route path="assignments" element={<AdminEntityPage entityKey="driver_team_assignments" />} />
                <Route path="season-import" element={<AdminSeasonImportPage />} />
                <Route path="openf1-import" element={<AdminOpenF1ImportPage />} />
                <Route path="recalculate" element={<AdminRecalculatePage />} />
                <Route path="integrity" element={<AdminIntegrityPage />} />
                <Route path="logs" element={<AdminSystemLogsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
