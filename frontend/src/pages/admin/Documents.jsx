// src/pages/admin/Documents.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Trash2, Search, ArrowLeft, FileText, Filter } from 'lucide-react'
import { adminApi } from '../../services/api'
import { getClassLabel, getMatiereLabel, STATUS_LABELS, formatFileSize } from '../../utils/constants'
import toast from 'react-hot-toast'

export default function AdminDocuments() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ page: 1, status: '', search: '' })
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['adminDocuments', filters],
    queryFn: () => adminApi.getDocuments(filters).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateDocumentStatus(id, status),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries(['adminDocuments'])
      qc.invalidateQueries(['adminStats'])
      toast.success(`Document ${status === 'APPROVED' ? 'approuvé' : 'refusé'}`)
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries(['adminDocuments'])
      qc.invalidateQueries(['adminStats'])
      setDeleteId(null)
      toast.success('Document supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const docs = data?.documents || []
  const pagination = data?.pagination || {}

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/admin" className="btn btn-ghost btn-sm btn-square"><ArrowLeft size={18} /></Link>
          <h1 className="text-xl font-bold">Gestion des Documents</h1>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                  className="input input-bordered input-sm w-full pl-9"
                />
              </div>
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                className="select select-bordered select-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="APPROVED">Approuvés</option>
                <option value="REJECTED">Refusés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200">
                  <th>Document</th>
                  <th>Classe / Matière</th>
                  <th>Année</th>
                  <th>Uploadé par</th>
                  <th>Taille</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full"></div></td>
                      ))}
                    </tr>
                  ))
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-base-content/50">
                      <FileText size={36} className="mx-auto mb-2 opacity-40" />
                      Aucun document trouvé
                    </td>
                  </tr>
                ) : docs.map(doc => (
                  <tr key={doc.id} className="hover">
                    <td className="max-w-xs">
                      <p className="font-medium text-sm truncate">{doc.titre}</p>
                      <p className="text-xs text-base-content/50">{doc.fileType?.toUpperCase()}</p>
                    </td>
                    <td>
                      <p className="text-sm">{getClassLabel(doc.classe)}</p>
                      <p className="text-xs text-base-content/50">{getMatiereLabel(doc.matiere)}</p>
                    </td>
                    <td className="text-sm">{doc.annee}</td>
                    <td>
                      <p className="text-sm">{doc.uploader?.prenom} {doc.uploader?.nom}</p>
                      <p className="text-xs text-base-content/50 truncate max-w-32">{doc.uploader?.email}</p>
                    </td>
                    <td className="text-xs text-base-content/60">{formatFileSize(doc.fileSize)}</td>
                    <td>
                      <span className={`badge badge-sm ${STATUS_LABELS[doc.status]?.class}`}>
                        {STATUS_LABELS[doc.status]?.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {doc.status !== 'APPROVED' && (
                          <button
                            className="btn btn-xs btn-success btn-outline"
                            onClick={() => statusMutation.mutate({ id: doc.id, status: 'APPROVED' })}
                            disabled={statusMutation.isPending}
                            title="Approuver"
                          >
                            <CheckCircle size={13} />
                          </button>
                        )}
                        {doc.status !== 'REJECTED' && (
                          <button
                            className="btn btn-xs btn-warning btn-outline"
                            onClick={() => statusMutation.mutate({ id: doc.id, status: 'REJECTED' })}
                            disabled={statusMutation.isPending}
                            title="Refuser"
                          >
                            <XCircle size={13} />
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-error btn-outline"
                          onClick={() => setDeleteId(doc.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-base-200">
              <button className="btn btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>←</button>
              <span className="btn btn-sm btn-ghost no-animation">Page {filters.page} / {pagination.totalPages}</span>
              <button className="btn btn-sm" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>→</button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmer la suppression</h3>
            <p className="py-4 text-base-content/70">Cette action est irréversible. Le document sera supprimé définitivement.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Annuler</button>
              <button
                className="btn btn-error"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <span className="loading loading-spinner loading-sm"></span> : null}
                Supprimer
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteId(null)}></div>
        </div>
      )}
    </div>
  )
}
