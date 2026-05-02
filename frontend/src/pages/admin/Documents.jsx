// src/pages/admin/AdminDocuments.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle, Trash2, FileText, Download, Calendar, User, Eye } from 'lucide-react'
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
    queryFn: () => adminApi.getDocuments({ search, status: statusFilter, page , limit: 6}).then(r => r.data),
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

  // Stats rapides
  const stats = {
    total: pagination.total ?? 0,
    pending: docs.filter(d => d.status === 'PENDING').length,
    approved: docs.filter(d => d.status === 'APPROVED').length,
    rejected: docs.filter(d => d.status === 'REJECTED').length,
  }

  return (
    <AdminLayout title="Documents">
      <div className="space-y-4 max-w-6xl">
        {/* Recherche et filtre */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, description..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="input input-bordered input-sm w-full pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="select select-bordered select-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">⏳ En attente</option>
                <option value="APPROVED">✅ Approuvés</option>
                <option value="REJECTED">❌ Refusés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-2 flex-wrap">
          <div className="badge badge-lg badge-ghost gap-1">
            <FileText size={12} /> {stats.total} documents
          </div>
          {stats.pending > 0 && (
            <div className="badge badge-lg badge-warning gap-1">
              ⏳ {stats.pending} en attente
            </div>
          )}
          {stats.approved > 0 && (
            <div className="badge badge-lg badge-success gap-1">
              ✅ {stats.approved} approuvés
            </div>
          )}
          {stats.rejected > 0 && (
            <div className="badge badge-lg badge-error gap-1">
              ❌ {stats.rejected} refusés
            </div>
          )}
        </div>

        {/* Cards documents */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 space-y-3">
                  <div className="skeleton h-8 w-8 rounded-lg"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-3 w-1/2"></div>
                  <div className="skeleton h-3 w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-base-content/50">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>Aucun document trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map(doc => {
              const statusConfig = STATUS_LABELS[doc.status] || { label: 'Inconnu', class: 'badge-ghost' }
              
              return (
                <div key={doc.id} className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-4 space-y-3">
                    {/* Header carte */}
                    <div className="flex items-start gap-3">
                      {/* Icône document */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc.status === 'APPROVED' ? 'bg-success/20 text-success' :
                        doc.status === 'REJECTED' ? 'bg-error/20 text-error' :
                        'bg-warning/20 text-warning'
                      }`}>
                        <FileText size={20} />
                      </div>

                      {/* Infos titre */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{doc.titre}</p>
                        <p className="text-xs text-base-content/60 truncate">{doc.fileType?.toUpperCase()} • {formatFileSize(doc.fileSize)}</p>
                        <div className="flex gap-1 mt-1.5">
                          <span className={`badge badge-xs ${statusConfig.class}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Classe / Matière */}
                    <div className="rounded-xl p-2.5 bg-base-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📚</span>
                        <div>
                          <p className="text-xs font-semibold">{getClassLabel(doc.classe)}</p>
                          <p className="text-xs text-base-content/50">{getMatiereLabel(doc.matiere)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Infos supplémentaires */}
                    <div className="space-y-1.5 text-xs">
                      {/* <div className="flex items-center gap-2 text-base-content/60">
                        <User size={11} />
                        <span className="truncate">{doc.uploader?.prenom} {doc.uploader?.nom}</span>
                        <span className="text-base-content/30">•</span>
                        <span className="truncate">{doc.uploader?.email}</span>
                      </div> */}
                      <div className="flex items-center gap-2 text-base-content/60">
                        <Calendar size={11} />
                        <span>Publié le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {doc.description && (
                        <p className="text-base-content/50 line-clamp-2 pt-1 border-t border-base-200">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t border-base-200">
                      {doc.status !== 'APPROVED' && (
                        <button
                          className="btn btn-xs flex-1 btn-success btn-outline"
                          onClick={() => statusMutation.mutate({ id: doc.id, status: 'APPROVED' })}
                          disabled={statusMutation.isPending}
                        >
                          <CheckCircle size={12} /> Approuver
                        </button>
                      )}
                      {doc.status !== 'REJECTED' && (
                        <button
                          className="btn btn-xs flex-1 btn-warning btn-outline"
                          onClick={() => statusMutation.mutate({ id: doc.id, status: 'REJECTED' })}
                          disabled={statusMutation.isPending}
                        >
                          <XCircle size={12} /> Refuser
                        </button>
                      )}
                      <button
                        className="btn btn-xs btn-square btn-error btn-outline"
                        onClick={() => setDeleteDoc(doc)}
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
      </div>

      {/* Modal suppression */}
      {deleteDoc && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmer la suppression</h3>
            <p className="py-4 text-base-content/70">
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{deleteDoc.titre}</span> ?
              <br />Cette action est irréversible.
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