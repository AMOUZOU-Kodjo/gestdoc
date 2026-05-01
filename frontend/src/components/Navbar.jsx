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
        <Link to="/" className="btn btn-ghost hidden md:flex text-xl  font-bold text-primary gap-2">
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
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar cursor-pointer">
              <div className="w-10 rounded-full overflow-hidden border-2 border-base-200">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center">
                    <span className="text-sm font-bold">{user.prenom?.[0]}{user.nom?.[0]}</span>
                  </div>
                )}
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-200">
              <li className="menu-title"><span>{user.prenom} {user.nom}</span></li>
              <li><Link to="/profile"><User size={16} /> Mon Profil</Link></li>
              {isAdmin && <li><Link to="/admin"><Shield size={16} /> Administration</Link></li>}
              <li><button onClick={handleLogout}><LogOut size={16} /> Déconnexion</button></li>
            </ul>
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
