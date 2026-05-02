// src/components/DocumentCard.jsx
import { Link } from 'react-router-dom'
import { FileText, File, Download, Calendar, BookOpen, GraduationCap } from 'lucide-react'
import { getClassLabel, getMatiereLabel, formatFileSize } from '../utils/constants'

export default function DocumentCard({ doc }) {
  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-200 hover:-translate-y-0.5">
      <div className="card-body p-4">
        {/* Header — icône + titre seulement */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            {doc.fileType === 'pdf'
              ? <FileText size={24} className="text-red-500" />
              : <File    size={24} className="text-blue-500" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2">
              {doc.titre}
            </h3>
            <span className="text-xs text-base-content/40 uppercase tracking-wide mt-0.5 block">
              {doc.fileType?.toUpperCase()}
              {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="badge badge-primary badge-sm gap-1">
            <GraduationCap size={10} />{getClassLabel(doc.classe)}
          </span>
          <span className="badge badge-secondary badge-sm gap-1">
            <BookOpen size={10} />{getMatiereLabel(doc.matiere)}
          </span>
          <span className="badge badge-ghost badge-sm gap-1">
            <Calendar size={10} />{doc.annee}
          </span>
        </div>

        {/* Footer */}
        <div className="card-actions justify-between items-center mt-3 pt-3 border-t border-base-200">
          <div className="flex items-center gap-1 text-xs text-base-content/50">
            <Download size={12} />
            <span>{doc.downloadCount ?? 0} dl</span>
          </div>
          <Link to={`/documents/${doc.id}`} className="btn btn-primary btn-xs">
            Voir
          </Link>
        </div>
      </div>
    </div>
  )
}