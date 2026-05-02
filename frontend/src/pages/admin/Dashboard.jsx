import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, FileText, Download, Clock, ArrowRight } from 'lucide-react'
import { adminApi } from '../../services/api'
import { STATUS_LABELS } from '../../utils/constants'
import AdminLayout from '../../components/admin/AdminLayout'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.stats().then(r => r.data),
    refetchInterval: 30000,
  })

  const STAT_CARDS = [
    { icon: <Users size={20} />,    label: 'Utilisateurs',      value: stats?.totalUsers,      color: 'text-primary',  bg: 'bg-primary/10' },
    { icon: <FileText size={20} />, label: 'Documents publiés', value: stats?.totalDocuments,  color: 'text-success',  bg: 'bg-success/10' },
    { icon: <Download size={20} />, label: 'Téléchargements',   value: stats?.totalDownloads,  color: 'text-info',     bg: 'bg-info/10' },
    { icon: <Clock size={20} />,    label: 'En attente',        value: stats?.pendingDocuments,color: 'text-warning',  bg: 'bg-warning/10' },
  ]

  return (
    <AdminLayout title="Tableau de bord">
      <div className="space-y-6 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAT_CARDS.map((s, i) => (
            <div key={i} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4 flex-row items-center gap-3">
                <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-xl font-bold">
                    {isLoading ? <span className="skeleton h-6 w-10 inline-block"></span> : (s.value ?? '—')}
                  </p>
                  <p className="text-xs text-base-content/60">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Raccourcis */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/admin/documents', label: 'Gérer les documents', color: 'btn-primary' },
            { to: '/admin/users',     label: 'Gérer les utilisateurs', color: 'btn-secondary' },
            { to: '/admin/broadcast', label: 'Envoyer une notification', color: 'btn-info' },
          ].map(l => (
            <Link key={l.to} to={l.to} className={`btn ${l.color} btn-outline gap-2`}>
              {l.label} <ArrowRight size={15} />
            </Link>
          ))}
        </div>

        {/* Récents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Derniers documents */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Derniers documents</h3>
                <Link to="/admin/documents" className="text-xs link link-primary">Voir tout</Link>
              </div>
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full"></div>)}</div>
              ) : stats?.recentUploads?.length === 0 ? (
                <p className="text-sm text-base-content/50 text-center py-4">Aucun document</p>
              ) : stats?.recentUploads?.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg">
                  <FileText size={15} className="text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.titre}</p>
                    <p className="text-xs text-base-content/50">par {doc.uploader?.prenom} {doc.uploader?.nom}</p>
                  </div>
                  <span className={`badge badge-xs ${STATUS_LABELS[doc.status]?.class}`}>
                    {STATUS_LABELS[doc.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Derniers inscrits */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Nouveaux utilisateurs</h3>
                <Link to="/admin/users" className="text-xs link link-primary">Voir tout</Link>
              </div>
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full"></div>)}</div>
              ) : stats?.recentUsers?.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg">
                  <div className="avatar placeholder">
                    <div className="bg-primary/20 text-primary rounded-full w-7">
                      <span className="text-xs">{u.prenom?.[0]}{u.nom?.[0]}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.prenom} {u.nom}</p>
                    <p className="text-xs text-base-content/50 truncate">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}