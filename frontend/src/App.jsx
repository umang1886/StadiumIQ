import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import Layout from './components/ui/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import VenueDashboard from './pages/VenueDashboard'
import CrowdSync from './pages/CrowdSync'
import Order from './pages/Order'
import SmartBot from './pages/SmartBot'
import FanScore from './pages/FanScore'
import ExitRouting from './pages/ExitRouting'
import Alerts from './pages/Alerts'
import AdminDashboard from './pages/AdminDashboard'
import Landing from './pages/Landing'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const location = useLocation()
  
  if (isAuthenticated) return children;
  if (location.pathname === '/') return <Landing />;
  
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="map" element={<VenueDashboard />} />
          <Route path="sync" element={<CrowdSync />} />
          <Route path="order" element={<Order />} />
          <Route path="bot" element={<SmartBot />} />
          <Route path="score" element={<FanScore />} />
          <Route path="exit" element={<ExitRouting />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
