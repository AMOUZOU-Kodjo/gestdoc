import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Users, FileText, Download, Clock, ArrowRight, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Activity, Shield, Bell, Settings, BarChart3,
  Eye, ThumbsUp, AlertTriangle, Calendar, Loader2, RefreshCw
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { STATUS_LABELS } from '../../utils/constants'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Composant Skeleton amélioré
const StatsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="card bg-base-100 shadow-sm animate-pulse">
        <div className="card-body p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton h-8 w-16 mb-1" />
              <div className="skeleton h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

const RecentSkeleton = () => (
  <div className="space-y-2">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="flex-1">
          <div className="skeleton h-4 w-3/4 mb-1" />
          <div className="skeleton h-3 w-1/2" />
        </div>
        <div className="skeleton w-16 h-5 rounded-full" />
      </div>
    ))}
  </div>
)

export default function AdminDashboard() {
  const [chartData, setChartData] = useState(null)
  const [timeRange, setTimeRange] = useState('week') // week, month, year
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['adminStats', timeRange],
    queryFn: () => adminApi.stats({ range: timeRange }).then(r => r.data),
    refetchInterval: 30000,
  })

  // Préparer les données pour les graphiques
  useEffect(() => {
    if (stats?.activityData) {
      setChartData({
        labels: stats.activityData.labels,
        datasets: [
          {
            label: 'Téléchargements',
            data: stats.activityData.downloads,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Nouveaux documents',
            data: stats.activityData.uploads,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      })
    }
  }, [stats])

  const STAT_CARDS = [
    { 
      icon: <Users size={20} />,    
      label: 'Utilisateurs',      
      value: stats?.totalUsers,      
      color: 'text-primary',  
      bg: 'bg-primary/10',
      trend: stats?.userTrend || '+12%',
      trendUp: true
    },
    { 
      icon: <FileText size={20} />, 
      label: 'Documents publiés', 
      value: stats?.totalDocuments,  
      color: 'text-success',  
      bg: 'bg-success/10',
      trend: stats?.docTrend || '+8%',
      trendUp: true
    },
    { 
      icon: <Download size={20} />, 
      label: 'Téléchargements',   
      value: stats?.totalDownloads,  
      color: 'text-info',     
      bg: 'bg-info/10',
      trend: stats?.downloadTrend || '+23%',
      trendUp: true
    },
    { 
      icon: <Clock size={20} />,    
      label: 'En attente',        
      value: stats?.pendingDocuments,
      color: 'text-warning',  
      bg: 'bg-warning/10',
      trend: stats?.pendingTrend || '-5%',
      trendUp: false
    },
  ]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 6 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  }

  return (
    <AdminLayout title="Tableau de bord">
      <div className="space-y-6 max-w-7xl">
        {/* En-tête avec rafraîchissement */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Aperçu général</h2>
            <p className="text-sm text-base-content/60">
              Bienvenue dans votre espace d'administration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="join">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`join-item btn btn-sm ${
                    timeRange === range ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  {range === 'week' ? 'Semaine' : range === 'month' ? 'Mois' : 'Année'}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-ghost btn-sm gap-2"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Rafraîchir
            </button>
          </div>
        </div>

        {/* Cartes statistiques */}
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STAT_CARDS.map((s, i) => (
              <div 
                key={i} 
                className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-200`}>
                      {s.icon}
                    </div>
                    {s.trend && (
                      <div className={`flex items-center gap-1 text-xs ${
                        s.trendUp ? 'text-success' : 'text-error'
                      }`}>
                        {s.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {s.trend}
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-bold">{s.value?.toLocaleString() || '—'}</p>
                    <p className="text-xs text-base-content/60 mt-1">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Graphiques d'activité */}
        {!isLoading && chartData && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary" />
                  <h3 className="font-semibold">Activité récente</h3>
                </div>
                <span className="text-xs text-base-content/50">
                  Évolution des téléchargements et publications
                </span>
              </div>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/admin/documents', label: 'Documents', icon: <FileText size={16} />, color: 'btn-primary' },
            { to: '/admin/users', label: 'Utilisateurs', icon: <Users size={16} />, color: 'btn-secondary' },
            { to: '/admin/broadcast', label: 'Notification', icon: <Bell size={16} />, color: 'btn-info' },
            { to: '/admin/settings', label: 'Paramètres', icon: <Settings size={16} />, color: 'btn-ghost' },
          ].map(l => (
            <Link 
              key={l.to} 
              to={l.to} 
              className={`btn ${l.color} gap-2 group justify-start hover:gap-3 transition-all`}
            >
              {l.icon}
              <span className="text-sm">{l.label}</span>
            </Link>
          ))}
        </div>

        {/* Sections récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Derniers documents */}
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <h3 className="font-semibold">Derniers documents</h3>
                </div>
                <Link to="/admin/documents" className="text-xs link link-primary flex items-center gap-1">
                  Voir tout <ArrowRight size={12} />
                </Link>
              </div>
              
              {isLoading ? (
                <RecentSkeleton />
              ) : stats?.recentUploads?.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={40} className="mx-auto text-base-content/20 mb-2" />
                  <p className="text-sm text-base-content/50">Aucun document récent</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {stats?.recentUploads?.slice(0, 5).map((doc, idx) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors group"
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.titre}</p>
                        <p className="text-xs text-base-content/50">
                          par {doc.uploader?.prenom} {doc.uploader?.nom}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-xs ${STATUS_LABELS[doc.status]?.class}`}>
                          {STATUS_LABELS[doc.status]?.label}
                        </span>
                        <span className="text-xs text-base-content/40">
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Derniers utilisateurs */}
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-secondary" />
                  <h3 className="font-semibold">Nouveaux utilisateurs</h3>
                </div>
                <Link to="/admin/users" className="text-xs link link-primary flex items-center gap-1">
                  Voir tout <ArrowRight size={12} />
                </Link>
              </div>
              
              {isLoading ? (
                <RecentSkeleton />
              ) : stats?.recentUsers?.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={40} className="mx-auto text-base-content/20 mb-2" />
                  <p className="text-sm text-base-content/50">Aucun nouvel utilisateur</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {stats?.recentUsers?.slice(0, 5).map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors"
                    >
                      <div className="avatar placeholder">
                        <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                          {user.prenom?.[0]}{user.nom?.[0]}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{user.prenom} {user.nom}</p>
                        <p className="text-xs text-base-content/50 truncate">{user.email}</p>
                      </div>
                      <div className="badge badge-sm badge-ghost">
                        {user.role === 'ADMIN' ? 'Admin' : user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Utilisateur'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section statistiques supplémentaires */}
        {!isLoading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CheckCircle size={18} className="text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.approvedDocuments || 0}</p>
                    <p className="text-xs text-base-content/60">Documents approuvés</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-base-200 rounded-full h-1.5">
                    <div 
                      className="bg-success h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.approvedDocuments / stats.totalDocuments) * 100 || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-base-content/40 mt-1">
                    Taux d'approbation: {Math.round((stats.approvedDocuments / stats.totalDocuments) * 100 || 0)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Download size={18} className="text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.averageDownloads || 0}</p>
                    <p className="text-xs text-base-content/60">Téléchargements par document</p>
                  </div>
                </div>
                <p className="text-xs text-base-content/40 mt-2">
                  ⭐ Meilleur document: {stats.topDocument?.titre || '—'}
                </p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Activity size={18} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeUsers || 0}</p>
                    <p className="text-xs text-base-content/60">Utilisateurs actifs (30j)</p>
                  </div>
                </div>
                <p className="text-xs text-base-content/40 mt-2">
                  Engagement: {Math.round((stats.activeUsers / stats.totalUsers) * 100 || 0)}% des utilisateurs
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}