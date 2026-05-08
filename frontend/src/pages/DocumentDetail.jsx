// src/pages/DocumentDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Download, ArrowLeft, FileText, File, Calendar, BookOpen, GraduationCap, 
  Crown, Upload, Lock, Eye, User, Heart, Share2, Flag, CheckCircle,
  Award, TrendingUp, Clock, Star, ExternalLink, AlertTriangle
} from 'lucide-react'
import { documentsApi, usersApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getClassLabel, getMatiereLabel, formatFileSize } from '../utils/constants'
import toast from 'react-hot-toast'

// Composant Skeleton amélioré
const DocumentDetailSkeleton = () => (
  <div className="min-h-screen bg-base-200 py-8 px-4">
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="skeleton h-10 w-32 rounded-lg animate-pulse" />
      
      <div className="card bg-base-100 shadow-lg animate-pulse">
        <div className="card-body p-6 space-y-5">
          <div className="skeleton h-48 w-full rounded-xl" />
          
          <div className="flex items-start gap-4">
            <div className="skeleton w-16 h-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-7 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          </div>
          
          <div className="skeleton h-24 w-full rounded-xl" />
          
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
          
          <div className="skeleton h-16 rounded-xl" />
          <div className="skeleton h-12 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
)

// Composant pour les documents recommandés
const RecommendedDocument = ({ doc }) => {
  const navigate = useNavigate()
  
  return (
    <div 
      onClick={() => navigate(`/documents/${doc.id}`)}
      className="bg-base-100 rounded-xl p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
          {doc.fileType === 'pdf' 
            ? <FileText size={20} className="text-red-500" />
            : <File size={20} className="text-blue-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{doc.titre}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-base-content/50">{getClassLabel(doc.classe)}</span>
            <span className="text-xs text-base-content/30">•</span>
            <span className="text-xs text-base-content/50">{doc.downloadCount} téléch.</span>
          </div>
        </div>
        <ExternalLink size={14} className="text-base-content/30 flex-shrink-0" />
      </div>
    </div>
  )
}

export default function DocumentDetail() {
  const { id }       = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const qc           = useQueryClient()
  const [downloading, setDownloading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showShareTooltip, setShowShareTooltip] = useState(false)

  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ['document', id],
    queryFn:  () => documentsApi.getById(id).then(r => r.data),
  })

  const { data: quota } = useQuery({
    queryKey: ['myQuota'],
    queryFn:  () => usersApi.quota().then(r => r.data),
    enabled:  !!user,
  })

  // Simulation de documents recommandés
  const { data: recommendedDocs } = useQuery({
    queryKey: ['recommended', doc?.classe, doc?.matiere],
    queryFn:  () => documentsApi.getRecommended(doc?.classe, doc?.matiere).then(r => r.data),
    enabled:  !!doc,
  })

  const quotaExhausted = user && quota && !quota.unlimited && quota.remaining === 0

  // ✅ Version corrigée - une seule fenêtre qui s'ouvre dans un nouvel onglet
  const handleDownload = async () => {
    if (!user) {
      toast.error('Connectez-vous pour télécharger ce document')
      navigate('/login', { state: { from: { pathname: `/documents/${id}` } } })
      return
    }
    
    setDownloading(true)
    try {
      const { data } = await documentsApi.getDownloadUrl(id)
      
      // ✅ Une seule fenêtre dans un nouvel onglet
      // Solution 1: window.open avec _blank (recommandée)
      const newWindow = window.open(data.downloadUrl, '_blank', 'noopener,noreferrer')
      
      // Solution 2 alternative (si besoin de forcer l'ouverture)
      // if (!newWindow) {
      //   // Si popup bloqué, utiliser un lien temporaire
      //   const link = document.createElement('a')
      //   link.href = data.downloadUrl
      //   link.target = '_blank'
      //   link.rel = 'noopener noreferrer'
      //   document.body.appendChild(link)
      //   link.click()
      //   document.body.removeChild(link)
      // }
      
      toast.success('Téléchargement démarré dans un nouvel onglet !')
      qc.invalidateQueries(['myQuota'])
      qc.invalidateQueries(['document', id])
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'QUOTA_EXCEEDED') {
        toast.error((t) => (
          <div className="flex flex-col gap-2">
            <span>Quota épuisé !</span>
            <div className="flex gap-2">
              <Link to="/upload" className="btn btn-xs btn-primary">Uploader (+2 gratuits)</Link>
              <Link to="/abonnement" className="btn btn-xs btn-warning">S'abonner</Link>
            </div>
          </div>
        ), { duration: 5000 })
        qc.invalidateQueries(['myQuota'])
      } else {
        toast.error(err.response?.data?.error || 'Erreur lors du téléchargement')
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc?.titre,
          text: `Découvrez ce document sur GestDoc : ${doc?.titre}`,
          url: url,
        })
      } catch (err) {
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Lien copié dans le presse-papier !')
  }

  const handleReport = () => {
    toast.success('Signalement envoyé. Merci pour votre vigilance !')
  }

  // Animation d'entrée
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-on-load')
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('opacity-100', 'translate-y-0')
        el.classList.remove('opacity-0', 'translate-y-4')
      }, index * 50)
    })
  }, [doc])

  if (isLoading) return <DocumentDetailSkeleton />

  if (isError || !doc) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
          <AlertTriangle size={48} className="text-error" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Document introuvable</h2>
        <p className="text-base-content/60 mb-6">
          Le document que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Link to="/" className="btn btn-primary gap-2">
          <ArrowLeft size={18} /> Retour à l'accueil
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-3 animate-on-load opacity-0 translate-y-4 transition-all duration-500">
          <Link to="/" className="btn btn-ghost btn-sm gap-2 hover:gap-3 transition-all">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          
          <div className="flex gap-2">
            <button 
              onClick={handleFavorite}
              className="btn btn-ghost btn-sm gap-1"
            >
              <Heart size={16} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
              <span className="hidden sm:inline">{isFavorite ? 'Favori' : 'Ajouter aux favoris'}</span>
            </button>
            <button 
              onClick={handleShare}
              className="btn btn-ghost btn-sm gap-1"
              onMouseEnter={() => setShowShareTooltip(true)}
              onMouseLeave={() => setShowShareTooltip(false)}
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button 
              onClick={handleReport}
              className="btn btn-ghost btn-sm gap-1 text-error hover:text-error"
            >
              <Flag size={16} />
              <span className="hidden sm:inline">Signaler</span>
            </button>
          </div>
        </div>

        {/* Carte principale */}
        <div className="card bg-base-100 shadow-xl overflow-hidden animate-on-load opacity-0 translate-y-4 transition-all duration-500" style={{ transitionDelay: '0.1s' }}>
          {/* Bandeau premium si applicable */}
          {doc.isPremium && (
            <div className="bg-gradient-to-r from-warning to-warning/80 text-warning-content px-4 py-2 flex items-center justify-center gap-2 text-sm">
              <Crown size={16} />
              <span>Document premium inclus dans l'abonnement</span>
            </div>
          )}

          {/* Vignette améliorée */}
          {doc.thumbnailUrl && (
            <div className="relative rounded-t-xl overflow-hidden bg-base-200 max-h-80 flex items-center justify-center group">
              <img
                src={doc.thumbnailUrl}
                alt={`Aperçu de ${doc.titre}`}
                className="max-h-80 object-contain transition-transform duration-500 group-hover:scale-105"
                onError={e => e.target.parentElement.style.display = 'none'}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
            </div>
          )}

          <div className="card-body p-6 md:p-8 space-y-6">
            {/* En-tête avec icône et titre */}
            <div className="flex items-start gap-5">
              <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex-shrink-0 shadow-inner">
                {doc.fileType === 'pdf'
                  ? <FileText size={44} className="text-red-500" />
                  : <File    size={44} className="text-blue-500" />
                }
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">{doc.titre}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{doc.author?.name || 'Utilisateur'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Publié le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{doc.viewCount || 0} vues</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {doc.description && (
              <div className="bg-gradient-to-r from-base-200 to-base-100 rounded-xl p-5 border-l-4 border-primary">
                <p className="text-sm leading-relaxed">{doc.description}</p>
              </div>
            )}

            {/* Grille de métadonnées */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { icon: <GraduationCap size={16} />, label: 'Niveau',         value: getClassLabel(doc.classe), color: 'info' },
                { icon: <BookOpen      size={16} />, label: 'Matière',        value: getMatiereLabel(doc.matiere), color: 'success' },
                { icon: <Calendar      size={16} />, label: 'Année scolaire', value: doc.annee || '2023-2024', color: 'warning' },
                { icon: <FileText      size={16} />, label: 'Format',         value: doc.fileType?.toUpperCase(), color: 'error' },
                { icon: <Download      size={16} />, label: 'Téléchargements', value: `${doc.downloadCount || 0} fois`, color: 'primary' },
                { icon: <Award         size={16} />, label: 'Note moyenne',   value: '4.5/5 (12 avis)', color: 'secondary' },
              ].map((item, i) => (
                <div key={i} className={`bg-${item.color}/5 rounded-xl p-3 border border-${item.color}/20 hover:shadow-md transition-all duration-200`}>
                  <div className={`flex items-center gap-2 text-${item.color} text-xs mb-1`}>
                    {item.icon} {item.label}
                  </div>
                  <p className="font-semibold text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Informations fichier */}
            {doc.fileSize && (
              <div className="bg-base-200 rounded-xl p-3 flex items-center justify-between text-sm">
                <span className="text-base-content/60">Taille du fichier</span>
                <span className="font-mono font-semibold">{formatFileSize(doc.fileSize)}</span>
              </div>
            )}

            {/* Quota info */}
            {user && quota && !quota.unlimited && (
              <div className={`rounded-xl p-4 text-sm transition-all duration-300 ${
                quota.remaining === 0
                  ? 'bg-gradient-to-r from-error/10 to-error/5 border border-error/30 text-error'
                  : quota.remaining <= 3
                  ? 'bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/30 text-warning'
                  : 'bg-gradient-to-r from-success/10 to-success/5 border border-success/30 text-success'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {quota.remaining === 0
                      ? <Lock size={18} className="flex-shrink-0" />
                      : <Download size={18} className="flex-shrink-0" />
                    }
                    <span>
                      {quota.remaining === 0
                        ? 'Quota de téléchargement épuisé'
                        : `Encore ${quota.remaining} téléchargement${quota.remaining > 1 ? 's' : ''} disponible${quota.remaining > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-base-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(quota.used / quota.totalAllowed) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs">{quota.used} / {quota.totalAllowed}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Bouton de téléchargement - une seule fenêtre dans un nouvel onglet */}
            <div className="pt-4 space-y-3">
              {user ? (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={downloading || quotaExhausted}
                    className={`btn btn-lg w-full gap-3 transition-all duration-300 transform hover:scale-[1.02] ${
                      quotaExhausted 
                        ? 'btn-disabled bg-base-300' 
                        : 'btn-primary shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {downloading
                      ? <span className="loading loading-spinner loading-sm"></span>
                      : quotaExhausted ? <Lock size={20} /> : <Download size={20} />
                    }
                    {downloading
                      ? 'Préparation du téléchargement...'
                      : quotaExhausted ? 'Quota de téléchargement épuisé' : 'Télécharger le document'
                    }
                  </button>

                  {quotaExhausted && (
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/upload" className="btn btn-outline gap-2 group">
                        <Upload size={16} className="group-hover:scale-110 transition-transform" /> 
                        Uploader un document
                        <span className="text-xs opacity-70">(+2 gratuits)</span>
                      </Link>
                      <Link to="/abonnement" className="btn btn-warning gap-2 group">
                        <Crown size={16} className="group-hover:scale-110 transition-transform" /> 
                        S'abonner
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="alert bg-gradient-to-r from-info/10 to-info/5 border border-info/30 text-info text-sm py-3">
                    <CheckCircle size={18} />
                    <span>Connectez-vous pour télécharger ce document gratuitement.</span>
                  </div>
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/documents/${id}` } }}
                    className="btn btn-primary w-full gap-2 group"
                  >
                    <Download size={18} className="group-hover:scale-110 transition-transform" /> 
                    Se connecter pour télécharger
                  </Link>
                  <p className="text-xs text-center text-base-content/40">
                    Pas encore de compte ? <Link to="/register" className="text-primary hover:underline">Inscrivez-vous gratuitement</Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section documents similaires */}
        {recommendedDocs && recommendedDocs.length > 0 && (
          <div className="animate-on-load opacity-0 translate-y-4 transition-all duration-500" style={{ transitionDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                <h3 className="font-bold text-lg">Documents similaires</h3>
              </div>
              <Link to="/recherche" className="text-xs text-primary hover:underline">
                Voir plus →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendedDocs.slice(0, 4).map(rec => (
                <RecommendedDocument key={rec.id} doc={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Section avis (placeholder) */}
        <div className="animate-on-load opacity-0 translate-y-4 transition-all duration-500" style={{ transitionDelay: '0.3s' }}>
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-warning fill-warning" />
                  <span className="font-semibold">4.5/5 · 12 avis</span>
                </div>
                <button className="btn btn-sm btn-ghost gap-1">
                  <Star size={14} /> Donner mon avis
                </button>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                  <User size={14} />
                  <span>Marie D.</span>
                  <Clock size={14} />
                  <span>Il y a 2 jours</span>
                </div>
                <p className="text-sm mt-1">Très bon document, bien structuré et utile pour mes révisions !</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}