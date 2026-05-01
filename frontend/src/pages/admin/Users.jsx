// src/pages/admin/Users.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, UserCheck, UserX, Shield, User } from 'lucide-react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', { search, page }],
    queryFn: () => adminApi.getUsers({ search, page }).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['adminUsers'])
      toast.success('Utilisateur mis à jour')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  })

  const users = data?.users || []
  const pagination = data?.pagination || {}

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="btn btn-ghost btn-sm btn-square"><ArrowLeft size={18} /></Link>
          <h1 className="text-xl font-bold">Gestion des Utilisateurs</h1>
        </div>

        {/* Search */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="input input-bordered input-sm w-full max-w-sm pl-9"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200">
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Documents</th>
                  <th>Téléchargements</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton h-4 w-full"></div></td>)}</tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-base-content/50">
                      <User size={36} className="mx-auto mb-2 opacity-40" />
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                          <div className="bg-primary/10 text-primary rounded-full w-8">
                            <span className="text-xs">{u.prenom?.[0]}{u.nom?.[0]}</span>
                          </div>
                        </div>
                        <span className="font-medium text-sm">{u.prenom} {u.nom}</span>
                      </div>
                    </td>
                    <td className="text-sm text-base-content/70">{u.email}</td>
                    <td>
                      <span className={`badge badge-sm ${u.role === 'ADMIN' ? 'badge-primary' : 'badge-ghost'}`}>
                        {u.role === 'ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="text-sm text-center">{u._count?.documents ?? 0}</td>
                    <td className="text-sm text-center">{u._count?.downloads ?? 0}</td>
                    <td>
                      <span className={`badge badge-sm ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      {u.id !== currentUser?.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            className={`btn btn-xs btn-outline ${u.isActive ? 'btn-error' : 'btn-success'}`}
                            onClick={() => updateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                            disabled={updateMutation.isPending}
                            title={u.isActive ? 'Désactiver' : 'Réactiver'}
                          >
                            {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                          <button
                            className={`btn btn-xs btn-outline ${u.role === 'ADMIN' ? 'btn-warning' : 'btn-primary'}`}
                            onClick={() => updateMutation.mutate({ id: u.id, role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                            disabled={updateMutation.isPending}
                            title={u.role === 'ADMIN' ? 'Retirer admin' : 'Promouvoir admin'}
                          >
                            <Shield size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-base-content/40 italic">Vous</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-base-200">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
              <span className="btn btn-sm btn-ghost no-animation">Page {page} / {pagination.totalPages}</span>
              <button className="btn btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
