import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Crown, Plus, X, UserCheck, UserX, Search, Calendar, 
  TrendingUp, Download, Filter, Grid3x3, Table2, 
  AlertTriangle, CheckCircle, Clock, Zap, DollarSign,
  Mail, Send, Eye, MoreVertical
} from 'lucide-react'
import { adminApi } from '../../services/api'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const DUREES = [
  { label: '7 jours',   jours: 7,   prix: 500,   icon: '⚡', color: 'info' },
  { label: '30 jours',  jours: 30,  prix: 1500,  icon: '📅', color: 'success' },
  { label: '90 jours',  jours: 90,  prix: 4000,  icon: '🎓', color: 'warning' },
  { label: '365 jours', jours: 365, prix: 12000, icon: '👑', color: 'primary' },
]

const getDaysUntilExpiry = (fin) => {
  const diff = new Date(fin) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AdminSubscriptions() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [form, setForm] = useState({ userId: '', dureeJours: 30, montant: 1500, reference: '' })
  const [userSearch, setUserSearch] = useState('')
  const [selectedSub, setSelectedSub] = useState(null)

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['adminSubs'],
    queryFn: () => adminApi.getSubscriptions().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: usersData } = useQuery({
    queryKey: ['adminUsers', { search: userSearch, page: 1 }],
    queryFn: () => adminApi.getUsers({ search: userSearch, page: 1 }).then(r => r.data),
    enabled: showModal,
  })

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createSubscription(data),
    onSuccess: (res) => {
      qc.invalidateQueries(['adminSubs'])
      setShowModal(false)
      setForm({ userId: '', dureeJours: 30, montant: 1500, reference: '' })
      toast.success(res.data.message || '✅ Abonnement activé avec succès !')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  })

  const revokeMutation = useMutation({
    mutationFn: (userId) => adminApi.revokeSubscription(userId),
    onSuccess: () => { 
      qc.invalidateQueries(['adminSubs'])
      toast.success('🔒 Abonnement révoqué')
    },
    onError: () => toast.error('Erreur lors de la révocation'),
  })

  const sendReminderMutation = useMutation({
    mutationFn: (userId) => adminApi.sendExpiryReminder(userId),
    onSuccess: () => toast.success('📧 Rappel envoyé par email'),
    onError: () => toast.error("Erreur lors de l'envoi"),
  })

  const filtered = subs.filter(s => {
    const matchesSearch = !search || 
      `${s.user?.nom} ${s.user?.prenom} ${s.user?.email}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && s.isActive) ||
      (statusFilter === 'expired' && !s.isActive) ||
      (statusFilter === 'expiring_soon' && s.isActive && getDaysUntilExpiry(s.fin) <= 7)
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: subs.length,
    active: subs.filter(s => s.isActive).length,
    expired: subs.filter(s => !s.isActive).length,
    expiringSoon: subs.filter(s => s.isActive && getDaysUntilExpiry(s.fin) <= 7).length,
    totalRevenue: subs.reduce((sum, s) => sum + (s.montant || 0), 0),
    monthlyRevenue: subs
      .filter(s => new Date(s.createdAt).getMonth() === new Date().getMonth())
      .reduce((sum, s) => sum + (s.montant || 0), 0),
  }

  const handleExportCSV = () => {
    const headers = ['Utilisateur', 'Email', 'Statut', 'Date début', 'Date fin', 'Montant', 'Référence']
    const rows = filtered.map(s => [
      `${s.user?.prenom} ${s.user?.nom}`,
      s.user?.email,
      s.isActive ? 'Actif' : 'Expiré',
      new Date(s.debut).toLocaleDateString('fr-FR'),
      new Date(s.fin).toLocaleDateString('fr-FR'),
      `${s.montant} FCFA`,
      s.reference || '-'
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `abonnements_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Export CSV généré')
  }

  const getExpiryStatus = (fin, isActive) => {
    if (!isActive) return { label: 'Expiré', color: 'error', icon: <X size={12} /> }
    const days = getDaysUntilExpiry(fin)
    if (days <= 0) return { label: 'Expiré', color: 'error', icon: <X size={12} /> }
    if (days <= 7) return { label: `Expire dans ${days}j`, color: 'warning', icon: <AlertTriangle size={12} /> }
    if (days <= 30) return { label: `Expire dans ${days}j`, color: 'info', icon: <Clock size={12} /> }
    return { label: 'Actif', color: 'success', icon: <CheckCircle size={12} /> }
  }

  return (
    <AdminLayout title="Gestion des abonnements">
      <div className="space-y-4 max-w-7xl">

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total abonnés', value: stats.total, icon: <Crown size={16} />, color: 'primary', bg: 'bg-primary/10' },
            { label: 'Actifs', value: stats.active, icon: <CheckCircle size={16} />, color: 'success', bg: 'bg-success/10' },
            { label: 'Expirés', value: stats.expired, icon: <X size={16} />, color: 'error', bg: 'bg-error/10' },
            { label: 'Expire bientôt', value: stats.expiringSoon, icon: <AlertTriangle size={16} />, color: 'warning', bg: 'bg-warning/10' },
            { label: 'CA mensuel', value: `${stats.monthlyRevenue.toLocaleString('fr-FR')} FCFA`, icon: <DollarSign size={16} />, color: 'info', bg: 'bg-info/10' },
            { label: 'CA total', value: `${stats.totalRevenue.toLocaleString('fr-FR')} FCFA`, icon: <TrendingUp size={16} />, color: 'secondary', bg: 'bg-secondary/10' },
          ].map((s, i) => (
            <div key={i} className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="card-body p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${s.bg} ${s.color === 'primary' ? 'text-primary' : `text-${s.color}`} group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-base-content/60">{s.label}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-3">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un abonné..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input input-bordered input-sm w-full pl-9"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn btn-sm gap-2 ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <Filter size={14} />
                  Filtres
                  {statusFilter && <span className="badge badge-xs badge-primary">1</span>}
                </button>

                <button onClick={handleExportCSV} className="btn btn-sm btn-ghost gap-2">
                  <Download size={14} /> Export
                </button>

                <div className="join">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <Grid3x3 size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`join-item btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <Table2 size={14} />
                  </button>
                </div>

                <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm gap-2">
                  <Plus size={15} /> Abonnement
                </button>
              </div>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-base-200">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="select select-bordered select-sm"
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">✅ Actifs</option>
                  <option value="expired">❌ Expirés</option>
                  <option value="expiring_soon">⚠️ Expire dans 7 jours</option>
                </select>

                {statusFilter && (
                  <button onClick={() => setStatusFilter('')} className="btn btn-sm btn-ghost gap-1">
                    <X size={12} /> Effacer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tarifs info */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-warning" />
              <span className="text-xs font-semibold">Grille tarifaire</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DUREES.map(d => (
                <div key={d.jours} className="text-center p-2 bg-gradient-to-br from-base-200 to-base-100 rounded-xl hover:shadow-md transition-all">
                  <p className="text-lg font-bold text-primary">{d.prix.toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-[10px] text-base-content/60">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des abonnements */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm animate-pulse">
                <div className="card-body p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-3/4" />
                      <div className="skeleton h-2 w-1/2" />
                    </div>
                  </div>
                  <div className="skeleton h-8 w-full" />
                  <div className="skeleton h-6 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-base-100 rounded-xl">
            <Crown size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-base-content/60">Aucun abonnement trouvé</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(s => {
              const expiryStatus = getExpiryStatus(s.fin, s.isActive)
              const daysUntilExpiry = getDaysUntilExpiry(s.fin)
              const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0

              return (
                <div key={s.id} className={`card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 ${!s.isActive ? 'opacity-70' : ''}`}>
                  <div className="card-body p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                            {s.user?.prenom?.[0]}{s.user?.nom?.[0]}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{s.user?.prenom} {s.user?.nom}</p>
                          <p className="text-xs text-base-content/50">{s.user?.email}</p>
                        </div>
                      </div>
                      <div className={`badge badge-${expiryStatus.color} gap-1 text-[10px]`}>
                        {expiryStatus.icon} {expiryStatus.label}
                      </div>
                    </div>

                    {/* Détails abonnement */}
                    <div className="bg-base-200 rounded-lg p-3 mt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-base-content/50">Début</p>
                          <p className="font-medium">{new Date(s.debut).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <p className="text-base-content/50">Fin</p>
                          <p className={`font-medium ${isExpiringSoon ? 'text-warning' : ''}`}>
                            {new Date(s.fin).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-base-content/50">Montant</p>
                          <p className="font-bold text-primary">{s.montant.toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        <div>
                          <p className="text-base-content/50">Réf.</p>
                          <p className="text-xs font-mono">{s.reference || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {s.isActive && (
                        <>
                          {isExpiringSoon && (
                            <button
                              onClick={() => sendReminderMutation.mutate(s.user.id)}
                              className="btn btn-xs btn-warning btn-outline flex-1 gap-1"
                              disabled={sendReminderMutation.isPending}
                            >
                              <Mail size={12} /> Rappel
                            </button>
                          )}
                          <button
                            onClick={() => revokeMutation.mutate(s.user.id)}
                            className="btn btn-xs btn-error btn-outline flex-1 gap-1"
                          >
                            <UserX size={12} /> Révoquer
                          </button>
                        </>
                      )}
                      {!s.isActive && (
                        <button
                          onClick={() => {
                            setForm({ userId: s.user.id, dureeJours: 30, montant: 1500, reference: '' })
                            setShowModal(true)
                          }}
                          className="btn btn-xs btn-primary btn-outline flex-1 gap-1"
                        >
                          <Crown size={12} /> Renouveler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Vue tableau */
          <div className="card bg-base-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm table-zebra">
                <thead>
                  <tr className="bg-base-200">
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Montant</th>
                    <th>Référence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const expiryStatus = getExpiryStatus(s.fin, s.isActive)
                    return (
                      <tr key={s.id}>
                        <td className="font-medium text-sm">{s.user?.prenom} {s.user?.nom}</td>
                        <td className="text-sm text-base-content/70">{s.user?.email}</td>
                        <td>
                          <span className={`badge badge-${expiryStatus.color} badge-sm gap-1`}>
                            {expiryStatus.icon} {expiryStatus.label}
                          </span>
                        </td>
                        <td className="text-xs">{new Date(s.debut).toLocaleDateString('fr-FR')}</td>
                        <td className="text-xs">
                          <span className={expiryStatus.color === 'warning' ? 'text-warning font-semibold' : ''}>
                            {new Date(s.fin).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="text-sm font-medium text-primary">{s.montant.toLocaleString('fr-FR')} FCFA</td>
                        <td className="text-xs font-mono text-base-content/60">{s.reference || '—'}</td>
                        <td>
                          <div className="flex gap-1">
                            {s.isActive && (
                              <>
                                <button
                                  onClick={() => sendReminderMutation.mutate(s.user.id)}
                                  className="btn btn-xs btn-ghost btn-square"
                                  title="Envoyer rappel"
                                >
                                  <Mail size={12} />
                                </button>
                                <button
                                  onClick={() => revokeMutation.mutate(s.user.id)}
                                  className="btn btn-xs btn-error btn-outline btn-square"
                                  title="Révoquer"
                                >
                                  <UserX size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-base-200">
                    <td colSpan="8" className="text-sm">
                      Total: {filtered.length} abonnement(s) | Revenus: {filtered.reduce((sum, s) => sum + (s.montant || 0), 0).toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal création abonnement */}
      {showModal && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-warning/20">
                  <Crown size={20} className="text-warning" />
                </div>
                <h3 className="font-bold text-lg">Activer un abonnement</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Recherche utilisateur */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Utilisateur</span>
                </label>
                <input
                  type="text"
                  placeholder="Nom, prénom ou email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
                {usersData?.users?.length > 0 && (
                  <div className="mt-2 border border-base-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {usersData.users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setForm(f => ({ ...f, userId: u.id }))
                          setUserSearch(`${u.prenom} ${u.nom}`)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-base-200 flex items-center gap-3 transition-colors ${
                          form.userId === u.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{u.prenom} {u.nom}</p>
                          <p className="text-[10px] text-base-content/50">{u.email}</p>
                        </div>
                        {form.userId === u.id && <CheckCircle size={14} className="text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Durée */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Durée de l'abonnement</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DUREES.map(d => (
                    <button
                      key={d.jours}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, dureeJours: d.jours, montant: d.prix }))}
                      className={`p-3 rounded-xl border-2 text-sm transition-all ${
                        form.dureeJours === d.jours
                          ? `border-primary bg-primary/5 ring-2 ring-primary/20`
                          : 'border-base-200 hover:border-base-300'
                      }`}
                    >
                      <p className="text-lg font-bold text-primary">{d.prix.toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-xs text-base-content/60">{d.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant personnalisé */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Montant reçu (FCFA)</span>
                </label>
                <input
                  type="number"
                  value={form.montant}
                  onChange={e => setForm(f => ({ ...f, montant: parseInt(e.target.value) || 0 }))}
                  className="input input-bordered input-sm w-full"
                  min={0}
                />
              </div>

              {/* Référence */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Référence T-Money/Orange Money</span>
                  <span className="label-text-alt text-base-content/50">Optionnel</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: TM-20260101-XXXX"
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  className="input input-bordered input-sm w-full"
                  maxLength={100}
                />
              </div>

              {/* Résumé */}
              {form.userId && (
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-3">
                  <p className="text-xs text-base-content/60 mb-1">Résumé</p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total à payer</span>
                    <span className="text-xl font-bold text-primary">{form.montant.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              )}

              <div className="modal-action">
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">
                  Annuler
                </button>
                <button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.userId || createMutation.isPending}
                  className="btn btn-primary btn-sm gap-2"
                >
                  {createMutation.isPending ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Crown size={14} />
                  )}
                  Activer l'abonnement
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
        </div>
      )}
    </AdminLayout>
  )
}