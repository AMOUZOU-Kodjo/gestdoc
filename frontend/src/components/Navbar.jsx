// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Upload, User, LogOut, Shield, Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnecté avec succès')
    navigate('/')
  }

  return (
    <div className="navbar bg-base-100 shadow-md sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <Menu size={20} />
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/">Accueil</Link></li>
            {user && <li><Link to="/upload">Uploader</Link></li>}
            {isAdmin && <li><Link to="/admin">Administration</Link></li>}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost hidden md:flex text-xl font-bold text-primary gap-2">
          <BookOpen size={24} />
          GestDoc
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/" className="font-medium">Accueil</Link></li>
          

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
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10">
                <span className="text-sm font-bold">
                  {user.prenom?.[0]}{user.nom?.[0]}
                </span>
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title">
                <span>{user.prenom} {user.nom}</span>
              </li>
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
