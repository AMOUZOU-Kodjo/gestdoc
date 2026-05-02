// src/pages/admin/Dashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, FileText, Download, Clock, ArrowRight, Shield, Settings } from 'lucide-react'
import { adminApi } from '../../services/api'
import { STATUS_LABELS } from '../../utils/constants'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.stats().then(r => r.data),
    refetchInterval: 30000,
  })

  const StatCard = ({ icon, label, value, color = 'text-primary' }) => (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-5 flex-row items-center gap-4">
        <div className={`p-3 rounded-xl bg-base-200 ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{isLoading ? <span className="skeleton h-8 w-16 inline-block"></span> : value}</p>
          <p className="text-sm text-base-content/60">{label}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Shield size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-sm text-base-content/60">Tableau de bord GestDoc</p>
          </div>
        </div>

        {/* Nav Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/admin/documents" className="card bg-primary text-primary-content shadow hover:shadow-md transition-shadow">
            <div className="card-body p-4 flex-row items-center justify-between">
              <div className="flex items-center gap-3"><FileText size={20} /><span className="font-semibold">Documents</span></div>
              <ArrowRight size={18} />
            </div>
          </Link>
          <Link to="/admin/users" className="card bg-secondary text-white shadow hover:shadow-md transition-shadow">
            <div className="card-body p-4 flex-row items-center justify-between">
              <div className="flex items-center gap-3"><Users size={20} /><span className="font-semibold">Utilisateurs</span></div>
              <ArrowRight size={18} />
            </div>
          </Link>
          <Link to="/admin/settings" className="card bg-neutral text-neutral-content shadow hover:shadow-md transition-shadow col-span-2">
            <div className="card-body p-4 flex-row items-center justify-between">
              <div className="flex items-center gap-3"><Settings size={20} /><span className="font-semibold">Paramètres du site</span></div>
              <ArrowRight size={18} />
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<Users size={20} />} label="Utilisateurs" value={stats?.totalUsers ?? '—'} />
          <StatCard icon={<FileText size={20} />} label="Documents publiés" value={stats?.totalDocuments ?? '—'} color="text-success" />
          <StatCard icon={<Download size={20} />} label="Téléchargements" value={stats?.totalDownloads ?? '—'} color="text-info" />
          <StatCard icon={<Clock size={20} />} label="En attente" value={stats?.pendingDocuments ?? '—'} color="text-warning" />
        </div>

        {/* Recent uploads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Derniers documents</h3>
                <Link to="/admin/documents" className="text-xs link link-primary">Voir tout</Link>
              </div>
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full"></div>)}</div>
              ) : stats?.recentUploads?.length === 0 ? (
                <p className="text-sm text-base-content/50 py-4 text-center">Aucun document</p>
              ) : (
                <div className="space-y-2">
                  {stats?.recentUploads?.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg">
                      <FileText size={16} className="text-primary flex-shrink-0" />
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
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Nouveaux utilisateurs</h3>
                <Link to="/admin/users" className="text-xs link link-primary">Voir tout</Link>
              </div>
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full"></div>)}</div>
              ) : stats?.recentUsers?.length === 0 ? (
                <p className="text-sm text-base-content/50 py-4 text-center">Aucun utilisateur</p>
              ) : (
                <div className="space-y-2">
                  {stats?.recentUsers?.map(u => (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}