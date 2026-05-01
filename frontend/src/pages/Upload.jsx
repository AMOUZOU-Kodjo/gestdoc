import { useState, useRef, useEffect } from 'react'
import { Upload as UploadIcon, FileText, File, X, CheckCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { documentsApi } from '../services/api'
import { NIVEAUX, CLASSES_BY_NIVEAU, MATIERES_BY_NIVEAU, YEARS } from '../utils/constants'
import toast from 'react-hot-toast'

const MAX_SIZE    = 20 * 1024 * 1024
const ALLOWED     = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function Upload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileRef  = useRef()
  const [form, setForm]       = useState({ titre:'', description:'', niveau: searchParams.get('niveau') || '', classe:'', matiere:'', annee:'' })
  const [file, setFile]       = useState(null)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const classes  = form.niveau ? (CLASSES_BY_NIVEAU[form.niveau]  || []) : []
  const matieres = form.niveau ? (MATIERES_BY_NIVEAU[form.niveau] || []) : []

  useEffect(() => {
    setForm(f => ({ ...f, classe: '', matiere: '' }))
  }, [form.niveau])

  const handleFile = (f) => {
    if (!f) return
    if (!ALLOWED.includes(f.type)) { setErrors(e => ({ ...e, file: 'Seuls PDF et DOCX sont acceptés' })); return }
    if (f.size > MAX_SIZE) { setErrors(e => ({ ...e, file: 'Le fichier dépasse 20 Mo' })); return }
    setFile(f)
    setErrors(e => ({ ...e, file: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.titre || form.titre.length < 3) e.titre  = 'Titre requis (min. 3 caractères)'
    if (!form.niveau)   e.niveau  = 'Niveau requis'
    if (!form.classe)   e.classe  = 'Classe requise'
    if (!form.matiere)  e.matiere = 'Matière requise'
    if (!form.annee)    e.annee   = 'Année requise'
    if (!file)          e.file    = 'Fichier requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      await documentsApi.upload(fd)
      setSuccess(true)
      toast.success('Document uploadé ! En attente de validation.')
    } catch (err) {
      const ed = err.response?.data
      if (ed?.details) {
        const fe = {}; ed.details.forEach(d => { fe[d.field] = d.message }); setErrors(fe)
      } else toast.error(ed?.error || 'Erreur lors de l\'upload')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body items-center text-center p-8 space-y-4">
          <CheckCircle size={56} className="text-success" />
          <h2 className="text-2xl font-bold">Document envoyé !</h2>
          <p className="text-base-content/70">Votre document est en attente de validation par un administrateur.</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button onClick={() => { setSuccess(false); setForm({ titre:'',description:'',niveau:'',classe:'',matiere:'',annee:'' }); setFile(null) }} className="btn btn-primary">Uploader un autre</button>
            <button onClick={() => navigate('/')} className="btn btn-ghost">Retour à l'accueil</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3"><div className="p-3 bg-primary/10 rounded-2xl"><UploadIcon size={32} className="text-primary" /></div></div>
              <h2 className="text-2xl font-bold">Uploader un document</h2>
              <p className="text-sm text-base-content/60 mt-1">Soumis à validation avant publication</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : errors.file ? 'border-error' : 'border-base-300 hover:border-primary'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    {file.type === 'application/pdf' ? <FileText size={28} className="text-red-500" /> : <File size={28} className="text-blue-500" />}
                    <div className="text-left">
                      <p className="font-medium text-sm truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-base-content/50">{(file.size/(1024*1024)).toFixed(2)} Mo</p>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }} className="btn btn-ghost btn-xs btn-circle ml-2"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <UploadIcon size={32} className="mx-auto text-base-content/30 mb-2" />
                    <p className="font-medium text-sm">Glissez ou cliquez pour choisir</p>
                    <p className="text-xs text-base-content/50 mt-1">PDF ou DOCX — max. 20 Mo</p>
                  </>
                )}
              </div>
              {errors.file && <p className="text-error text-xs">{errors.file}</p>}

              {/* Titre */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Titre *</span></label>
                <input type="text" placeholder="Ex: Cours de Mathématiques — Fonctions" value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  className={`input input-bordered w-full ${errors.titre ? 'input-error' : ''}`} maxLength={150} />
                {errors.titre && <label className="label"><span className="label-text-alt text-error">{errors.titre}</span></label>}
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Description <span className="text-base-content/50">(optionnel)</span></span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="textarea textarea-bordered w-full h-20 resize-none" maxLength={500} placeholder="Brève description du contenu..." />
              </div>

              {/* Niveau */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Niveau *</span></label>
                <select value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))}
                  className={`select select-bordered w-full ${errors.niveau ? 'select-error' : ''}`}>
                  <option value="">Sélectionner un niveau</option>
                  {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                {errors.niveau && <label className="label"><span className="label-text-alt text-error">{errors.niveau}</span></label>}
              </div>

              {/* Classe + Matière */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Classe *</span></label>
                  <select value={form.classe} onChange={e => setForm(f => ({ ...f, classe: e.target.value }))}
                    className={`select select-bordered w-full ${errors.classe ? 'select-error' : ''}`}
                    disabled={!form.niveau}>
                    <option value="">Sélectionner</option>
                    {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {errors.classe && <label className="label"><span className="label-text-alt text-error">{errors.classe}</span></label>}
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Matière *</span></label>
                  <select value={form.matiere} onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}
                    className={`select select-bordered w-full ${errors.matiere ? 'select-error' : ''}`}
                    disabled={!form.niveau}>
                    <option value="">Sélectionner</option>
                    {matieres.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  {errors.matiere && <label className="label"><span className="label-text-alt text-error">{errors.matiere}</span></label>}
                </div>
              </div>

              {/* Année */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Année académique *</span></label>
                <select value={form.annee} onChange={e => setForm(f => ({ ...f, annee: e.target.value }))}
                  className={`select select-bordered w-full ${errors.annee ? 'select-error' : ''}`}>
                  <option value="">Sélectionner</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.annee && <label className="label"><span className="label-text-alt text-error">{errors.annee}</span></label>}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full gap-2 mt-2">
                {loading ? <span className="loading loading-spinner loading-sm"></span> : <UploadIcon size={18} />}
                {loading ? 'Upload en cours...' : 'Envoyer le document'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
