import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Users, Settings,
  Mail, Heart, Menu, X, ChevronRight, Shield
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/admin',           label: 'Dashboard',      icon: <LayoutDashboard size={18} />, exact: true },
  { to: '/admin/documents', label: 'Documents',      icon: <FileText size={18} /> },
  { to: '/admin/users',     label: 'Utilisateurs',   icon: <Users size={18} /> },
  { to: '/admin/broadcast', label: 'Notifications',  icon: <Mail size={18} /> },
  { to: '/admin/dons',      label: 'Dons',           icon: <Heart size={18} /> },
  { to: '/admin/settings',  label: 'Paramètres',     icon: <Settings size={18} /> },
]

export default function AdminLayout({ children, title }) {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-neutral text-neutral-content w-64 flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl">
            <Shield size={18} />
          </div>
          <div>
            <p className="font-bold text-white text-sm">GestDoc Admin</p>
            <p className="text-xs text-white/50 truncate max-w-[140px]">{user?.email}</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = isActive(item)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer sidebar */}
      <div className="p-3 border-t border-white/10">
        <Link to="/" className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
          ← Retour au site
        </Link>
      </div>
    </aside>
  )

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-base-100 border-b border-base-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            className="btn btn-ghost btn-sm btn-square lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="font-bold text-lg">{title}</h1>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto bg-base-200 p-4 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}