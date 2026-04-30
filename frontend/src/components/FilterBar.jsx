// src/components/FilterBar.jsx
import { Search, X } from 'lucide-react'
import { CLASSES, MATIERES, YEARS } from '../utils/constants'

export default function FilterBar({ filters, onChange, onReset }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 })
  }

  const hasActiveFilters = filters.classe || filters.matiere || filters.annee || filters.search

  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search || ''}
            onChange={e => handleChange('search', e.target.value)}
            className="input input-bordered input-sm w-full pl-9"
            maxLength={100}
          />
        </div>

        {/* Classe */}
        <select
          value={filters.classe || ''}
          onChange={e => handleChange('classe', e.target.value)}
          className="select select-bordered select-sm w-full"
        >
          <option value="">Toutes les classes</option>
          {CLASSES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Matière */}
        <select
          value={filters.matiere || ''}
          onChange={e => handleChange('matiere', e.target.value)}
          className="select select-bordered select-sm w-full"
        >
          <option value="">Toutes les matières</option>
          {MATIERES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Année */}
        <div className="flex gap-2">
          <select
            value={filters.annee || ''}
            onChange={e => handleChange('annee', e.target.value)}
            className="select select-bordered select-sm flex-1"
          >
            <option value="">Toutes les années</option>
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button onClick={onReset} className="btn btn-ghost btn-sm btn-square" title="Effacer les filtres">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
