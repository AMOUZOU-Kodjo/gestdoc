import { Search, X } from 'lucide-react'
import { MATIERES, CLASSES, YEARS } from '../utils/constants'

export default function FilterBar({ filters, onChange, onReset, matieres, classes }) {
  const matList = matieres || MATIERES
  const clsList = classes  || CLASSES
  const has = filters.classe || filters.matiere || filters.annee || filters.search

  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input type="text" placeholder="Rechercher..." value={filters.search || ''}
            onChange={e => onChange({ ...filters, search: e.target.value, page: 1 })}
            className="input input-bordered input-sm w-full pl-9" maxLength={100} />
        </div>

        <select value={filters.classe || ''} onChange={e => onChange({ ...filters, classe: e.target.value, page: 1 })}
          className="select select-bordered select-sm w-full">
          <option value="">Toutes les classes</option>
          {clsList.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select value={filters.matiere || ''} onChange={e => onChange({ ...filters, matiere: e.target.value, page: 1 })}
          className="select select-bordered select-sm w-full">
          <option value="">Toutes les matières</option>
          {matList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <div className="flex gap-2">
          <select value={filters.annee || ''} onChange={e => onChange({ ...filters, annee: e.target.value, page: 1 })}
            className="select select-bordered select-sm flex-1">
            <option value="">Toutes les années</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {has && (
            <button onClick={onReset} className="btn btn-ghost btn-sm btn-square" title="Effacer"><X size={16} /></button>
          )}
        </div>
      </div>
    </div>
  )
}
