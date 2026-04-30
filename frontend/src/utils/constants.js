// src/utils/constants.js
export const CLASSES = [
  { value: 'TleA', label: 'Terminale A' },
  { value: 'TleCD', label: 'Terminale C & D' },
  { value: '1ereA', label: 'Première A' },
  { value: '1ereCD', label: 'Première C & D' },
  { value: '3eme', label: 'Troisième' },
]

export const MATIERES = [
  { value: 'Mathematiques', label: 'Mathématiques' },
  { value: 'Sciences Physiques', label: 'Sciences Physiques' },
  { value: 'SVT', label: 'SVT' },
  { value: 'Francais', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Histoire-Geographie', label: 'Histoire-Géographie' },
  { value: 'Philosophie', label: 'Philosophie' },
  { value: 'Allemand/Espagnol', label: 'Allemand / Espagnol' },
]

export const STATUS_LABELS = {
  PENDING: { label: 'En attente', class: 'badge-warning' },
  APPROVED: { label: 'Approuvé', class: 'badge-success' },
  REJECTED: { label: 'Refusé', class: 'badge-error' },
}

export const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

export const FILE_TYPE_ICONS = {
  pdf: '📄',
  docx: '📝',
}

export const getClassLabel = (value) => CLASSES.find(c => c.value === value)?.label || value
export const getMatiereLabel = (value) => MATIERES.find(m => m.value === value)?.label || value
export const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
