import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Upload, User, LogOut, Shield, Menu, ChevronDown, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { NIVEAUX, getNiveauxForProfile } from '../utils/constants'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout, isAdmin, hasAllAccess } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnecté avec succès')
    navigate('/')
  }

  const accessibleNiveaux = user
    ? NIVEAUX.filter(n => getNiveauxForProfile(user.profile).includes(n.value) || hasAllAccess)
    : NIVEAUX

  return (
    <div className="navbar bg-base-100 shadow-md sticky top-0 z-40">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <Menu size={20} />
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-56">
            <li><Link to="/">Accueil</Link></li>
            <li className="menu-title mt-2"><span>Niveaux</span></li>
            {accessibleNiveaux.map(n => (
              <li key={n.value}><Link to={n.route}>{n.label}</Link></li>
            ))}
            {user && <li className="mt-2"><Link to="/upload">Uploader</Link></li>}
            {isAdmin && <li><Link to="/admin">Administration</Link></li>}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl font-bold text-primary gap-2">
          <BookOpen size={24} />
          GestDoc
        </Link>
      </div>

      {/* Desktop nav */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li><Link to="/" className={`font-medium rounded-lg ${location.pathname === '/' ? 'bg-base-200' : ''}`}>Accueil</Link></li>

          {/* Dropdown Niveaux */}
          <li>
            <details>
              <summary className="font-medium gap-1">
                <GraduationCap size={16} /> Niveaux
              </summary>
              <ul className="p-2 bg-base-100 shadow-lg rounded-xl w-56 z-50 border border-base-200">
                {accessibleNiveaux.map(n => (
                  <li key={n.value}>
                    <Link
                      to={n.route}
                      className={`rounded-lg ${location.pathname === n.route ? 'bg-primary/10 text-primary font-medium' : ''}`}
                    >
                      <span className={`badge badge-sm ${n.color}`}></span>
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </li>

          {user && (
            <li>
              <Link to="/upload" className="font-medium gap-1">
                <Upload size={16} /> Uploader
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link to="/admin" className="font-medium gap-1 text-primary">
                <Shield size={16} /> Admin
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className="navbar-end gap-2">
        {user ? (
          <div className="dropdown dropdown-end">
            {/* Avatar cliquable */}
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar cursor-pointer placeholder">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                <span className="text-sm font-bold select-none">
                  {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center">
                    <span className="text-sm font-bold">{user.prenom?.[0]}{user.nom?.[0]}</span>
                  </div>
                )}
                </span>
              </div>
            </label>

            <div tabIndex={0} className="dropdown-content mt-3 z-[1] shadow-xl bg-base-100 rounded-2xl w-64 border border-base-200 overflow-hidden">
              {/* Carte profil — visible surtout sur mobile */}
              <div className="bg-gradient-to-br from-primary to-secondary p-4 flex items-center gap-3">
                {/* Photo / initiales */}
                 <label tabIndex={0} className="btn btn-ghost btn-circle avatar cursor-pointer placeholder">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                <span className="text-sm font-bold select-none">
                  {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center">
                    <span className="text-sm font-bold">{user.prenom?.[0]}{user.nom?.[0]}</span>
                  </div>
                )}
                </span>
              </div>
            </label>
                {/* Nom + rôle */}
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {user.prenom} {user.nom}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                    user.role === 'ADMIN'
                      ? 'bg-white/30 text-white'
                      : 'bg-white/20 text-white/90'
                  }`}>
                    {user.role === 'ADMIN'
                      ? '⚡ Administrateur'
                      : user.profile === 'ENSEIGNANT'
                      ? '👨‍🏫 Enseignant'
                      : user.profile === 'UNIVERSITE'
                      ? '🏫 Étudiant'
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

              {/* Menu liens */}
              <ul className="menu menu-sm p-2">
                <li>
                  <Link to="/profile" className="gap-2 rounded-xl">
                    <User size={15} /> Mon Profil
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" className="gap-2 rounded-xl">
                      <Shield size={15} /> Administration
                    </Link>
                  </li>
                )}
                <li className="mt-1">
                  <button onClick={handleLogout} className="gap-2 rounded-xl text-error hover:bg-error/10">
                    <LogOut size={15} /> Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Connexion</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Inscription</Link>
          </>
        )}
      </div>
    </div>
  )
}