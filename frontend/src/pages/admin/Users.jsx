// src/pages/admin/AdminUsers.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, UserCheck, UserX, Shield, User, FileText, Download, Calendar,
  Grid3x3, Table2, Filter, ChevronDown, Mail, Phone, MapPin, 
  Award, Clock, AlertCircle, Edit2, Save, X, Trash2
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { PROFILS } from '../../utils/constants'
import AdminLayout from '../../components/admin/AdminLayout'
import Pagination from '../../components/Pagination'
import toast from 'react-hot-toast'

const getProfileInfo = (profile) => PROFILS.find(p => p.value === profile)

// Modal d'édition utilisateur
const EditUserModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    profile: user?.profile || '',
    isActive: user?.isActive ?? true,
    role: user?.role || 'USER',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onUpdate(formData)
      onClose()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Edit2 size={20} className="text-primary" />
            <h3 className="font-bold text-lg">Modifier l'utilisateur</h3>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">Prénom</span>
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="input input-bordered input-sm"
                required
              />
            </div>
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs">Nom</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="input input-bordered input-sm"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs">Email</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input input-bordered input-sm"
              required
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs">Profil académique</span>
            </label>
            <select
              value={formData.profile}
              onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
              className="select select-bordered select-sm"
            >
              <option value="">Sélectionner un profil</option>
              {PROFILS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.icon} {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label cursor-pointer py-1 justify-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="checkbox checkbox-sm"
                />
                <span className="label-text text-xs">Compte actif</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer py-1 justify-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.role === 'ADMIN'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.checked ? 'ADMIN' : 'USER' })}
                  className="checkbox checkbox-sm"
                />
                <span className="label-text text-xs">Administrateur</span>
              </label>
            </div>
          </div>

          <div className="modal-action pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-xs"></span> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', { search, role: roleFilter, status: statusFilter, page }],
    queryFn: () => adminApi.getUsers({ 
      search, 
      role: roleFilter,
      isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      page, 
      limit: 12 
    }).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => adminApi.updateUser(id, data),
    onSuccess: () => { 
      qc.invalidateQueries(['adminUsers'])
      qc.invalidateQueries(['adminStats'])
      toast.success('Utilisateur mis à jour')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries(['adminUsers'])
      qc.invalidateQueries(['adminStats'])
      toast.success('Utilisateur supprimé')
      setSelectedUsers(prev => prev.filter(id => id !== editingUser?.id))
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, isActive }) => Promise.all(ids.map(id => adminApi.updateUser(id, { isActive }))),
    onSuccess: (_, { ids, isActive }) => {
      qc.invalidateQueries(['adminUsers'])
      qc.invalidateQueries(['adminStats'])
      toast.success(`${ids.length} utilisateur(s) ${isActive ? 'activé(s)' : 'désactivé(s)'}`)
      setSelectedUsers([])
    },
    onError: () => toast.error('Erreur lors de l\'opération'),
  })

  const users = data?.users || []
  const pagination = data?.pagination || {}

  const stats = {
    total: pagination.total ?? 0,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'ADMIN').length,
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const handleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    )
  }

  const handleBulkStatus = (isActive) => {
    if (window.confirm(`${isActive ? 'Activer' : 'Désactiver'} ${selectedUsers.length} utilisateur(s) ?`)) {
      bulkStatusMutation.mutate({ ids: selectedUsers, isActive })
    }
  }

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const hasActiveFilters = search || roleFilter || statusFilter

  return (
    <AdminLayout title="Gestion des utilisateurs">
      <div className="space-y-4 max-w-full">
        {/* Barre d'outils */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, email..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
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
                  {hasActiveFilters && <span className="badge badge-xs badge-primary">!</span>}
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
              </div>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-base-200">
                <select
                  value={roleFilter}
                  onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
                  className="select select-bordered select-sm"
                >
                  <option value="">Tous les rôles</option>
                  <option value="ADMIN">Administrateurs</option>
                  <option value="USER">Utilisateurs</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                  className="select select-bordered select-sm"
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn btn-sm btn-ghost">
                    Effacer les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats et actions en masse */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap">
            <div className="badge badge-md badge-ghost gap-1 text-xs">
              <User size={11} /> Total: {stats.total}
            </div>
            <div className="badge badge-md badge-success gap-1 text-xs">
              ✅ Actifs: {stats.active}
            </div>
            {stats.inactive > 0 && (
              <div className="badge badge-md badge-error gap-1 text-xs">
                ❌ Inactifs: {stats.inactive}
              </div>
            )}
            <div className="badge badge-md badge-primary gap-1 text-xs">
              🛡️ Admins: {stats.admins}
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex gap-2 items-center bg-primary/10 rounded-lg px-3 py-1.5">
              <span className="text-xs font-medium">{selectedUsers.length} sélectionné(s)</span>
              <div className="w-px h-4 bg-base-300" />
              <button
                onClick={() => handleBulkStatus(true)}
                className="btn btn-xs btn-success btn-outline gap-1"
              >
                <UserCheck size={12} /> Activer
              </button>
              <button
                onClick={() => handleBulkStatus(false)}
                className="btn btn-xs btn-error btn-outline gap-1"
              >
                <UserX size={12} /> Désactiver
              </button>
            </div>
          )}
        </div>

        {/* Liste des utilisateurs */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
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
                  <div className="skeleton h-6 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-base-100 rounded-xl">
            <User size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-base-content/60">Aucun utilisateur trouvé</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-sm btn-ghost mt-2">
                Effacer les filtres
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map(u => {
              const profileInfo = getProfileInfo(u.profile)
              const isSelf = u.id === currentUser?.id
              const isSelected = selectedUsers.includes(u.id)

              return (
                <div 
                  key={u.id} 
                  className={`card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 group ${
                    !u.isActive ? 'opacity-60' : ''
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="card-body p-4">
                    {/* Header avec checkbox et avatar */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectUser(u.id)}
                        className="checkbox checkbox-xs mt-1"
                        disabled={isSelf}
                      />
                      
                      <div className="avatar placeholder">
                        <div className={`rounded-full w-10 h-10 ${
                          u.role === 'ADMIN' 
                            ? 'bg-gradient-to-br from-primary to-secondary text-primary-content' 
                            : 'bg-base-200 text-base-content'
                        } flex items-center justify-center text-sm font-bold`}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="rounded-full w-full h-full object-cover" />
                          ) : (
                            <span>{u.prenom?.[0]}{u.nom?.[0]}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <p className="font-semibold text-sm truncate">{u.prenom} {u.nom}</p>
                          <div className="flex gap-1">
                            {u.role === 'ADMIN' && (
                              <span className="badge badge-primary badge-xs">Admin</span>
                            )}
                            <span className={`badge badge-xs ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                              {u.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-base-content/50 truncate flex items-center gap-1 mt-0.5">
                          <Mail size={10} />
                          {u.email}
                        </p>
                      </div>
                    </div>

                    {/* Profil académique */}
                    {profileInfo && (
                      <div className={`rounded-lg p-2 ${profileInfo.bgColor || 'bg-base-200'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{profileInfo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{profileInfo.label}</p>
                            <p className="text-[10px] text-base-content/50 truncate">
                              {profileInfo.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-base-content/50">
                      <div className="flex items-center gap-1">
                        <FileText size={10} />
                        <span>{u._count?.documents ?? 0} documents</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download size={10} />
                        <span>{u._count?.downloads ?? 0} téléch.</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <Calendar size={10} />
                        <span>Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isSelf && (
                      <div className="flex gap-2 pt-2 border-t border-base-200 mt-1">
                        <button
                          className={`btn btn-xs flex-1 gap-1 ${
                            u.isActive ? 'btn-error btn-outline' : 'btn-success btn-outline'
                          }`}
                          onClick={() => updateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={updateMutation.isPending}
                        >
                          {u.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                          {u.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          className="btn btn-xs btn-primary btn-outline flex-1 gap-1"
                          onClick={() => setEditingUser(u)}
                        >
                          <Edit2 size={12} /> Modifier
                        </button>
                      </div>
                    )}
                    {isSelf && (
                      <div className="text-center text-[10px] text-base-content/40 pt-2 border-t border-base-200">
                        C'est vous
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Vue Tableau */
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-8">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="checkbox checkbox-xs"
                    />
                  </th>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Profil</th>
                  <th>Documents</th>
                  <th>Statut</th>
                  <th>Inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSelf = u.id === currentUser?.id
                  const isSelected = selectedUsers.includes(u.id)
                  const profileInfo = getProfileInfo(u.profile)

                  return (
                    <tr key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectUser(u.id)}
                          className="checkbox checkbox-xs"
                          disabled={isSelf}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar placeholder">
                            <div className={`rounded-full w-8 h-8 ${
                              u.role === 'ADMIN' ? 'bg-primary text-primary-content' : 'bg-base-200'
                            } flex items-center justify-center text-xs font-bold`}>
                              {u.prenom?.[0]}{u.nom?.[0]}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{u.prenom} {u.nom}</div>
                            {u.role === 'ADMIN' && <span className="badge badge-primary badge-xs">Admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{u.email}</td>
                      <td>
                        {profileInfo && (
                          <div className="flex items-center gap-1">
                            <span>{profileInfo.icon}</span>
                            <span className="text-xs">{profileInfo.label}</span>
                          </div>
                        )}
                      </td>
                      <td className="text-sm">{u._count?.documents ?? 0}</td>
                      <td>
                        <span className={`badge badge-sm ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/60">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-xs btn-ghost btn-square"
                            onClick={() => setEditingUser(u)}
                            title="Modifier"
                          >
                            <Edit2 size={12} />
                          </button>
                          {!isSelf && (
                            <button
                              className={`btn btn-xs ${u.isActive ? 'btn-error' : 'btn-success'} btn-outline btn-square`}
                              onClick={() => updateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                              title={u.isActive ? 'Désactiver' : 'Activer'}
                            >
                              {u.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
      </div>

      {/* Modal d'édition */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={(data) => updateMutation.mutate({ id: editingUser.id, ...data })}
        />
      )}
    </AdminLayout>
  )
}