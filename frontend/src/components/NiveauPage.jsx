import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Upload, Lock } from 'lucide-react'
import { documentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getNiveauxForProfile } from '../utils/constants'
import DocumentCard from './DocumentCard'
import FilterBar from './FilterBar'

const DEFAULT_FILTERS = { search: '', classe: '', matiere: '', annee: '', page: 1, limit: 12 }

export default function NiveauPage({ niveau, title, subtitle, color = 'primary', classes = [], matieres = [] }) {
  const { user, hasAllAccess } = useAuth()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  // Check access
  const canAccess = !user || hasAllAccess || getNiveauxForProfile(user.profile).includes(niveau)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['documents', niveau, filters],
    queryFn: () => documentsApi.getAll({ ...filters, niveau }).then(r => r.data),
    keepPreviousData: true,
  })

  const documents  = data?.documents || []
  const pagination = data?.pagination || {}

  // Not logged in → show public view with login prompt for download
  // Logged in but wrong profile → show access restriction
  if (user && !canAccess) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center p-8">
            <Lock size={48} className="text-warning mb-3" />
            <h2 className="text-xl font-bold">Accès restreint</h2>
            <p className="text-base-content/60 text-sm mt-2">
              Cette section est réservée aux utilisateurs ayant le profil correspondant.
              Modifiez votre profil depuis votre espace personnel.
            </p>
            <div className="flex gap-3 mt-5">
              <Link to="/profile" className="btn btn-primary btn-sm">Modifier mon profil</Link>
              <Link to="/" className="btn btn-ghost btn-sm">Accueil</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className={`bg-${color} text-white py-10 px-4`} style={{ background: `var(--${color === 'primary' ? 'p' : color})` }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-white/80 mt-1">{subtitle}</p>
            </div>
            {user && (
              <Link to={`/upload?niveau=${niveau}`} className="btn btn-white btn-sm gap-2">
                <Upload size={16} /> Contribuer
              </Link>
            )}
          </div>

          {/* Classes pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {classes.map(c => (
              <button
                key={c.value}
                onClick={() => setFilters(f => ({ ...f, classe: f.classe === c.value ? '' : c.value, page: 1 }))}
                className={`badge badge-lg cursor-pointer transition-all ${
                  filters.classe === c.value ? 'badge-white font-bold' : 'badge-outline badge-white opacity-80 hover:opacity-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {pagination.total > 0 && (
        <div className="bg-base-100 border-b border-base-200">
          <div className="max-w-5xl mx-auto px-4 py-2 text-sm text-base-content/60 flex items-center gap-2">
            <FileText size={14} />
            <span><strong className="text-base-content">{pagination.total}</strong> document{pagination.total > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          matieres={matieres}
          classes={classes}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow"><div className="card-body p-4 space-y-3"><div className="skeleton h-5 w-full"></div><div className="skeleton h-4 w-3/4"></div></div></div>
            ))}
          </div>
        ) : isError ? (
          <div className="alert alert-error"><span>Erreur lors du chargement. Veuillez réessayer.</span></div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold text-base-content/60">Aucun document trouvé</h3>
            <p className="text-sm text-base-content/40 mt-1">Modifiez vos filtres ou revenez plus tard</p>
            {user && (
              <Link to={`/upload?niveau=${niveau}`} className="btn btn-primary btn-sm mt-4 gap-2">
                <Upload size={15} /> Soyez le premier à contribuer
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <button className="btn btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Précédent</button>
            <span className="btn btn-sm btn-ghost no-animation">Page {filters.page} / {pagination.totalPages}</span>
            <button className="btn btn-sm" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Suivant →</button>
          </div>
        )}
      </div>
    </div>
  )
}
