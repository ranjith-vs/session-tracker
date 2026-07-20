import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ExercisesPage from './pages/ExercisesPage'
import WorkoutNewPage from './pages/WorkoutNewPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import HistoryPage from './pages/HistoryPage'
import ProgressPage from './pages/ProgressPage'
import NutritionPage from './pages/NutritionPage'
import WeightPage from './pages/WeightPage'
import GuidePage from './pages/GuidePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/workout/new" element={<WorkoutNewPage />} />
            <Route path="/workout/:id" element={<WorkoutDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/weight" element={<WeightPage />} />
            <Route path="/guide" element={<GuidePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
