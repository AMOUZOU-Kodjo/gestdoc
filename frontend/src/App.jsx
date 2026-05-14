import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useWakeBackend } from './hooks/useWakeBackend'
import ProfileModal from './components/ProfileModal'
import QuotaBanner  from './components/QuotaBanner'
import Navbar  from './components/Navbar'
import Footer  from './components/Footer'

// Pages chargées immédiatement (critiques)
import Home     from './pages/Home'
import Login    from './pages/Login'
import Register from './pages/Register'

// Pages chargées en lazy (moins critiques)
const DocumentDetail   = lazy(() => import('./pages/DocumentDetail'))
const DocumentViewer   = lazy(() => import('./pages/DocumentViewer'))
const Upload           = lazy(() => import('./pages/Upload'))
const Profile          = lazy(() => import('./pages/Profile'))
const Abonnement       = lazy(() => import('./pages/Abonnement'))
const Forum            = lazy(() => import('./pages/Forum'))
const ForumPost        = lazy(() => import('./pages/ForumPost'))
const BepcPage         = lazy(() => import('./pages/bepc/index'))
const PremierePage     = lazy(() => import('./pages/premiere/index'))
const TerminalePage    = lazy(() => import('./pages/terminale/index'))
const UniversitePage   = lazy(() => import('./pages/universite/index'))
const AdminDashboard   = lazy(() => import('./pages/admin/Dashboard'))
const AdminDocuments   = lazy(() => import('./pages/admin/Documents'))
const AdminUsers       = lazy(() => import('./pages/admin/Users'))
const AdminSettings    = lazy(() => import('./pages/admin/Settings'))
const AdminBroadcast   = lazy(() => import('./pages/admin/Broadcast'))
const AdminDons        = lazy(() => import('./pages/admin/Dons'))
const AdminSubscriptions = lazy(() => import('./pages/admin/Subscriptions'))
const Confidentialite  = lazy(() => import('./pages/legal/Confidentialite'))
const Conditions       = lazy(() => import('./pages/legal/Conditions'))

// Spinner de chargement des pages lazy
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-200">
    <span className="loading loading-spinner loading-lg text-primary"></span>
  </div>
)

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
  useWakeBackend() // réveille Render dès l'ouverture du site
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Layout global : flex colonne, footer collé en bas */}
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <QuotaBanner />
        <ProfileModal />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/register"      element={<Register />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
            <Route path="/viewer/:id" element={<DocumentViewer />} />
            <Route path="/bepc"          element={<BepcPage />} />
            <Route path="/premiere"      element={<PremierePage />} />
            <Route path="/terminale"     element={<TerminalePage />} />
            <Route path="/universite"    element={<UniversitePage />} />
            <Route path="/abonnement"     element={<Abonnement />} />
            <Route path="/forum"          element={<Forum />} />
            <Route path="/forum/:id"      element={<ForumPost />} />
            <Route path="/upload"        element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin"            element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/documents"  element={<ProtectedRoute adminOnly><AdminDocuments /></ProtectedRoute>} />
            <Route path="/admin/users"      element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/settings"   element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/broadcast"      element={<ProtectedRoute adminOnly><AdminBroadcast /></ProtectedRoute>} />
            <Route path="/admin/dons"           element={<ProtectedRoute adminOnly><AdminDons /></ProtectedRoute>} />
            <Route path="/admin/subscriptions"  element={<ProtectedRoute adminOnly><AdminSubscriptions /></ProtectedRoute>} />
            <Route path="/confidentialite"  element={<Confidentialite />} />
            <Route path="/conditions"       element={<Conditions />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
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