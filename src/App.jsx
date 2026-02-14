import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Configuration from './pages/Configuration'
import InterviewSession from './pages/InterviewSession'
import Results from './pages/Results'
import History from './pages/History'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
                <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/configure" element={<Configuration />} />
                    <Route path="/session" element={<InterviewSession />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/history" element={<History />} />
                </Route>
            </Routes>
        </ErrorBoundary>
    )
}
