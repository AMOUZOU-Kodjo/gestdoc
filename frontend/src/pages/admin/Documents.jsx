// src/pages/admin/AdminDocuments.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, CheckCircle, XCircle, Trash2, FileText, Calendar, Eye, 
  Grid3x3, Table2, Filter, ChevronDown, Download, ExternalLink,
  Clock, BookOpen, GraduationCap, HardDrive, AlertCircle
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { getClassLabel, getMatiereLabel, STATUS_LABELS, formatFileSize, CLASSES, MATIERES } from '../../utils/constants'
import AdminLayout from '../../components/admin/AdminLayout'
import Pagination from '../../components/Pagination'
import toast from 'react-hot-toast'

// Composant pour l'aperçu rapide
const DocumentPreviewModal = ({ doc, onClose }) => {
  if (!doc) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{doc.titre}</h3>
              <p className="text-xs text-base-content/50">
                {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">✕</button>
        </div>

        <div className="space-y-4">
          {/* Description */}
          {doc.description && (
            <div className="bg-base-200 rounded-lg p-4">
              <p className="text-sm">{doc.description}</p>
            </div>
          )}

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Niveau', value: getClassLabel(doc.classe), icon: <GraduationCap size={14} /> },
              { label: 'Matière', value: getMatiereLabel(doc.matiere), icon: <BookOpen size={14} /> },
              { label: 'Année', value: doc.annee, icon: <Calendar size={14} /> },
              { label: 'Format', value: doc.fileType?.toUpperCase(), icon: <FileText size={14} /> },
              { label: 'Taille', value: formatFileSize(doc.fileSize), icon: <HardDrive size={14} /> },
              { label: 'Téléchargements', value: doc.downloadCount, icon: <Download size={14} /> },
            ].map((item, i) => (
              <div key={i} className="bg-base-200 rounded-lg p-2 flex items-center gap-2">
                <div className="text-base-content/40">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-base-content/50">{item.label}</p>
                  <p className="text-sm font-medium truncate">{item.value || '—'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Uploader */}
          <div className="bg-base-200 rounded-lg p-3">
            <p className="text-xs text-base-content/50 mb-1">Uploadé par</p>
            <p className="text-sm font-medium">
              {doc.uploader?.prenom} {doc.uploader?.nom}
            </p>
            <p className="text-xs text-base-content/50">{doc.uploader?.email}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <a 
              href={doc.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm flex-1 gap-2"
            >
              <ExternalLink size={14} /> Voir le document
            </a>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}

export default function AdminDocuments() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classeFilter, setClasseFilter] = useState('')
  const [matiereFilter, setMatiereFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid | table
  const [page, setPage] = useState(1)
  const [deleteDoc, setDeleteDoc] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [selectedDocs, setSelectedDocs] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['adminDocuments', { search, status: statusFilter, classe: classeFilter, matiere: matiereFilter, page }],
    queryFn: () => adminApi.getDocuments({ 
      search, 
      status: statusFilter, 
      classe: classeFilter,
      matiere: matiereFilter,
      page, 
      limit: 12 
    }).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateDocumentStatus(id, status),
    onSuccess: (_, { status, id }) => {
      qc.invalidateQueries(['adminDocuments'])
      qc.invalidateQueries(['adminStats'])
      toast.success(`Document ${status === 'APPROVED' ? 'approuvé' : 'refusé'}`)
      setSelectedDocs(prev => prev.filter(docId => docId !== id))
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => Promise.all(ids.map(id => adminApi.updateDocumentStatus(id, status))),
    onSuccess: (_, { status, ids }) => {
      qc.invalidateQueries(['adminDocuments'])
      qc.invalidateQueries(['adminStats'])
      toast.success(`${ids.length} document(s) ${status === 'APPROVED' ? 'approuvés' : 'refusés'}`)
      setSelectedDocs([])
    },
    onError: () => toast.error('Erreur lors de l\'opération en masse'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries(['adminDocuments'])
      qc.invalidateQueries(['adminStats'])
      setDeleteDoc(null)
      setSelectedDocs(prev => prev.filter(id => id !== deleteDoc?.id))
      toast.success('Document supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => adminApi.deleteDocument(id))),
    onSuccess: (_, ids) => {
      qc.invalidateQueries(['adminDocuments'])
      qc.invalidateQueries(['adminStats'])
      toast.success(`${ids.length} document(s) supprimé(s)`)
      setSelectedDocs([])
    },
    onError: () => toast.error('Erreur lors de la suppression en masse'),
  })

  const docs = data?.documents || []
  const pagination = data?.pagination || {}

  const stats = {
    total: pagination.total ?? 0,
    pending: docs.filter(d => d.status === 'PENDING').length,
    approved: docs.filter(d => d.status === 'APPROVED').length,
    rejected: docs.filter(d => d.status === 'REJECTED').length,
  }

  const handleSelectAll = () => {
    if (selectedDocs.length === docs.length) {
      setSelectedDocs([])
    } else {
      setSelectedDocs(docs.map(d => d.id))
    }
  }

  const handleSelectDoc = (id) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    )
  }

  const handleBulkApprove = () => {
    if (window.confirm(`Approuver ${selectedDocs.length} document(s) ?`)) {
      bulkStatusMutation.mutate({ ids: selectedDocs, status: 'APPROVED' })
    }
  }

  const handleBulkReject = () => {
    if (window.confirm(`Refuser ${selectedDocs.length} document(s) ?`)) {
      bulkStatusMutation.mutate({ ids: selectedDocs, status: 'REJECTED' })
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Supprimer définitivement ${selectedDocs.length} document(s) ? Action irréversible.`)) {
      bulkDeleteMutation.mutate(selectedDocs)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setClasseFilter('')
    setMatiereFilter('')
    setPage(1)
  }

  const hasActiveFilters = search || statusFilter || classeFilter || matiereFilter

  return (
    <AdminLayout title="Gestion des documents">
      <div className="space-y-4 max-w-full">
        {/* Barre d'outils */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              {/* Recherche */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, description..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="input input-bordered input-sm w-full pl-9"
                />
              </div>

              {/* Actions groupe */}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-base-200">
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

                <select
                  value={classeFilter}
                  onChange={e => { setClasseFilter(e.target.value); setPage(1) }}
                  className="select select-bordered select-sm"
                >
                  <option value="">Tous les niveaux</option>
                  {CLASSES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                <select
                  value={matiereFilter}
                  onChange={e => { setMatiereFilter(e.target.value); setPage(1) }}
                  className="select select-bordered select-sm"
                >
                  <option value="">Toutes les matières</option>
                  {MATIERES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn btn-sm btn-ghost col-span-full">
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
              <FileText size={11} /> Total: {stats.total}
            </div>
            {stats.pending > 0 && (
              <div className="badge badge-md badge-warning gap-1 text-xs">
                ⏳ En attente: {stats.pending}
              </div>
            )}
            {stats.approved > 0 && (
              <div className="badge badge-md badge-success gap-1 text-xs">
                ✅ Approuvés: {stats.approved}
              </div>
            )}
            {stats.rejected > 0 && (
              <div className="badge badge-md badge-error gap-1 text-xs">
                ❌ Refusés: {stats.rejected}
              </div>
            )}
          </div>

          {selectedDocs.length > 0 && (
            <div className="flex gap-2 items-center bg-primary/10 rounded-lg px-3 py-1.5">
              <span className="text-xs font-medium">{selectedDocs.length} sélectionné(s)</span>
              <div className="w-px h-4 bg-base-300" />
              <button
                onClick={handleBulkApprove}
                className="btn btn-xs btn-success btn-outline gap-1"
              >
                <CheckCircle size={12} /> Approuver
              </button>
              <button
                onClick={handleBulkReject}
                className="btn btn-xs btn-warning btn-outline gap-1"
              >
                <XCircle size={12} /> Refuser
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn btn-xs btn-error btn-outline gap-1"
              >
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Vue Grille */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm animate-pulse">
                <div className="card-body p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-2/3" />
                  <div className="skeleton h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 bg-base-100 rounded-xl">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-base-content/60">Aucun document trouvé</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-sm btn-ghost mt-2">
                Effacer les filtres
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {docs.map(doc => {
              const statusConfig = STATUS_LABELS[doc.status] || { label: 'Inconnu', class: 'badge-ghost' }
              const isSelected = selectedDocs.includes(doc.id)
              
              return (
                <div 
                  key={doc.id} 
                  className={`card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 group ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="card-body p-4">
                    {/* Checkbox + Titre + Statut */}
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectDoc(doc.id)}
                        className="checkbox checkbox-xs mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{doc.titre}</p>
                        <p className="text-[10px] text-base-content/50 mt-0.5">
                          {doc.uploader?.prenom} {doc.uploader?.nom}
                        </p>
                      </div>
                      <span className={`badge badge-xs ${statusConfig.class} flex-shrink-0`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Métadonnées */}
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-base-content/60 mt-1">
                      <div className="flex items-center gap-1">
                        <GraduationCap size={10} />
                        <span>{getClassLabel(doc.classe)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen size={10} />
                        <span>{getMatiereLabel(doc.matiere)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive size={10} />
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 pt-2 border-t border-base-200 mt-1">
                      <button
                        className="btn btn-xs btn-ghost flex-1 gap-1"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye size={12} /> Aperçu
                      </button>
                      {doc.status !== 'APPROVED' && (
                        <button
                          className="btn btn-xs btn-success btn-outline"
                          onClick={() => statusMutation.mutate({ id: doc.id, status: 'APPROVED' })}
                          disabled={statusMutation.isPending}
                          title="Approuver"
                        >
                          <CheckCircle size={12} />
                        </button>
                      )}
                      {doc.status !== 'REJECTED' && (
                        <button
                          className="btn btn-xs btn-warning btn-outline"
                          onClick={() => statusMutation.mutate({ id: doc.id, status: 'REJECTED' })}
                          disabled={statusMutation.isPending}
                          title="Refuser"
                        >
                          <XCircle size={12} />
                        </button>
                      )}
                      <button
                        className="btn btn-xs btn-error btn-outline"
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
        ) : (
          /* Vue Tableau */
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="w-8">
                    <input
                      type="checkbox"
                      checked={selectedDocs.length === docs.length && docs.length > 0}
                      onChange={handleSelectAll}
                      className="checkbox checkbox-xs"
                    />
                  </th>
                  <th>Titre</th>
                  <th>Uploader</th>
                  <th>Niveau</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => {
                  const statusConfig = STATUS_LABELS[doc.status]
                  const isSelected = selectedDocs.includes(doc.id)
                  
                  return (
                    <tr key={doc.id} className={isSelected ? 'bg-primary/5' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectDoc(doc.id)}
                          className="checkbox checkbox-xs"
                        />
                      </td>
                      <td>
                        <div className="font-medium text-sm">{doc.titre}</div>
                        <div className="text-xs text-base-content/50">{doc.fileType?.toUpperCase()} • {formatFileSize(doc.fileSize)}</div>
                      </td>
                      <td className="text-sm">
                        {doc.uploader?.prenom} {doc.uploader?.nom}
                      </td>
                      <td className="text-sm">{getClassLabel(doc.classe)}</td>
                      <td>
                        <span className={`badge badge-sm ${statusConfig?.class}`}>
                          {statusConfig?.label}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/60">
                        {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-xs btn-ghost btn-square"
                            onClick={() => setPreviewDoc(doc)}
                            title="Aperçu"
                          >
                            <Eye size={12} />
                          </button>
                          {doc.status !== 'APPROVED' && (
                            <button
                              className="btn btn-xs btn-success btn-outline btn-square"
                              onClick={() => statusMutation.mutate({ id: doc.id, status: 'APPROVED' })}
                              title="Approuver"
                            >
                              <CheckCircle size={12} />
                            </button>
                          )}
                          {doc.status !== 'REJECTED' && (
                            <button
                              className="btn btn-xs btn-warning btn-outline btn-square"
                              onClick={() => statusMutation.mutate({ id: doc.id, status: 'REJECTED' })}
                              title="Refuser"
                            >
                              <XCircle size={12} />
                            </button>
                          )}
                          <button
                            className="btn btn-xs btn-error btn-outline btn-square"
                            onClick={() => setDeleteDoc(doc)}
                            title="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
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

      {/* Modal suppression */}
      {deleteDoc && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-error/10 rounded-lg">
                <AlertCircle size={24} className="text-error" />
              </div>
              <h3 className="font-bold text-lg">Confirmer la suppression</h3>
            </div>
            <p className="py-4">
              Supprimer définitivement <span className="font-semibold">{deleteDoc.titre}</span> ?
              <br />
              <span className="text-sm text-base-content/60">Cette action est irréversible.</span>
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteDoc(null)}>Annuler</button>
              <button
                className="btn btn-error"
                onClick={() => deleteMutation.mutate(deleteDoc.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <span className="loading loading-spinner loading-sm mr-2"></span>}
                Supprimer
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteDoc(null)}></div>
        </div>
      )}

      {/* Modal aperçu */}
      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </AdminLayout>
  )
}