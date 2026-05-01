import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProfileModal from './components/ProfileModal'
import Navbar from './components/Navbar'

import Home            from './pages/Home'
import Login           from './pages/Login'
import Register        from './pages/Register'
import DocumentDetail  from './pages/DocumentDetail'
import Upload          from './pages/Upload'
import Profile         from './pages/Profile'
import BepcPage        from './pages/bepc/index'
import PremierePage    from './pages/premiere/index'
import TerminalePage   from './pages/terminale/index'
import UniversitePage  from './pages/universite/index'
import AdminDashboard  from './pages/admin/Dashboard'
import AdminDocuments  from './pages/admin/Documents'
import AdminUsers      from './pages/admin/Users'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <ProfileModal />
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/bepc"         element={<BepcPage />} />
        <Route path="/premiere"     element={<PremierePage />} />
        <Route path="/terminale"    element={<TerminalePage />} />
        <Route path="/universite"   element={<UniversitePage />} />
        <Route path="/upload"       element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin"         element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/documents" element={<ProtectedRoute adminOnly><AdminDocuments /></ProtectedRoute>} />
        <Route path="/admin/users"   element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
