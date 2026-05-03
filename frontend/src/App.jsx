import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProfileModal from './components/ProfileModal'
import Navbar  from './components/Navbar'
import Footer  from './components/Footer'

import Home            from './pages/Home'
import Login           from './pages/Login'
import Register        from './pages/Register'
import DocumentDetail  from './pages/DocumentDetail'
import Upload          from './pages/Upload'
import Profile         from './pages/Profile'
import Forum           from './pages/Forum'
import ForumPost       from './pages/ForumPost'
import BepcPage        from './pages/bepc/index'
import PremierePage    from './pages/premiere/index'
import TerminalePage   from './pages/terminale/index'
import UniversitePage  from './pages/universite/index'
import AdminDashboard  from './pages/admin/Dashboard'
import AdminDocuments  from './pages/admin/Documents'
import AdminUsers      from './pages/admin/Users'
import AdminSettings   from './pages/admin/Settings'
import AdminBroadcast  from './pages/admin/Broadcast'
import AdminDons       from './pages/admin/Dons'
import Confidentialite from './pages/legal/Confidentialite'
import Conditions      from './pages/legal/Conditions'

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
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Layout global : flex colonne, footer collé en bas */}
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <ProfileModal />
        <main className="flex-1">
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/register"      element={<Register />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
            <Route path="/bepc"          element={<BepcPage />} />
            <Route path="/premiere"      element={<PremierePage />} />
            <Route path="/terminale"     element={<TerminalePage />} />
            <Route path="/universite"    element={<UniversitePage />} />
            <Route path="/forum"          element={<Forum />} />
            <Route path="/forum/:id"      element={<ForumPost />} />
            <Route path="/upload"        element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin"            element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/documents"  element={<ProtectedRoute adminOnly><AdminDocuments /></ProtectedRoute>} />
            <Route path="/admin/users"      element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/settings"   element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/broadcast"  element={<ProtectedRoute adminOnly><AdminBroadcast /></ProtectedRoute>} />
            <Route path="/admin/dons"       element={<ProtectedRoute adminOnly><AdminDons /></ProtectedRoute>} />
            <Route path="/confidentialite"  element={<Confidentialite />} />
            <Route path="/conditions"       element={<Conditions />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
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