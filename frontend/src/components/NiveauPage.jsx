import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, Upload, Lock } from 'lucide-react'
import { documentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getNiveauxForProfile, CLASSES_BY_NIVEAU, MATIERES_BY_NIVEAU } from '../utils/constants'
import DocumentCard from './DocumentCard'
import FilterBar    from './FilterBar'
import Pagination   from './Pagination'

const DEFAULT_FILTERS = { search: '', classe: '', matiere: '', annee: '', page: 1, limit: 12 }

export default function NiveauPage({ niveau, title, subtitle, classes, matieres }) {
  const { user, hasAllAccess } = useAuth()
  const [filters, setFilters]  = useState(DEFAULT_FILTERS)

  // Toujours dériver depuis le niveau — garantit qu'on n'affiche que les classes du niveau
  const niveauClasses  = (classes  && classes.length  > 0) ? classes  : (CLASSES_BY_NIVEAU[niveau]  || [])
  const niveauMatieres = (matieres && matieres.length > 0) ? matieres : (MATIERES_BY_NIVEAU[niveau] || [])

  const canAccess = !user || hasAllAccess || getNiveauxForProfile(user.profile).includes(niveau)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['documents', niveau, filters],
    queryFn:  () => documentsApi.getAll({ ...filters, niveau }).then(r => r.data),
    keepPreviousData: true,
  })

  const documents   = data?.documents   || []
  const pagination  = data?.pagination  || {}

  const handlePageChange = (newPage) => {
    setFilters(f => ({ ...f, page: newPage }))
    // Scroll haut de la liste
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Accès refusé pour un utilisateur avec le mauvais profil
  if (user && !canAccess) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center p-8">
            <Lock size={48} className="text-warning mb-3" />
            <h2 className="text-xl font-bold">Accès restreint</h2>
            <p className="text-base-content/60 text-sm mt-2">
              Cette section est réservée aux utilisateurs ayant le profil correspondant.
            </p>
            <div className="flex gap-3 mt-5">
              <Link to="/profile" className="btn btn-primary btn-sm">Modifier mon profil</Link>
              <Link to="/"        className="btn btn-ghost btn-sm">Accueil</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Couleurs par niveau
  const HEADER_COLORS = {
    BEPC:       'from-cyan-600    to-cyan-800',
    PREMIERE:   'from-emerald-600 to-emerald-800',
    TERMINALE:  'from-amber-500   to-amber-700',
    UNIVERSITE: 'from-violet-600  to-violet-800',
  }
  const headerBg = HEADER_COLORS[niveau] || 'from-primary to-secondary'

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header coloré */}
      <div className={`bg-gradient-to-br ${headerBg} text-white py-10 px-4`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-white/80 mt-1 text-sm">{subtitle}</p>
            </div>
            {user && (
              <Link to={`/upload?niveau=${niveau}`} className="btn btn-white btn-sm gap-2">
                <Upload size={15} /> Contribuer
              </Link>
            )}
          </div>

          {/* Classes pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setFilters(f => ({ ...f, classe: '', page: 1 }))}
              className={`badge badge-lg cursor-pointer transition-all ${
                !filters.classe ? 'badge-white font-bold' : 'badge-outline badge-white opacity-70 hover:opacity-100'
              }`}
            >
              Toutes
            </button>
            {niveauClasses.map(c => (
              <button
                key={c.value}
                onClick={() => setFilters(f => ({ ...f, classe: f.classe === c.value ? '' : c.value, page: 1 }))}
                className={`badge badge-lg cursor-pointer transition-all ${
                  filters.classe === c.value
                    ? 'badge-white font-bold'
                    : 'badge-outline badge-white opacity-70 hover:opacity-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Barre stats */}
      {pagination.total > 0 && (
        <div className="bg-base-100 border-b border-base-200">
          <div className="max-w-5xl mx-auto px-4 py-2 text-sm text-base-content/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} />
              <span>
                <strong className="text-base-content">{pagination.total}</strong>
                {' '}document{pagination.total > 1 ? 's' : ''}
              </span>
            </div>
            {pagination.totalPages > 1 && (
              <span className="text-xs">
                Page <strong className="text-base-content">{filters.page}</strong> / {pagination.totalPages}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <FilterBar
          filters={filters}
          onChange={(f) => setFilters({ ...f, page: 1 })}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          matieres={niveauMatieres}
          classes={niveauClasses}
        />

        {/* Grille de documents */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow">
                <div className="card-body p-4 space-y-3">
                  <div className="skeleton h-5 w-full"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-4 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="alert alert-error">
            <span>Erreur lors du chargement. Veuillez réessayer.</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold text-base-content/60">Aucun document trouvé</h3>
            <p className="text-sm text-base-content/40 mt-1">
              Modifiez vos filtres ou revenez plus tard
            </p>
            {user && (
              <Link to={`/upload?niveau=${niveau}`} className="btn btn-primary btn-sm mt-4 gap-2">
                <Upload size={15} /> Soyez le premier à contribuer
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
            </div>

            {/* Pagination numérotée */}
            <Pagination
              page={filters.page}
              totalPages={pagination.totalPages}
              onChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}