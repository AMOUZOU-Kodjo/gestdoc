
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { BookOpen, Upload, User, LogOut, Shield, Menu, ChevronDown, GraduationCap, X, ChevronRight, MessageSquare, Crown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { NIVEAUX, getNiveauxForProfile } from '../utils/constants'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout, isAdmin, hasAllAccess } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNiveauxOpen, setIsNiveauxOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const niveauxRef = useRef(null)
  const userMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnecté avec succès')
    navigate('/')
  }

  const accessibleNiveaux = user
    ? NIVEAUX.filter(n => getNiveauxForProfile(user.profile).includes(n.value) || hasAllAccess)
    : NIVEAUX

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (niveauxRef.current && !niveauxRef.current.contains(event.target)) {
        setIsNiveauxOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('.mobile-menu-trigger')) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsNiveauxOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname])

  return (
    <nav className="bg-base-100 shadow-lg sticky top-0 z-50 border-b border-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo - Left */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-base-200 transition-colors mobile-menu-trigger"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl text-primary hidden sm:block">GestDoc</span>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                location.pathname === '/'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-base-200 text-base-content/80 hover:text-base-content'
              }`}
            >
              Accueil
            </Link>

            {/* Forum */}
            <Link
              to="/forum"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                location.pathname.startsWith('/forum')
                  ? 'bg-primary/10 text-primary'
                  : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'
              }`}
            >
              <MessageSquare size={18} />
              Forum
            </Link>

            {/* Premium / Abonnement */}
            <Link
              to="/abonnement"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                location.pathname === '/abonnement'
                  ? 'bg-warning/10 text-warning'
                  : 'text-warning hover:bg-warning/10'
              }`}
            >
              <Crown size={18} />
              Premium
            </Link>

            {/* Niveaux Dropdown */}
            <div className="relative" ref={niveauxRef}>
              <button
                onClick={() => setIsNiveauxOpen(!isNiveauxOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isNiveauxOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <GraduationCap size={18} />
                Niveaux
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isNiveauxOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isNiveauxOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-base-100 rounded-xl shadow-2xl border border-base-200 overflow-hidden">
                  <div className="p-3 border-b border-base-200 bg-base-100/50">
                    <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                      Choisissez votre niveau
                    </p>
                  </div>
                  <div className="p-2">
                    {accessibleNiveaux.map(n => (
                      <Link
                        key={n.value}
                        to={n.route}
                        onClick={() => setIsNiveauxOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                          location.pathname === n.route
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-base-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full bg-${n.color || 'primary'}`}></div>
                          <span className="text-sm font-medium">{n.label}</span>
                        </div>
                        <ChevronRight size={14} className="text-base-content/30" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user && (
              <Link
                to="/upload"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === '/upload'
                    ? 'bg-primary/10 text-primary'
                    : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <Upload size={18} />
                Uploader
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-primary/10 text-primary'
                    : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <Shield size={18} />
                Admin
              </Link>
            )}
          </div>

          {/* User Menu - Right */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-base-200 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      `${user.prenom?.[0]}${user.nom?.[0]}`
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-base-content/50 transition-transform duration-200 hidden sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-base-100 rounded-2xl shadow-2xl border border-base-200 overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-br from-primary to-secondary p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            `${user.prenom?.[0]}${user.nom?.[0]}`
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-base truncate">
                            {user.prenom} {user.nom}
                          </p>
                          <p className="text-white/70 text-xs truncate mb-1">{user.email}</p>
                          <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-white/30 text-white'
                              : 'bg-white/20 text-white/90'
                          }`}>
                            {user.role === 'ADMIN'
                              ? '⚡ Administrateur'
                              : user.profile === 'ENSEIGNANT'
                              ? '👨‍🏫 Enseignant'
                              : user.profile === 'UNIVERSITE'
                              ? '🏫 Étudiant Universitaire'
                              : user.profile === 'TERMINALE'
                              ? '🎓 Élève Terminale'
                              : user.profile === 'PREMIERE'
                              ? '📖 Élève Première'
                              : user.profile === 'BEPC'
                              ? '📚 Élève BEPC'
                              : '👤 Utilisateur'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-base-content hover:bg-base-200 transition-all"
                      >
                        <User size={18} className="text-primary" />
                        <span className="text-sm font-medium">Mon Profil</span>
                      </Link>

                      <Link
                        to="/abonnement"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-warning hover:bg-warning/10 transition-all"
                      >
                        <Crown size={18} />
                        <span className="text-sm font-medium">Premium</span>
                      </Link>

                      <Link
                        to="/forum"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-base-content hover:bg-base-200 transition-all"
                      >
                        <MessageSquare size={18} className="text-primary" />
                        <span className="text-sm font-medium">Forum</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-base-content hover:bg-base-200 transition-all"
                        >
                          <Shield size={18} className="text-primary" />
                          <span className="text-sm font-medium">Administration</span>
                        </Link>
                      )}

                      <div className="h-px bg-base-200 my-2"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-error hover:bg-error/10 transition-all w-full"
                      >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm">Connexion</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Inscription</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-base-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl text-primary">GestDoc</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-base-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto h-full pb-20">
          <div className="space-y-6">

            {/* Navigation principale */}
            <div>
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                Navigation
              </p>
              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    location.pathname === '/' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-base-200'
                  }`}
                >
                  Accueil
                </Link>

                <Link
                  to="/forum"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    location.pathname.startsWith('/forum') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-base-200'
                  }`}
                >
                  <MessageSquare size={18} />
                  Forum
                </Link>

                {/* Premium dans mobile */}
                <Link
                  to="/abonnement"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
                    location.pathname === '/abonnement' ? 'bg-warning/10 text-warning' : 'text-warning hover:bg-warning/10'
                  }`}
                >
                  <Crown size={18} />
                  Premium ⭐
                </Link>
              </div>
            </div>

            {/* Niveaux */}
            <div>
              <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                Niveaux d'études
              </p>
              <div className="space-y-1">
                {accessibleNiveaux.map(n => (
                  <Link
                    key={n.value}
                    to={n.route}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      location.pathname === n.route ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-base-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full bg-${n.color || 'primary'}`}></span>
                    {n.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions */}
            {user && (
              <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                  Actions
                </p>
                <div className="space-y-1">
                  <Link
                    to="/upload"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      location.pathname === '/upload' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-base-200'
                    }`}
                  >
                    <Upload size={18} />
                    Uploader un document
                  </Link>
                </div>
              </div>
            )}

            {/* Admin */}
            {isAdmin && (
              <div>
                <div className="space-y-1">
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      location.pathname.startsWith('/admin') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-base-200'
                    }`}
                  >
                    <Shield size={18} />
                    Administration
                  </Link>
                </div>
              </div>
            )}

            {/* Mon compte */}
            {user && (
              <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                  Mon compte
                </p>
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-all"
                  >
                    <User size={18} />
                    Mon Profil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-error hover:bg-error/10 transition-all w-full"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  )
}
