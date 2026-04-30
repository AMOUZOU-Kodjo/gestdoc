// src/pages/Home.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, FileText, Upload, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { documentsApi } from '../services/api'
import DocumentCard from '../components/DocumentCard'
import FilterBar from '../components/FilterBar'
import { useAuth } from '../contexts/AuthContext'

const DEFAULT_FILTERS = { search: '', classe: '', matiere: '', annee: '', page: 1, limit: 12 }

export default function Home() {
  const { user } = useAuth()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentsApi.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  })

  const documents = data?.documents || []
  const pagination = data?.pagination || {}

  return (
    <div className="min-h-screen bg-base-200">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-secondary text-primary-content py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <BookOpen size={40} />
            </div>
          </div>
          <h1 className="text-4xl  font-bold mb-3">GestDoc</h1>
          <p className="text-lg text-primary-content/80 mb-8 max-w-xl mx-auto">
            Plateforme de partage de documents scolaires — cours, exercices, annales pour le lycée et le collège.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {!user ? (
              <>
                <Link to="/register" className="btn btn-white btn-lg gap-2">
                  <Users size={20} /> Créer un compte
                </Link>
                <Link to="/login" className="btn btn-outline btn-white btn-lg">
                  Se connecter
                </Link>
              </>
            ) : (
              <Link to="/upload" className="btn btn-white btn-lg gap-2">
                <Upload size={20} /> Uploader un document
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {pagination.total > 0 && (
        <div className="bg-base-100 border-b border-base-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-base-content/60">
            <FileText size={15} />
            <span><strong className="text-base-content">{pagination.total}</strong> document{pagination.total > 1 ? 's' : ''} disponible{pagination.total > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-md">
                <div className="card-body p-4 space-y-3">
                  <div className="skeleton h-6 w-full"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-4 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="alert alert-error">
            <span>Erreur lors du chargement des documents. Veuillez réessayer.</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold text-base-content/60">Aucun document trouvé</h3>
            <p className="text-sm text-base-content/40 mt-1">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map(doc => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <button
              className="btn btn-sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            >
              ← Précédent
            </button>
            <span className="btn btn-sm btn-ghost no-animation">
              Page {filters.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-sm"
              disabled={filters.page >= pagination.totalPages}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
