import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserX, Shield, User, FileText, Download } from 'lucide-react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { PROFILS } from '../../utils/constants'
import AdminLayout from '../../components/admin/AdminLayout'
import Pagination from '../../components/Pagination'
import toast from 'react-hot-toast'

const getProfileInfo = (profile) => PROFILS.find(p => p.value === profile)

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', { search, page }],
    queryFn: () => adminApi.getUsers({ search, page , limit: 6 }).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: ({ id, ...data }) => adminApi.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries(['adminUsers']); toast.success('Utilisateur mis à jour') },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  })

  const users = data?.users || []
  const pagination = data?.pagination || {}

  return (
    <AdminLayout title="Utilisateurs">
      <div className="space-y-4 max-w-6xl">
        {/* Recherche */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="relative max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="input input-bordered input-sm w-full pl-9"
              />
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-2 flex-wrap">
          <div className="badge badge-lg badge-ghost gap-1">
            <User size={12} /> {pagination.total ?? '…'} utilisateurs
          </div>
        </div>

        {/* Cards utilisateurs */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 space-y-3">
                  <div className="skeleton h-12 w-12 rounded-full"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-3 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-base-content/50">
            <User size={40} className="mx-auto mb-3 opacity-40" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => {
              const profileInfo = getProfileInfo(u.profile)
              const isSelf = u.id === currentUser?.id

              return (
                <div key={u.id} className={`card bg-base-100 shadow-sm border border-base-200 ${!u.isActive ? 'opacity-60' : ''}`}>
                  <div className="card-body p-4 space-y-3">
                    {/* Header carte */}
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="avatar placeholder flex-shrink-0">
                        <div className={`rounded-full w-12 ${u.role === 'ADMIN' ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'}`}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="rounded-full" />
                          ) : (
                            <span className="text-sm font-bold">{u.prenom?.[0]}{u.nom?.[0]}</span>
                          )}
                        </div>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-base-content/60 truncate">{u.email}</p>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          <span className={`badge badge-xs ${u.role === 'ADMIN' ? 'badge-primary' : 'badge-ghost'}`}>
                            {u.role === 'ADMIN' ? '⚡ Admin' : '👤 User'}
                          </span>
                          <span className={`badge badge-xs ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Niveau / Profil */}
                    <div className={`rounded-xl p-2.5 ${profileInfo ? profileInfo.bgColor : 'bg-base-200'}`}>
                      {profileInfo ? (
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '16px' }}>{profileInfo.icon}</span>
                          <div>
                            <p className="text-xs font-semibold">{profileInfo.label}</p>
                            <p className="text-xs text-base-content/50">{profileInfo.description}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-base-content/50 text-center">Aucun profil défini</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3 text-xs text-base-content/60">
                      <span className="flex items-center gap-1">
                        <FileText size={11} /> {u._count?.documents ?? 0} uploads
                      </span>
                      <span className="flex items-center gap-1">
                        <Download size={11} /> {u._count?.downloads ?? 0} téléch.
                      </span>
                      <span className="ml-auto">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Actions */}
                    {!isSelf && (
                      <div className="flex gap-2 pt-1 border-t border-base-200">
                        <button
                          className={`btn btn-xs flex-1 ${u.isActive ? 'btn-error btn-outline' : 'btn-success btn-outline'}`}
                          onClick={() => mutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={mutation.isPending}
                        >
                          {u.isActive ? <><UserX size={12} /> Désactiver</> : <><UserCheck size={12} /> Activer</>}
                        </button>
                        <button
                          className={`btn btn-xs flex-1 ${u.role === 'ADMIN' ? 'btn-warning btn-outline' : 'btn-primary btn-outline'}`}
                          onClick={() => mutation.mutate({ id: u.id, role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                          disabled={mutation.isPending}
                        >
                          <Shield size={12} />
                          {u.role === 'ADMIN' ? 'Retirer admin' : 'Rendre admin'}
                        </button>
                      </div>
                    )}
                    {isSelf && (
                      <p className="text-xs text-center text-base-content/40 pt-1 border-t border-base-200">C'est vous</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
      </div>
    </AdminLayout>
  )
}