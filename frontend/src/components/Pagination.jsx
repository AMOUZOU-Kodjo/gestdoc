// src/components/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null

  // Calcule les numéros de pages à afficher (max 7 boutons)
  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages = []
    const delta = 2 // pages autour de la page courante

    // Toujours afficher page 1
    pages.push(1)

    // Ellipsis gauche
    if (page - delta > 2) pages.push('...')

    // Pages autour de la page courante
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      pages.push(i)
    }

    // Ellipsis droite
    if (page + delta < totalPages - 1) pages.push('...')

    // Toujours afficher dernière page
    pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4 flex-wrap">
      {/* Bouton Précédent */}
      <button
        className="btn btn-sm btn-ghost gap-1 px-2"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Page précédente"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      {/* Numéros de pages */}
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-base-content/40 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`btn btn-sm min-w-[2.25rem] ${
              p === page
                ? 'btn-primary'
                : 'btn-ghost hover:btn-base-200'
            }`}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Bouton Suivant */}
      <button
        className="btn btn-sm btn-ghost gap-1 px-2"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Page suivante"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}