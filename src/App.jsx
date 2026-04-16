import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import FixBoard from './pages/FixBoard'
import Rotations from './pages/Rotations'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Grocery from './pages/Grocery'
import HouseRules from './pages/HouseRules'
import FixHistory from './pages/FixHistory'
import Templates from './pages/Templates'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl animate-float block mb-4">🔧</span>
          <p className="text-gray-400 dark:text-dark-muted font-medium animate-pulse-soft">
            Loading FlatFix...
          </p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-dark-bg flex items-center justify-center">
        <span className="text-5xl animate-float">🔧</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<FixBoard />} />
        <Route path="/rotations" element={<Rotations />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/grocery" element={<Grocery />} />
        <Route path="/rules" element={<HouseRules />} />
        <Route path="/history" element={<FixHistory />} />
        <Route path="/templates" element={<Templates />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '1.5rem',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Quicksand, sans-serif',
            },
            success: {
              style: { background: '#e6f7f0', color: '#2db87a' },
            },
            error: {
              style: { background: '#fde8ed', color: '#d43a66' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
