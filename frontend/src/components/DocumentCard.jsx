// src/components/DocumentCard.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, File, Download, Calendar, BookOpen, GraduationCap, 
  Heart, Eye, Star, Clock, TrendingUp, AlertCircle, Lock, Loader2 
} from 'lucide-react'
import { getClassLabel, getMatiereLabel, formatFileSize } from '../utils/constants'
import { documentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

// Version Skeleton pour le chargement
export const DocumentCardSkeleton = () => (
  <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden animate-pulse">
    <div className="h-24 bg-base-300" />
    <div className="card-body p-4 space-y-3">
      <div className="skeleton h-4 w-3/4 mx-auto" />
      <div className="skeleton h-3 w-1/2 mx-auto" />
      <div className="flex justify-center gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="skeleton h-4 w-12" />
        <div className="skeleton h-6 w-16 rounded-lg" />
      </div>
    </div>
  </div>
)

export default function DocumentCard({ doc, showFavorite = false, onFavorite, variant = 'featured' }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const hasThumbnail = !!doc.thumbnailUrl && !imageError
  const isPdf = doc.fileType === 'pdf'
  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
  
  const getFileIcon = () => {
    if (isPdf) return <FileText size={32} className="text-red-400 opacity-60" />
    return <File size={32} className="text-blue-400 opacity-60" />
  }

  const handleFavoriteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
    if (onFavorite) onFavorite(doc.id)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Fonction de téléchargement
  const handleDownload = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.error('Connectez-vous pour télécharger ce document')
      navigate('/login', { state: { from: { pathname: `/documents/${doc.id}` } } })
      return
    }

    setIsDownloading(true)
    try {
      const { data } = await documentsApi.getDownloadUrl(doc.id)
      
      // Une seule fenêtre de téléchargement
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer')
      
      toast.success('Téléchargement démarré !')
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'QUOTA_EXCEEDED') {
        toast.error((t) => (
          <div className="flex flex-col gap-2">
            <span>Quota épuisé !</span>
            <div className="flex gap-2">
              <Link to="/upload" className="btn btn-xs btn-primary">Uploader (+2)</Link>
              <Link to="/abonnement" className="btn btn-xs btn-warning">S'abonner</Link>
            </div>
          </div>
        ), { duration: 5000 })
      } else {
        toast.error(err.response?.data?.error || 'Erreur lors du téléchargement')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  // Redirection vers la page du document (uniquement via bouton)
  const handleViewDocument = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/documents/${doc.id}`)
  }

  // Variantes de carte
  const variants = {
    default: 'card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 border border-base-200 hover:-translate-y-1',
    compact: 'card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 border border-base-200',
    featured: 'card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-primary/20 hover:-translate-y-1',
  }

  return (
    <div 
      className={variants[variant] || variants.default}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // ✅ PAS de onClick - la carte ne fait rien au clic
    >
      {/* Section image/vignette */}
      <div className="relative overflow-hidden">
        {hasThumbnail ? (
          <>
            <figure className="h-28 bg-gradient-to-br from-base-200 to-base-300 overflow-hidden">
              <img
                src={doc.thumbnailUrl}
                alt={`Aperçu de ${doc.titre}`}
                className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                loading="lazy"
                onError={handleImageError}
              />
            </figure>
            
            {/* Badges superposés */}
            <div className="absolute top-2 left-2 flex gap-1">
              <span className="badge badge-xs badge-primary gap-0.5 shadow-md">
                {isPdf ? 'PDF' : doc.fileType?.toUpperCase()}
              </span>
              {doc.isPremium && (
                <span className="badge badge-xs badge-warning gap-0.5 shadow-md">
                  ⭐ Premium
                </span>
              )}
              {isExpired && (
                <span className="badge badge-xs badge-error gap-0.5 shadow-md">
                  Expiré
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="h-28 bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center relative">
            {getFileIcon()}
            
            {/* Badges superposés */}
            <div className="absolute top-2 left-2 flex gap-1">
              <span className="badge badge-xs badge-info shadow-md">
                {doc.fileType?.toUpperCase()}
              </span>
              {doc.isPremium && (
                <span className="badge badge-xs badge-warning shadow-md">
                  ⭐ Premium
                </span>
              )}
            </div>
          </div>
        )}

        {/* Badge de popularité */}
        {doc.downloadCount > 100 && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-xs badge-success gap-0.5 shadow-md">
              <TrendingUp size={8} /> Populaire
            </span>
          </div>
        )}

        {/* ✅ PLUS D'OVERLAY DE TÉLÉCHARGEMENT - supprimé */}
        
        {/* Indicateur de chargement (si téléchargement en cours via bouton) */}
        {isDownloading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-white rounded-full p-3">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="card-body p-4">
        {/* Titre */}
        <div className="group relative">
          <h3 className="font-semibold text-sm text-center leading-snug line-clamp-2">
            {doc.titre}
          </h3>
          {doc.titre.length > 60 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-base-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
              {doc.titre}
            </div>
          )}
        </div>

        {/* Métadonnées */}
        {variant === 'featured' && doc.description && (
          <p className="text-xs text-base-content/60 text-center line-clamp-2 mt-1">
            {doc.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
          <span className="badge badge-primary badge-xs gap-0.5" title="Niveau">
            <GraduationCap size={9} /> {getClassLabel(doc.classe)}
          </span>
          <span className="badge badge-secondary badge-xs gap-0.5" title="Matière">
            <BookOpen size={9} /> {getMatiereLabel(doc.matiere)}
          </span>
          <span className="badge badge-ghost badge-xs gap-0.5" title="Année">
            <Calendar size={9} /> {doc.annee || new Date(doc.createdAt).getFullYear()}
          </span>
        </div>

        {/* Date et téléchargements */}
        <div className="flex items-center justify-between text-[10px] text-base-content/50 mt-2">
          <span className="flex items-center gap-0.5" title="Date d'ajout">
            <Clock size={9} />
            {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
          <span className="flex items-center gap-0.5" title="Nombre de téléchargements">
            <Download size={9} />
            {doc.downloadCount?.toLocaleString('fr-FR') || 0}
          </span>
          {doc.fileSize && (
            <span className="flex items-center gap-0.5" title="Taille du fichier">
              <File size={9} />
              {formatFileSize(doc.fileSize)}
            </span>
          )}
        </div>

        {/* Actions - UNIQUEMENT les boutons */}
        <div className="card-actions justify-between items-center mt-3 pt-2 border-t border-base-200">
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-0.5 text-xs text-base-content/50">
              <Eye size={11} />
              {doc.viewCount || 0}
            </span>
            {doc.rating && (
              <span className="flex items-center gap-0.5 text-xs text-warning">
                <Star size={11} className="fill-warning" />
                {doc.rating}
              </span>
            )}
          </div>
          
          <div className="flex gap-1">
            {showFavorite && (
              <button
                onClick={handleFavoriteClick}
                className={`btn btn-xs btn-square btn-ghost transition-all duration-200 ${
                  isFavorite ? 'text-red-500' : 'text-base-content/40 hover:text-red-500'
                }`}
                title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart size={14} className={isFavorite ? 'fill-red-500' : ''} />
              </button>
            )}
            
            {/* Bouton Voir */}
            <button
              onClick={handleViewDocument}
              className="btn btn-primary btn-xs gap-1 transition-all duration-200 hover:gap-2"
              title="Voir le document"
            >
              <Eye size={12} /> Voir
            </button>

            {/* Bouton Télécharger */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn btn-success btn-xs gap-1 transition-all duration-200 hover:gap-2"
              title="Télécharger directement"
            >
              {isDownloading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Download size={12} />
              )}
              {!isDownloading && 'DL'}
            </button>
          </div>
        </div>

        {/* Badge nouveau */}
        {new Date(doc.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-xs badge-success animate-pulse">
              Nouveau !
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Version horizontale
export const DocumentCardHorizontal = ({ doc }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.error('Connectez-vous pour télécharger')
      navigate('/login')
      return
    }

    setIsDownloading(true)
    try {
      const { data } = await documentsApi.getDownloadUrl(doc.id)
      window.open(data.downloadUrl, '_blank')
      toast.success('Téléchargement démarré !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleViewDocument = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/documents/${doc.id}`)
  }

  return (
    <div className="flex gap-3 bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all p-3 border border-base-200">
      {/* Vignette miniature */}
      <div className="w-16 h-16 flex-shrink-0 bg-base-200 rounded-lg overflow-hidden">
        {doc.thumbnailUrl ? (
          <img 
            src={doc.thumbnailUrl} 
            alt={doc.titre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <File size={24} className="text-base-content/40" />
          </div>
        )}
      </div>
      
      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm line-clamp-1">
          {doc.titre}
        </h3>
        <div className="flex flex-wrap gap-1 mt-1">
          <span className="badge badge-primary badge-xs">{getClassLabel(doc.classe)}</span>
          <span className="badge badge-secondary badge-xs">{getMatiereLabel(doc.matiere)}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-base-content/50">
          <span className="flex items-center gap-0.5">
            <Download size={9} /> {doc.downloadCount || 0}
          </span>
          <span className="flex items-center gap-0.5">
            <Calendar size={9} /> {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>
      
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={handleViewDocument}
          className="btn btn-xs btn-primary btn-square"
          title="Voir le document"
        >
          <Eye size={12} />
        </button>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn btn-xs btn-success btn-square"
          title="Télécharger"
        >
          {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        </button>
      </div>
    </div>
  )
}

// Version mobile
export const DocumentCardMobile = ({ doc }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.error('Connectez-vous')
      navigate('/login')
      return
    }

    setIsDownloading(true)
    try {
      const { data } = await documentsApi.getDownloadUrl(doc.id)
      window.open(data.downloadUrl, '_blank')
      toast.success('Téléchargement démarré !')
    } catch (err) {
      toast.error('Erreur')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleViewDocument = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/documents/${doc.id}`)
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg hover:bg-base-200 transition-colors">
      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <FileText size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-medium truncate">{doc.titre}</h4>
        <div className="flex gap-1 mt-0.5">
          <span className="badge badge-primary badge-xs">{getClassLabel(doc.classe)}</span>
          <span className="badge badge-secondary badge-xs">{getMatiereLabel(doc.matiere)}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={handleViewDocument}
          className="btn btn-xs btn-primary btn-square"
          title="Voir"
        >
          <Eye size={12} />
        </button>
        <button
          onClick={handleDownload}
          className="btn btn-xs btn-ghost btn-square"
          title="Télécharger"
        >
          <Download size={12} className="text-base-content/60" />
        </button>
      </div>
    </div>
  )
}

