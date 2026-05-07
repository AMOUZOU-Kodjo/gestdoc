// src/components/DocumentCard.jsx
import { Link } from 'react-router-dom'
import { FileText, File, Download, Calendar, BookOpen, GraduationCap } from 'lucide-react'
import { getClassLabel, getMatiereLabel, formatFileSize } from '../utils/constants'

export default function DocumentCard({ doc }) {
  const hasThumbnail = !!doc.thumbnailUrl

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-200 hover:-translate-y-0.5 overflow-hidden">

      {/* Vignette PDF */}
      {hasThumbnail ? (
        <figure className="h-20 bg-base-200 overflow-hidden relative">
          <img
            src={doc.thumbnailUrl}
            alt={`Aperçu de ${doc.titre}`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
            onError={(e) => {
              // Si la vignette échoue, afficher l'icône par défaut
              e.target.parentElement.style.display = 'none'
            }}
          />
          {/* Badge type fichier */}
          <span className="absolute top-2 right-2 badge badge-error badge-sm font-bold shadow">
            PDF
            
          </span>

          <span className="absolute top-2 left-2 badge badge-error badge-sm font-bold shadow">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>

        </figure>
      ) : (
        /* Placeholder pour DOCX ou si pas de vignette */
        <div className="h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
          <File size={40} className="text-blue-400 opacity-60" />
          <span className="absolute top-2 right-2 badge badge-info badge-sm font-bold shadow">
            {doc.fileType?.toUpperCase()}
          </span>
        </div>
      )}

      <div className="card-body p-4">
        {/* Titre */}
        <h3 className="font-semibold text-center text-sm leading-snug line-clamp-2">
          {doc.titre}
        </h3>

        {/* Taille */}
        {doc.fileSize && (
          <p className="text-xs text-base-content/40">{formatFileSize(doc.fileSize)}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className="badge badge-primary badge-sm gap-1">
            <GraduationCap size={10} />{getClassLabel(doc.classe)}
          </span>
          <span className="badge badge-secondary badge-sm gap-1">
            <BookOpen size={10} />{getMatiereLabel(doc.matiere)}
          </span>
          <span className="badge badge-ghost badge-sm gap-1">
            <Calendar size={10} />{doc.annee}
            {/* <span className="badge badge-ghost badge-sm  gap-1">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span> */}

          </span>
        </div>

        {/* Footer */}
        <div className="card-actions justify-between items-center mt-2 pt-2 border-t border-base-200">
          <span className="flex items-center gap-1 text-xs text-base-content/50">
            <Download size={12} />
            {doc.downloadCount ?? 0}
          </span>
          <Link to={`/documents/${doc.id}`} className="btn btn-primary btn-xs">
            Voir
          </Link>
        </div>
      </div>
    </div>
  )
}