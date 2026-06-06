// src/pages/Upload.jsx
import { useState, useRef, useEffect } from 'react'
import { Upload as UploadIcon, FileText, File, X, CheckCircle, ArrowLeft, ArrowRight, Plus, Trash2, Save, AlertCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { documentsApi } from '../services/api'
import { NIVEAUX, CLASSES_BY_NIVEAU, MATIERES_BY_NIVEAU, YEARS } from '../utils/constants'
import toast from 'react-hot-toast'

const MAX_SIZE    = 100* 1024 * 1024 // 100 Mo
const ALLOWED     = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// Composant pour les informations d'un document
const DocumentForm = ({ doc, index, onUpdate, onRemove, errors, isActive, onActivate }) => {
  const classes  = doc.niveau ? (CLASSES_BY_NIVEAU[doc.niveau]  || []) : []
  const matieres = doc.niveau ? (MATIERES_BY_NIVEAU[doc.niveau] || []) : []

  useEffect(() => {
    if (doc.niveau) {
      onUpdate(index, { classe: '', matiere: '' })
    }
  }, [doc.niveau])

  if (!isActive) return null

  return (
    <div className="border border-base-200 rounded-xl p-4 mb-4 bg-base-100 relative">
      {/* En-tête du formulaire */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-base-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>
          <h3 className="font-semibold text-sm">
            {doc.file ? doc.file.name.substring(0, 40) : `Document ${index + 1}`}
          </h3>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="btn btn-xs btn-ghost btn-square text-error"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Drop zone pour ce document */}
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors mb-4 ${
          doc.dragOver ? 'border-primary bg-primary/5' : errors[`file_${index}`] ? 'border-error' : 'border-base-300 hover:border-primary'
        }`}
        onDragOver={e => { e.preventDefault(); onUpdate(index, { dragOver: true }) }}
        onDragLeave={() => onUpdate(index, { dragOver: false })}
        onDrop={e => {
          e.preventDefault()
          onUpdate(index, { dragOver: false })
          const file = e.dataTransfer.files[0]
          if (file) handleFileSelection(file, index, onUpdate)
        }}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.pdf,.docx'
          input.onchange = (e) => {
            const file = e.target.files[0]
            if (file) handleFileSelection(file, index, onUpdate)
          }
          input.click()
        }}
      >
        {doc.file ? (
          <div className="flex items-center justify-center gap-3">
            {doc.file.type === 'application/pdf' ? 
              <FileText size={24} className="text-red-500" /> : 
              <File size={24} className="text-blue-500" />
            }
            <div className="text-left">
              <p className="font-medium text-sm truncate max-w-[200px]">{doc.file.name}</p>
              <p className="text-xs text-base-content/50">{(doc.file.size/(1024*1024)).toFixed(2)} Mo</p>
            </div>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onUpdate(index, { file: null }) }} 
              className="btn btn-ghost btn-xs btn-circle"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <UploadIcon size={24} className="mx-auto text-base-content/30 mb-1" />
            <p className="text-xs font-medium">Cliquez ou glissez le fichier</p>
            <p className="text-[10px] text-base-content/50 mt-0.5">PDF ou DOCX — max. 20 Mo</p>
          </>
        )}
      </div>
      {errors[`file_${index}`] && <p className="text-error text-xs -mt-3 mb-3">{errors[`file_${index}`]}</p>}

      {/* Champs du formulaire */}
      <div className="space-y-3">
        {/* Titre */}
        <div className="form-control">
          <label className="label py-0.5">
            <span className="label-text text-xs font-medium">Titre *</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Cours de Mathématiques — Fonctions"
            value={doc.titre}
            onChange={e => onUpdate(index, { titre: e.target.value })}
            className={`input input-bordered input-sm w-full ${errors[`titre_${index}`] ? 'input-error' : ''}`}
            maxLength={150}
          />
          {errors[`titre_${index}`] && <label className="label py-0.5"><span className="label-text-alt text-error text-[10px]">{errors[`titre_${index}`]}</span></label>}
        </div>

        {/* Description */}
        <div className="form-control">
          <label className="label py-0.5">
            <span className="label-text text-xs font-medium">Description <span className="text-base-content/50">(optionnel)</span></span>
          </label>
          <textarea
            value={doc.description || ''}
            onChange={e => onUpdate(index, { description: e.target.value })}
            className="textarea textarea-bordered textarea-sm w-full h-16 resize-none"
            maxLength={500}
            placeholder="Brève description du contenu..."
          />
        </div>

        {/* Niveau */}
        <div className="form-control">
          <label className="label py-0.5">
            <span className="label-text text-xs font-medium">Niveau *</span>
          </label>
          <select
            value={doc.niveau}
            onChange={e => onUpdate(index, { niveau: e.target.value })}
            className={`select select-bordered select-sm w-full ${errors[`niveau_${index}`] ? 'select-error' : ''}`}
          >
            <option value="">Sélectionner un niveau</option>
            {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
          {errors[`niveau_${index}`] && <label className="label py-0.5"><span className="label-text-alt text-error text-[10px]">{errors[`niveau_${index}`]}</span></label>}
        </div>

        {/* Classe + Matière */}
        <div className="grid grid-cols-2 gap-2">
          <div className="form-control">
            <label className="label py-0.5">
              <span className="label-text text-xs font-medium">Classe *</span>
            </label>
            <select
              value={doc.classe}
              onChange={e => onUpdate(index, { classe: e.target.value })}
              className={`select select-bordered select-sm w-full ${errors[`classe_${index}`] ? 'select-error' : ''}`}
              disabled={!doc.niveau}
            >
              <option value="">Sélectionner</option>
              {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors[`classe_${index}`] && <label className="label py-0.5"><span className="label-text-alt text-error text-[10px]">{errors[`classe_${index}`]}</span></label>}
          </div>
          <div className="form-control">
            <label className="label py-0.5">
              <span className="label-text text-xs font-medium">Matière *</span>
            </label>
            <select
              value={doc.matiere}
              onChange={e => onUpdate(index, { matiere: e.target.value })}
              className={`select select-bordered select-sm w-full ${errors[`matiere_${index}`] ? 'select-error' : ''}`}
              disabled={!doc.niveau}
            >
              <option value="">Sélectionner</option>
              {matieres.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {errors[`matiere_${index}`] && <label className="label py-0.5"><span className="label-text-alt text-error text-[10px]">{errors[`matiere_${index}`]}</span></label>}
          </div>
        </div>

        {/* Année */}
        <div className="form-control">
          <label className="label py-0.5">
            <span className="label-text text-xs font-medium">Année académique *</span>
          </label>
          <select
            value={doc.annee}
            onChange={e => onUpdate(index, { annee: e.target.value })}
            className={`select select-bordered select-sm w-full ${errors[`annee_${index}`] ? 'select-error' : ''}`}
          >
            <option value="">Sélectionner</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors[`annee_${index}`] && <label className="label py-0.5"><span className="label-text-alt text-error text-[10px]">{errors[`annee_${index}`]}</span></label>}
        </div>
      </div>
    </div>
  )
}

// Validation d'un fichier
const handleFileSelection = (file, index, onUpdate) => {
  if (!ALLOWED.includes(file.type)) {
    onUpdate(index, { fileError: 'Seuls PDF et DOCX sont acceptés' })
    return
  }
  if (file.size > MAX_SIZE) {
    onUpdate(index, { fileError: 'Le fichier dépasse 20 Mo' })
    return
  }
  onUpdate(index, { file, fileError: null })
}

// Validation d'un formulaire
const validateDocument = (doc, index) => {
  const errors = {}
  if (!doc.titre || doc.titre.length < 3) errors[`titre_${index}`] = 'Titre requis (min. 3 caractères)'
  if (!doc.niveau) errors[`niveau_${index}`] = 'Niveau requis'
  if (!doc.classe) errors[`classe_${index}`] = 'Classe requise'
  if (!doc.matiere) errors[`matiere_${index}`] = 'Matière requise'
  if (!doc.annee) errors[`annee_${index}`] = 'Année requise'
  if (!doc.file) errors[`file_${index}`] = 'Fichier requis'
  if (doc.fileError) errors[`file_${index}`] = doc.fileError
  return errors
}

export default function Upload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [documents, setDocuments] = useState([
    { id: Date.now(), titre: '', description: '', niveau: searchParams.get('niveau') || '', classe: '', matiere: '', annee: '', file: null, fileError: null, dragOver: false }
  ])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [failedDocs, setFailedDocs] = useState([])

  // Ajouter un nouveau document
  const addDocument = () => {
    setDocuments(prev => [...prev, { 
      id: Date.now(), 
      titre: '', 
      description: '', 
      niveau: '', 
      classe: '', 
      matiere: '', 
      annee: '', 
      file: null, 
      fileError: null, 
      dragOver: false 
    }])
    setCurrentIndex(documents.length)
  }

  // Supprimer un document
  const removeDocument = (index) => {
    if (documents.length === 1) {
      toast.error('Vous devez avoir au moins un document')
      return
    }
    setDocuments(prev => prev.filter((_, i) => i !== index))
    if (currentIndex >= documents.length - 1) {
      setCurrentIndex(Math.max(0, documents.length - 2))
    }
    // Nettoyer les erreurs
    const newErrors = { ...errors }
    Object.keys(newErrors).forEach(key => {
      if (key.endsWith(`_${index}`)) delete newErrors[key]
    })
    setErrors(newErrors)
  }

  // Mettre à jour un document
  const updateDocument = (index, updates) => {
    setDocuments(prev => prev.map((doc, i) => i === index ? { ...doc, ...updates } : doc))
    // Effacer l'erreur correspondante si présente
    if (updates.file || updates.titre || updates.niveau || updates.classe || updates.matiere || updates.annee) {
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach(key => {
        if (key.endsWith(`_${index}`)) delete newErrors[key]
      })
      setErrors(newErrors)
    }
  }

  // Valider tous les documents
  const validateAll = () => {
    let allErrors = {}
    documents.forEach((doc, index) => {
      allErrors = { ...allErrors, ...validateDocument(doc, index) }
    })
    setErrors(allErrors)
    return Object.keys(allErrors).length === 0
  }

  // Upload de tous les documents
  const handleSubmitAll = async () => {
    if (!validateAll()) {
      toast.error('Veuillez corriger les erreurs dans les formulaires')
      // Scroll to first error
      const firstError = document.querySelector('.input-error, .select-error')
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setLoading(true)
    const uploaded = []
    const failed = []

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      setCurrentIndex(i)
      setUploadProgress(prev => ({ ...prev, [i]: 0 }))

      try {
        const fd = new FormData()
        fd.append('file', doc.file)
        fd.append('titre', doc.titre)
        if (doc.description) fd.append('description', doc.description)
        fd.append('niveau', doc.niveau)
        fd.append('classe', doc.classe)
        fd.append('matiere', doc.matiere)
        fd.append('annee', doc.annee)

        await documentsApi.upload(fd, (pct) => {
          setUploadProgress(prev => ({ ...prev, [i]: pct }))
        })

        uploaded.push({ index: i, titre: doc.titre })
        toast.success(`✅ "${doc.titre}" uploadé avec succès !`)
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message || 'Erreur lors de l\'upload'
        failed.push({ index: i, titre: doc.titre, error: errorMsg })
        toast.error(`❌ Échec pour "${doc.titre}": ${errorMsg}`)
      }
    }

    setUploadedDocs(uploaded)
    setFailedDocs(failed)
    setLoading(false)

    if (failed.length === 0) {
      toast.success(`🎉 Tous les ${uploaded.length} documents ont été uploadés avec succès !`)
      // Redirection après 3 secondes
      setTimeout(() => navigate('/'), 3000)
    }
  }

  const navigateNext = () => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const navigatePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const currentDoc = documents[currentIndex]

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* En-tête avec progression */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">Upload de documents</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">
                Document {currentIndex + 1}/{documents.length}
              </span>
              <button
                type="button"
                onClick={addDocument}
                className="btn btn-sm btn-ghost gap-1"
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>
          </div>
          
          {/* Barre de progression multi-documents */}
          <div className="flex gap-1 mt-2">
            {documents.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-1 h-1 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-primary h-2' : 
                  errors[`file_${idx}`] || errors[`titre_${idx}`] ? 'bg-error' : 
                  uploadProgress[idx] === 100 ? 'bg-success' :
                  uploadProgress[idx] ? 'bg-primary/50' : 'bg-base-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Formulaire du document courant */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-6">
            <DocumentForm
              doc={currentDoc}
              index={currentIndex}
              onUpdate={updateDocument}
              onRemove={removeDocument}
              errors={errors}
              isActive={true}
              onActivate={() => {}}
            />

            {/* Navigation entre documents */}
            <div className="flex justify-between gap-3 mt-4">
              <button
                type="button"
                onClick={navigatePrev}
                disabled={currentIndex === 0}
                className="btn btn-outline flex-1 gap-2"
              >
                <ArrowLeft size={16} /> Précédent
              </button>
              {currentIndex < documents.length - 1 ? (
                <button
                  type="button"
                  onClick={navigateNext}
                  className="btn btn-outline btn-primary flex-1 gap-2"
                >
                  Suivant <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  disabled={loading}
                  className="btn btn-primary flex-1 gap-2"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <Save size={16} />
                  )}
                  {loading ? 'Upload en cours...' : `Uploader ${documents.length} document(s)`}
                </button>
              )}
            </div>

            {/* Barre de progression globale */}
            {loading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-base-content/50 mb-1">
                  <span>Upload du document {currentIndex + 1}/{documents.length}</span>
                  <span>{uploadProgress[currentIndex] || 0}%</span>
                </div>
                <div className="w-full bg-base-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress[currentIndex] || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Résumé de fin */}
            {!loading && (uploadedDocs.length > 0 || failedDocs.length > 0) && (
              <div className="mt-4 p-3 bg-base-200 rounded-xl">
                <p className="text-sm font-semibold mb-2">Résumé de l'upload</p>
                {uploadedDocs.length > 0 && (
                  <div className="text-success text-xs mb-1">
                    ✅ Succès: {uploadedDocs.length} document(s)
                  </div>
                )}
                {failedDocs.length > 0 && (
                  <div className="text-error text-xs">
                    ❌ Échec: {failedDocs.length} document(s)
                  </div>
                )}
                {uploadedDocs.length === documents.length && (
                  <div className="mt-2 text-center text-success text-sm">
                    <CheckCircle size={16} className="inline mr-1" />
                    Tous les documents ont été uploadés avec succès !
                    <div className="text-xs mt-1">Redirection en cours...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Aide */}
        <div className="mt-4 text-center text-xs text-base-content/50">
          <p>Vous pouvez ajouter plusieurs documents et remplir leurs informations un par un.</p>
          <p>Tous les documents seront uploadés en une seule fois.</p>
        </div>
      </div>
    </div>
  )
}