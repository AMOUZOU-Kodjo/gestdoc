// src/pages/admin/AdminDocuments.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle, Trash2, FileText, Calendar, Eye } from 'lucide-react'
import { adminApi } from '../../services/api'
import { getClassLabel, getMatiereLabel, STATUS_LABELS, formatFileSize } from '../../utils/constants'
import AdminLayout from '../../components/admin/AdminLayout'
import Pagination from '../../components/Pagination'
import toast from 'react-hot-toast'

export default function AdminDocuments() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [deleteDoc, setDeleteDoc] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['adminDocuments', { search, status: statusFilter, page }],
    queryFn: () => adminApi.getDocuments({ search, status: statusFilter, page, limit: 9 }).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateDocumentStatus(id, status),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries(['adminDocuments'])
      qc.invalidateQueries(['adminStats'])
      toast.success(`Document ${status === 'APPROVED' ? 'approuvé' : status === 'REJECTED' ? 'refusé' : 'mis à jour'}`)
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries(['adminDocuments'])
      qc.invalidateQueries(['adminStats'])
      setDeleteDoc(null)
      toast.success('Document supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const docs = data?.documents || []
  const pagination = data?.pagination || {}

  const stats = {
    total: pagination.total ?? 0,
    pending: docs.filter(d => d.status === 'PENDING').length,
    approved: docs.filter(d => d.status === 'APPROVED').length,
    rejected: docs.filter(d => d.status === 'REJECTED').length,
  }

  return (
    <AdminLayout title="Documents">
      <div className="space-y-4 max-w-full">
        {/* Recherche et filtre */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-40">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="input input-bordered input-xs w-full pl-8"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="select select-bordered select-xs"
              >
                <option value="">Tous</option>
                <option value="PENDING">⏳ En attente</option>
                <option value="APPROVED">✅ Approuvés</option>
                <option value="REJECTED">❌ Refusés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-1.5 flex-wrap">
          <div className="badge badge-md badge-ghost gap-1 text-xs">
            <FileText size={11} /> {stats.total}
          </div>
          {stats.pending > 0 && (
            <div className="badge badge-md badge-warning gap-1 text-xs">
              ⏳ {stats.pending}
            </div>
          )}
          {stats.approved > 0 && (
            <div className="badge badge-md badge-success gap-1 text-xs">
              ✅ {stats.approved}
            </div>
          )}
          {stats.rejected > 0 && (
            <div className="badge badge-md badge-error gap-1 text-xs">
              ❌ {stats.rejected}
            </div>
          )}
        </div>

        {/* Cards documents très compactes */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm">
                <div className="card-body p-3 space-y-2">
                  <div className="skeleton h-6 w-6 rounded"></div>
                  <div className="skeleton h-3 w-full"></div>
                  <div className="skeleton h-2 w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 text-base-content/50">
            <FileText size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun document trouvé</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {docs.map(doc => {
                const statusConfig = STATUS_LABELS[doc.status] || { label: 'Inconnu', class: 'badge-ghost' }
                
                return (
                  <div key={doc.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
                    <div className="card-body p-3">
                      {/* Ligne 1: Titre + statut */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                            doc.status === 'APPROVED' ? 'bg-success/20 text-success' :
                            doc.status === 'REJECTED' ? 'bg-error/20 text-error' :
                            'bg-warning/20 text-warning'
                          }`}>
                            <FileText size={12} />
                          </div>
                          <p className="font-medium text-xs truncate flex-1">{doc.titre}</p>
                        </div>
                        <span className={`badge badge-xs ${statusConfig.class} flex-shrink-0`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Ligne 2: Type + taille */}
                      <div className="flex items-center justify-between text-xs text-base-content/50">
                        <span className="text-[10px] font-mono">{doc.fileType?.toUpperCase() || 'DOC'}</span>
                        <span className="text-[10px]">{formatFileSize(doc.fileSize)}</span>
                      </div>

                      {/* Ligne 3: Classe / Matière */}
                      <div className="text-[10px] bg-base-200 rounded-md px-2 py-1 flex items-center justify-between">
                        <span className="font-medium">{getClassLabel(doc.classe)}</span>
                        <span className="text-base-content/50">•</span>
                        <span>{getMatiereLabel(doc.matiere)}</span>
                      </div>

                      {/* Ligne 4: Date */}
                      <div className="flex items-center gap-1 text-[10px] text-base-content/50">
                        <Calendar size={9} />
                        <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>

                      {/* Ligne 5: Actions compactes */}
                      <div className="flex gap-1 pt-1 border-t border-base-200 mt-1">
                        {doc.status !== 'APPROVED' && (
                          <button
                            className="btn btn-xs btn-success btn-outline flex-1 gap-0.5 text-[10px] h-6 min-h-0"
                            onClick={() => statusMutation.mutate({ id: doc.id, status: 'APPROVED' })}
                            disabled={statusMutation.isPending}
                          >
                            <CheckCircle size={10} /> Approuver
                          </button>
                        )}
                        {doc.status !== 'REJECTED' && (
                          <button
                            className="btn btn-xs btn-warning btn-outline flex-1 gap-0.5 text-[10px] h-6 min-h-0"
                            onClick={() => statusMutation.mutate({ id: doc.id, status: 'REJECTED' })}
                            disabled={statusMutation.isPending}
                          >
                            <XCircle size={10} /> Refuser
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-error btn-outline btn-square h-6 min-h-0 w-6"
                          onClick={() => setDeleteDoc(doc)}
                          title="Supprimer"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
      </div>

      {/* Modal suppression */}
      {deleteDoc && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmer la suppression</h3>
            <p className="py-4 text-base-content/70">
              Supprimer <span className="font-semibold">{deleteDoc.titre}</span> ?
              <br />Action irréversible.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteDoc(null)}>Annuler</button>
              <button
                className="btn btn-error"
                onClick={() => deleteMutation.mutate(deleteDoc.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <span className="loading loading-spinner loading-sm"></span>}
                Supprimer
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteDoc(null)}></div>
        </div>
      )}
    </AdminLayout>
  )
}