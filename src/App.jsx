import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Configuration from './pages/Configuration'
import InterviewSession from './pages/InterviewSession'
import Results from './pages/Results'
import History from './pages/History'

export default function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/configure" element={<Configuration />} />
                <Route path="/session" element={<InterviewSession />} />
                <Route path="/results" element={<Results />} />
                <Route path="/history" element={<History />} />
            </Route>
        </Routes>
    )
}
