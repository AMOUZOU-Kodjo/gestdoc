// src/pages/DocumentDetail.jsx
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, ArrowLeft, FileText, File, Calendar, BookOpen, GraduationCap, Crown, Upload, Lock } from 'lucide-react'
import { documentsApi, usersApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getClassLabel, getMatiereLabel, formatFileSize } from '../utils/constants'
import toast from 'react-hot-toast'

export default function DocumentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [downloading, setDownloading] = useState(false)

  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getById(id).then(r => r.data),
  })

  const { data: quota } = useQuery({
    queryKey: ['myQuota'],
    queryFn: () => usersApi.quota().then(r => r.data),
    enabled: !!user,
  })

  const handleDownload = async () => {
    if (!user) {
      toast.error('Connectez-vous pour télécharger ce document')
      navigate('/login', { state: { from: { pathname: `/documents/${id}` } } })
      return
    }
    setDownloading(true)
    try {
      const { data } = await documentsApi.getDownloadUrl(id)
      window.open(data.downloadUrl, '_blank')
      toast.success('Téléchargement démarré !')
      // Rafraîchir le quota après téléchargement
      qc.invalidateQueries(['myQuota'])
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'QUOTA_EXCEEDED') {
        toast.error('Quota épuisé ! Abonnez-vous ou uploadez un document.')
        // Rafraîchir le quota
        qc.invalidateQueries(['myQuota'])
      } else {
        toast.error(err.response?.data?.error || 'Erreur lors du téléchargement')
      }
    } finally {
      setDownloading(false)
    }
  }

  const quotaExhausted = user && quota && !quota.unlimited && quota.remaining === 0

  if (isLoading) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  )

  if (isError || !doc) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Document introuvable</h2>
        <Link to="/" className="btn btn-primary btn-sm">Retour à l'accueil</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link to="/" className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft size={16} /> Retour
        </Link>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body p-6 space-y-5">
            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div className="p-4 bg-primary/10 rounded-2xl flex-shrink-0">
                {doc.fileType === 'pdf'
                  ? <FileText size={36} className="text-red-500" />
                  : <File size={36} className="text-blue-500" />
                }
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">{doc.titre}</h1>
              </div>
            </div>

            {/* Description */}
            {doc.description && (
              <div className="bg-base-200 rounded-xl p-4">
                <p className="text-sm leading-relaxed">{doc.description}</p>
              </div>
            )}

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <GraduationCap size={16} />, label: 'Classe',          value: getClassLabel(doc.classe) },
                { icon: <BookOpen size={16} />,      label: 'Matière',         value: getMatiereLabel(doc.matiere) },
                { icon: <Calendar size={16} />,      label: 'Année',           value: doc.annee },
                { icon: <FileText size={16} />,      label: 'Format',          value: doc.fileType?.toUpperCase() + (doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : '') },
                { icon: <Download size={16} />,      label: 'Téléchargements', value: doc.downloadCount },
              ].map((item, i) => (
                <div key={i} className="bg-base-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-base-content/60 text-xs mb-1">
                    {item.icon} {item.label}
                  </div>
                  <p className="font-semibold text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Quota info */}
            {user && quota && !quota.unlimited && (
              <div className={`rounded-xl p-3 text-sm flex items-center gap-2 ${quota.remaining === 0 ? 'bg-error/10 text-error' : quota.remaining === 1 ? 'bg-warning/10 text-warning' : 'bg-base-200 text-base-content/60'}`}>
                {quota.remaining === 0
                  ? <Lock size={15} className="flex-shrink-0" />
                  : <Download size={15} className="flex-shrink-0" />
                }
                <span>
                  {quota.remaining === 0
                    ? 'Quota épuisé'
                    : `${quota.remaining} téléchargement${quota.remaining > 1 ? 's' : ''} restant${quota.remaining > 1 ? 's' : ''}`
                  }
                  {' · '}
                  <span className="text-xs">{quota.used} / {quota.totalAllowed} utilisés</span>
                </span>
              </div>
            )}

            {/* Download button */}
            <div className="pt-2 space-y-2">
              {user ? (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={downloading || quotaExhausted}
                    className={`btn btn-lg w-full gap-2 ${quotaExhausted ? 'btn-disabled' : 'btn-primary'}`}
                  >
                    {downloading
                      ? <span className="loading loading-spinner loading-sm"></span>
                      : quotaExhausted ? <Lock size={20} /> : <Download size={20} />
                    }
                    {downloading
                      ? 'Préparation...'
                      : quotaExhausted ? 'Quota épuisé' : 'Télécharger le document'
                    }
                  </button>

                  {quotaExhausted && (
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/upload" className="btn btn-outline btn-sm gap-1">
                        <Upload size={13} /> Uploader (+2 gratuits)
                      </Link>
                      <Link to="/abonnement" className="btn btn-warning btn-sm gap-1">
                        <Crown size={13} /> S'abonner
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="alert alert-info text-sm py-2">
                    <span>Connectez-vous pour télécharger ce document.</span>
                  </div>
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/documents/${id}` } }}
                    className="btn btn-primary w-full gap-2"
                  >
                    <Download size={18} /> Se connecter pour télécharger
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}