import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Crown, Plus, X, UserCheck, UserX, Search, Calendar } from 'lucide-react'
import { adminApi } from '../../services/api'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const DUREES = [
  { label: '7 jours',   jours: 7,   prix: 500  },
  { label: '30 jours',  jours: 30,  prix: 1500 },
  { label: '90 jours',  jours: 90,  prix: 4000 },
  { label: '365 jours', jours: 365, prix: 12000 },
]

export default function AdminSubscriptions() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ userId: '', dureeJours: 30, montant: 1500, reference: '' })
  const [userSearch, setUserSearch] = useState('')

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['adminSubs'],
    queryFn: () => adminApi.getSubscriptions().then(r => r.data),
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
      toast.success(res.data.message || 'Abonnement activé !')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  })

  const revokeMutation = useMutation({
    mutationFn: (userId) => adminApi.revokeSubscription(userId),
    onSuccess: () => { qc.invalidateQueries(['adminSubs']); toast.success('Abonnement révoqué') },
    onError: () => toast.error('Erreur lors de la révocation'),
  })

  const filtered = subs.filter(s =>
    !search || `${s.user?.nom} ${s.user?.prenom} ${s.user?.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const actifs   = subs.filter(s => s.isActive).length
  const expires  = subs.filter(s => s.isActive && new Date(s.fin) < new Date(Date.now() + 7*86400000)).length

  return (
    <AdminLayout title="Abonnements">
      <div className="space-y-4 max-w-5xl">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total abonnés',        value: subs.length,  color: 'text-primary',  bg: 'bg-primary/10' },
            { label: 'Abonnements actifs',   value: actifs,       color: 'text-success',  bg: 'bg-success/10' },
            { label: 'Expirent dans 7 jours',value: expires,      color: 'text-warning',  bg: 'bg-warning/10' },
          ].map((s, i) => (
            <div key={i} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4 flex-row items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.bg}`}><Crown size={18} className={s.color} /></div>
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-base-content/60">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input type="text" placeholder="Rechercher un abonné..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-9" />
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm gap-2">
            <Plus size={15} /> Nouvel abonnement
          </button>
        </div>

        {/* Info tarifs */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Crown size={16} className="text-warning" /> Grille tarifaire
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DUREES.map(d => (
                <div key={d.jours} className="text-center p-3 bg-base-200 rounded-xl">
                  <p className="font-bold text-primary">{d.prix.toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-xs text-base-content/60">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Liste abonnements */}
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200">
                  <th>Utilisateur</th>
                  <th>Statut</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Montant</th>
                  <th>Référence</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton h-4 w-full"></div></td>)}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-base-content/50">Aucun abonnement trouvé</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="hover">
                    <td>
                      <p className="font-medium text-sm">{s.user?.prenom} {s.user?.nom}</p>
                      <p className="text-xs text-base-content/50">{s.user?.email}</p>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${s.isActive ? 'badge-success' : 'badge-ghost'}`}>
                        {s.isActive ? '✅ Actif' : '⌛ Expiré'}
                      </span>
                    </td>
                    <td className="text-xs">{new Date(s.debut).toLocaleDateString('fr-FR')}</td>
                    <td className="text-xs">
                      <span className={new Date(s.fin) < new Date(Date.now() + 7*86400000) && s.isActive ? 'text-warning font-semibold' : ''}>
                        {new Date(s.fin).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="text-sm">{s.montant.toLocaleString('fr-FR')} FCFA</td>
                    <td className="text-xs text-base-content/60">{s.reference || '—'}</td>
                    <td>
                      {s.isActive && (
                        <button onClick={() => revokeMutation.mutate(s.user.id)}
                          className="btn btn-xs btn-error btn-outline" title="Révoquer">
                          <UserX size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal création abonnement */}
      {showModal && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Crown size={18} className="text-warning" /> Activer un abonnement</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-square"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Recherche utilisateur */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Rechercher l'utilisateur</span></label>
                <input type="text" placeholder="Nom ou email..."
                  value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  className="input input-bordered input-sm w-full" />
                {usersData?.users?.length > 0 && (
                  <div className="mt-1 border border-base-300 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {usersData.users.map(u => (
                      <button key={u.id} onClick={() => { setForm(f => ({ ...f, userId: u.id })); setUserSearch(`${u.prenom} ${u.nom}`) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-base-200 flex items-center gap-2 ${form.userId === u.id ? 'bg-primary/10' : ''}`}>
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-base-content/50">{u.email}</p>
                        </div>
                        {form.userId === u.id && <span className="badge badge-primary badge-xs ml-auto">Sélectionné</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Durée */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Durée</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {DUREES.map(d => (
                    <button key={d.jours} onClick={() => setForm(f => ({ ...f, dureeJours: d.jours, montant: d.prix }))}
                      className={`p-3 rounded-xl border-2 text-sm transition-all ${form.dureeJours === d.jours ? 'border-primary bg-primary/5 font-semibold' : 'border-base-200 hover:border-base-300'}`}>
                      <p className="font-bold text-primary">{d.prix.toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-xs text-base-content/60">{d.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant personnalisé */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Montant reçu (FCFA)</span></label>
                <input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: parseInt(e.target.value) || 0 }))}
                  className="input input-bordered input-sm w-full" min={0} />
              </div>

              {/* Référence */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Référence T-Money <span className="text-base-content/50">(optionnel)</span></span></label>
                <input type="text" placeholder="Ex: TM-20260101-XXXX"
                  value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  className="input input-bordered input-sm w-full" maxLength={100} />
              </div>

              <div className="modal-action">
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">Annuler</button>
                <button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.userId || createMutation.isPending}
                  className="btn btn-primary btn-sm gap-2"
                >
                  {createMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Crown size={14} />}
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