// Niveaux (sections du site)
export const NIVEAUX = [
  { value: 'BEPC', label: 'BEPC — Troisième', short: 'BEPC', color: 'badge-info', route: '/bepc' },
  { value: 'PREMIERE', label: 'Lycée Première', short: 'Première', color: 'badge-success', route: '/premiere' },
  { value: 'TERMINALE', label: 'Lycée Terminale', short: 'Terminale', color: 'badge-warning', route: '/terminale' },
  { value: 'UNIVERSITE', label: 'Université', short: 'Université', color: 'badge-secondary', route: '/universite' },
]

// Classes par niveau
export const CLASSES_BY_NIVEAU = {
  BEPC: [
    { value: '3eme', label: 'Troisième' },
  ],
  PREMIERE: [
    { value: '1ereA', label: 'Première A' },
    { value: '1ereCD', label: 'Première C & D' },
  ],
  TERMINALE: [
    { value: 'TleA', label: 'Terminale A' },
    { value: 'TleCD', label: 'Terminale C & D' },
  ],
  UNIVERSITE: [
    { value: 'L1', label: 'Licence 1 (L1)' },
    { value: 'L2', label: 'Licence 2 (L2)' },
    { value: 'L3', label: 'Licence 3 (L3)' },
    { value: 'M1', label: 'Master 1 (M1)' },
    { value: 'M2', label: 'Master 2 (M2)' },
    { value: 'BTS', label: 'BTS' },
    { value: 'DUT', label: 'DUT / BUT' },
    { value: 'CPGE', label: 'CPGE' },
  ],
}

// Toutes les classes à plat
export const CLASSES = Object.values(CLASSES_BY_NIVEAU).flat()

// Matières par niveau
export const MATIERES_BY_NIVEAU = {
  BEPC: [
    { value: 'Mathematiques', label: 'Mathématiques' },
    { value: 'Sciences Physiques', label: 'Sciences Physiques' },
    { value: 'SVT', label: 'SVT' },
    { value: 'Francais', label: 'Français' },
    { value: 'Anglais', label: 'Anglais' },
    { value: 'Histoire-Geographie', label: 'Histoire-Géographie' },
    { value: 'Allemand/Espagnol', label: 'Allemand / Espagnol' },
  ],
  PREMIERE: [
    { value: 'Mathematiques', label: 'Mathématiques' },
    { value: 'Sciences Physiques', label: 'Sciences Physiques' },
    { value: 'SVT', label: 'SVT' },
    { value: 'Francais', label: 'Français' },
    { value: 'Anglais', label: 'Anglais' },
    { value: 'Histoire-Geographie', label: 'Histoire-Géographie' },
    { value: 'Philosophie', label: 'Philosophie' },
    { value: 'Allemand/Espagnol', label: 'Allemand / Espagnol' },
  ],
  TERMINALE: [
    { value: 'Mathematiques', label: 'Mathématiques' },
    { value: 'Sciences Physiques', label: 'Sciences Physiques' },
    { value: 'SVT', label: 'SVT' },
    { value: 'Francais', label: 'Français' },
    { value: 'Anglais', label: 'Anglais' },
    { value: 'Histoire-Geographie', label: 'Histoire-Géographie' },
    { value: 'Philosophie', label: 'Philosophie' },
    { value: 'Allemand/Espagnol', label: 'Allemand / Espagnol' },
  ],
  UNIVERSITE: [
    { value: 'Mathematiques', label: 'Mathématiques' },
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Physique', label: 'Physique' },
    { value: 'Chimie', label: 'Chimie' },
    { value: 'Biologie', label: 'Biologie' },
    { value: 'Droit', label: 'Droit' },
    { value: 'Economie', label: 'Économie' },
    { value: 'Gestion', label: 'Gestion' },
    { value: 'Lettres', label: 'Lettres & Sciences du langage' },
    { value: 'Anglais', label: 'Anglais' },
    { value: 'Histoire-Geographie', label: 'Histoire-Géographie' },
    { value: 'Philosophie', label: 'Philosophie' },
    { value: 'Sciences Sociales', label: 'Sciences Sociales' },
  ],
}

// Toutes les matières à plat (dédupliquées)
export const MATIERES = [...new Map(
  Object.values(MATIERES_BY_NIVEAU).flat().map(m => [m.value, m])
).values()]

// Profils utilisateur
export const PROFILS = [
  {
    value: 'BEPC',
    label: 'Élève — BEPC (3e)',
    description: 'Accès aux documents de Troisième',
    icon: '📚',
    color: 'border-info',
    bgColor: 'bg-info/10',
    niveaux: ['BEPC'],
  },
  {
    value: 'PREMIERE',
    label: 'Élève — Première',
    description: 'Accès aux documents de 1ère A, C & D',
    icon: '📖',
    color: 'border-success',
    bgColor: 'bg-success/10',
    niveaux: ['PREMIERE'],
  },
  {
    value: 'TERMINALE',
    label: 'Élève — Terminale',
    description: 'Accès aux documents de Tle A, C & D',
    icon: '🎓',
    color: 'border-warning',
    bgColor: 'bg-warning/10',
    niveaux: ['TERMINALE'],
  },
  {
    value: 'UNIVERSITE',
    label: 'Étudiant — Université',
    description: 'Accès aux documents universitaires (L1-M2, BTS, DUT...)',
    icon: '🏫',
    color: 'border-secondary',
    bgColor: 'bg-secondary/10',
    niveaux: ['UNIVERSITE'],
  },
  {
    value: 'ENSEIGNANT',
    label: 'Enseignant',
    description: 'Accès à tous les niveaux',
    icon: '👨‍🏫',
    color: 'border-primary',
    bgColor: 'bg-primary/10',
    niveaux: ['BEPC', 'PREMIERE', 'TERMINALE', 'UNIVERSITE'],
  },
]

// Niveaux accessibles par profil
export const getNiveauxForProfile = (profile) => {
  if (!profile || profile === 'ADMIN') return ['BEPC', 'PREMIERE', 'TERMINALE', 'UNIVERSITE']
  const found = PROFILS.find(p => p.value === profile)
  return found ? found.niveaux : []
}

export const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

export const STATUS_LABELS = {
  PENDING:  { label: 'En attente', class: 'badge-warning' },
  APPROVED: { label: 'Approuvé',   class: 'badge-success' },
  REJECTED: { label: 'Refusé',     class: 'badge-error' },
}

export const getClassLabel   = (v) => CLASSES.find(c => c.value === v)?.label || v
export const getMatiereLabel = (v) => MATIERES.find(m => m.value === v)?.label || v
export const getNiveauLabel  = (v) => NIVEAUX.find(n => n.value === v)?.label || v
export const formatFileSize  = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
