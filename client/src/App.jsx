import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import DailyView from './pages/DailyView'
import Accounts from './pages/Accounts'
import CRM from './pages/CRM'
import Objectives from './pages/Objectives'
import Settings from './pages/Settings'
import Campaigns from './pages/Campaigns'
import Events from './pages/Events'
import Activities from './pages/Activities'
import SprintPlanner from './pages/SprintPlanner'
import Cadences from './pages/Cadences'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="daily" element={<DailyView />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="crm" element={<CRM />} />
          <Route path="activities" element={<Activities />} />
          <Route path="sprint-planner" element={<SprintPlanner />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="events" element={<Events />} />
          <Route path="cadences" element={<Cadences />} />
          <Route path="objectives" element={<Objectives />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

// Made with Bob
