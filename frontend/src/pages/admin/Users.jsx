import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserX, Shield, User, FileText, Download, Calendar } from 'lucide-react'
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
    queryFn: () => adminApi.getUsers({ search, page, limit: 12 }).then(r => r.data),
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
      <div className="space-y-4 max-w-full">
        {/* Recherche */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-3">
            <div className="relative max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="input input-bordered input-xs w-full pl-8"
              />
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-1.5 flex-wrap">
          <div className="badge badge-md badge-ghost gap-1 text-xs">
            <User size={11} /> {pagination.total ?? '…'} utilisateurs
          </div>
        </div>

        {/* Cards utilisateurs ultra compactes */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm">
                <div className="card-body p-3 space-y-2">
                  <div className="skeleton h-8 w-8 rounded-full"></div>
                  <div className="skeleton h-3 w-full"></div>
                  <div className="skeleton h-2 w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-base-content/50">
            <User size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {users.map(u => {
              const profileInfo = getProfileInfo(u.profile)
              const isSelf = u.id === currentUser?.id

              return (
                <div key={u.id} className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow ${!u.isActive ? 'opacity-60' : ''}`}>
                  <div className="card-body p-3">
                    {/* Ligne 1: Avatar + Nom + Rôle */}
                    <div className="flex items-start gap-2">
                      {/* Avatar miniature */}
                      <div className="avatar placeholder flex-shrink-0">
                        <div className={`rounded-full w-8 h-8 ${u.role === 'ADMIN' ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'} flex items-center justify-center text-xs font-bold`}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="rounded-full w-full h-full object-cover" />
                          ) : (
                            <span>{u.prenom?.[0]}{u.nom?.[0]}</span>
                          )}
                        </div>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-medium text-xs truncate">{u.prenom} {u.nom}</p>
                          <div className="flex gap-0.5 flex-shrink-0">
                            <span className={`badge badge-xs ${u.role === 'ADMIN' ? 'badge-primary' : 'badge-ghost'}`}>
                              {u.role === 'ADMIN' ? '⚡' : '👤'}
                            </span>
                            <span className={`badge badge-xs ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                              {u.isActive ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-base-content/50 truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Profil utilisateur */}
                    {profileInfo && (
                      <div className={`rounded-md px-2 py-1 ${profileInfo.bgColor || 'bg-base-200'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{profileInfo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold truncate">{profileInfo.label}</p>
                            <p className="text-[9px] text-base-content/50 truncate">{profileInfo.description}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats utilisateur */}
                    <div className="flex items-center justify-between text-[10px] text-base-content/50">
                      <div className="flex gap-2">
                        <span className="flex items-center gap-0.5">
                          <FileText size={9} /> {u._count?.documents ?? 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Download size={9} /> {u._count?.downloads ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Calendar size={8} />
                        <span>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {/* Actions compactes */}
                    {!isSelf && (
                      <div className="flex gap-1 pt-1 border-t border-base-200 mt-0.5">
                        <button
                          className={`btn btn-xs flex-1 gap-0.5 text-[10px] h-6 min-h-0 ${u.isActive ? 'btn-error btn-outline' : 'btn-success btn-outline'}`}
                          onClick={() => mutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={mutation.isPending}
                        >
                          {u.isActive ? <UserX size={9} /> : <UserCheck size={9} />}
                          {u.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          className={`btn btn-xs flex-1 gap-0.5 text-[10px] h-6 min-h-0 ${u.role === 'ADMIN' ? 'btn-warning btn-outline' : 'btn-primary btn-outline'}`}
                          onClick={() => mutation.mutate({ id: u.id, role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                          disabled={mutation.isPending}
                        >
                          <Shield size={9} />
                          {u.role === 'ADMIN' ? 'Retirer' : 'Rendre admin'}
                        </button>
                      </div>
                    )}
                    {isSelf && (
                      <p className="text-[9px] text-center text-base-content/40 pt-1 border-t border-base-200 mt-0.5">
                        C'est vous
                      </p>
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