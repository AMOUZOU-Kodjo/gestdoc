<<<<<<< HEAD
import { Link } from 'react-router-dom'
import { BookOpen, Upload, Users, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { NIVEAUX, getNiveauxForProfile } from '../utils/constants'

const NIVEAU_COLORS = {
  BEPC:       { bg: 'bg-info/10',       border: 'border-info/30',       text: 'text-info',       btn: 'btn-info' },
  PREMIERE:   { bg: 'bg-success/10',    border: 'border-success/30',    text: 'text-success',    btn: 'btn-success' },
  TERMINALE:  { bg: 'bg-warning/10',    border: 'border-warning/30',    text: 'text-warning',    btn: 'btn-warning' },
  UNIVERSITE: { bg: 'bg-secondary/10',  border: 'border-secondary/30',  text: 'text-secondary',  btn: 'btn-secondary' },
}

const NIVEAU_DETAILS = {
  BEPC:       { icon: '📚', classes: 'Troisième',              desc: 'Cours, exercices et annales pour préparer le BEPC' },
  PREMIERE:   { icon: '📖', classes: 'Première A, C & D',      desc: 'Ressources pour la classe de Première' },
  TERMINALE:  { icon: '🎓', classes: 'Terminale A, C & D',     desc: 'Préparez votre BAC avec les meilleures ressources' },
  UNIVERSITE: { icon: '🏫', classes: 'L1–M2, BTS, DUT, CPGE', desc: 'Documents pour l\'enseignement supérieur' },
}

export default function Home() {
  const { user, hasAllAccess } = useAuth()
  const accessibleNiveaux = user
    ? NIVEAUX.filter(n => getNiveauxForProfile(user.profile).includes(n.value) || hasAllAccess)
    : NIVEAUX
=======
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
>>>>>>> 8767c594b5f953f1951d0b52cd7f38815697b7cc

  return (
    <div className="min-h-screen bg-base-200">
      {/* Hero */}
<<<<<<< HEAD
      <div className="bg-gradient-to-br from-primary to-secondary text-primary-content py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-5">
            <div className="p-4 bg-white/20 rounded-2xl">
              <BookOpen size={44} />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">GestDoc</h1>
          <p className="text-lg text-primary-content/80 mb-8 max-w-xl mx-auto">
            Plateforme de partage de documents scolaires et universitaires — cours, exercices, annales pour tous les niveaux.
          </p>
          {!user ? (
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn btn-white btn-lg gap-2">
                <Users size={20} /> Créer un compte
              </Link>
              <Link to="/login" className="btn btn-outline btn-white btn-lg">
                Se connecter
              </Link>
            </div>
          ) : (
            <Link to="/upload" className="btn btn-white btn-lg gap-2">
              <Upload size={20} /> Uploader un document
            </Link>
          )}
        </div>
      </div>

      {/* Niveau cards */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-2">Choisissez votre niveau</h2>
        <p className="text-center text-base-content/60 mb-8 text-sm">
          {user ? 'Accédez directement à vos documents' : 'Connectez-vous pour accéder aux documents'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {NIVEAUX.map(n => {
            const c       = NIVEAU_COLORS[n.value]
            const d       = NIVEAU_DETAILS[n.value]
            const locked  = !!user && !hasAllAccess && !getNiveauxForProfile(user.profile).includes(n.value)

            return (
              <div
                key={n.value}
                className={`card bg-base-100 shadow-md border-2 transition-all ${c.border} ${locked ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
              >
                <div className="card-body p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${c.bg} text-2xl`}>{d.icon}</div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${c.text}`}>{n.label}</h3>
                      <p className="text-xs text-base-content/60 mt-0.5">{d.classes}</p>
                      <p className="text-sm text-base-content/70 mt-2 leading-relaxed">{d.desc}</p>
                    </div>
                  </div>
                  <div className="card-actions justify-end mt-3">
                    {locked ? (
                      <span className="text-xs text-base-content/40 flex items-center gap-1">
                        🔒 Non accessible avec votre profil
                      </span>
                    ) : (
                      <Link to={n.route} className={`btn btn-sm gap-2 ${c.btn} btn-outline`}>
                        Accéder <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA si pas connecté */}
        {!user && (
          <div className="mt-10 text-center">
            <p className="text-base-content/60 mb-3 text-sm">Vous pouvez parcourir les documents sans compte, mais la connexion est requise pour télécharger.</p>
            <Link to="/register" className="btn btn-primary gap-2">
              <Users size={18} /> Créer un compte gratuit
            </Link>
          </div>
        )}

        {/* CTA si connecté sans profil */}
        {user && !user.profile && (
          <div className="alert alert-info mt-8 max-w-xl mx-auto">
            <span className="text-sm">Configurez votre profil pour accéder aux documents de votre niveau.</span>
            <Link to="/profile" className="btn btn-sm btn-info">Configurer</Link>
=======
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
>>>>>>> 8767c594b5f953f1951d0b52cd7f38815697b7cc
          </div>
        )}
      </div>
    </div>
  )
}
