import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsApi } from '../services/api'
import { X, ChevronLeft, ChevronRight, FileText, Maximize2, Minimize2 } from 'lucide-react'

export default function DocumentViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageErrors, setPageErrors] = useState({})
  const [maxPagesReached, setMaxPagesReached] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await documentsApi.getView(id)
        setDoc(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Impossible de charger le document')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') navigate(-1)
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentPage, maxPagesReached])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const goNext = useCallback(() => {
    if (!maxPagesReached) setCurrentPage(p => p + 1)
  }, [maxPagesReached])

  const goPrev = useCallback(() => {
    if (currentPage > 1) setCurrentPage(p => p - 1)
  }, [currentPage])

  const handlePageError = (pageNum) => {
    setPageErrors(prev => ({ ...prev, [pageNum]: true }))
    if (pageNum === currentPage && currentPage > 1) {
      setMaxPagesReached(true)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-base-300 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
          <p className="text-base-content/60">Chargement du document...</p>
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="fixed inset-0 z-50 bg-base-300 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <FileText size={48} className="mx-auto text-base-content/30 mb-3" />
          <h2 className="text-xl font-bold mb-2">Document indisponible</h2>
          <p className="text-base-content/60 mb-4 text-sm">{error || 'Document introuvable'}</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">Retour</button>
        </div>
      </div>
    )
  }

  const isPdf = doc.fileType === 'pdf' && doc.resourceType === 'image'
  const pageUrl = isPdf
    ? doc.viewerBaseUrl.replace('/image/upload/', `/image/upload/pg_${currentPage}/`)
    : null

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${fullscreen ? '' : 'bg-base-300'}`}>
      {/* Barre de contrôle */}
      <div className="flex items-center justify-between px-4 py-3 bg-base-100 border-b border-base-200 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-square">
            <X size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm truncate max-w-md">{doc.titre}</h1>
            <p className="text-xs text-base-content/50 truncate">
              {doc.classe} · {doc.matiere} · {doc.annee}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPdf && (
            <>
              <span className="text-xs text-base-content/60 tabular-nums">
                Page {currentPage}
              </span>
              <div className="join">
                <button onClick={goPrev} disabled={currentPage <= 1} className="join-item btn btn-xs btn-ghost btn-square">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={goNext} disabled={maxPagesReached} className="join-item btn btn-xs btn-ghost btn-square">
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
          <button onClick={() => setFullscreen(f => !f)} className="btn btn-ghost btn-sm btn-square">
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Zone de visualisation */}
      <div className="flex-1 overflow-auto bg-base-300" onContextMenu={(e) => e.preventDefault()}>
        {isPdf ? (
          <div className="min-h-full flex flex-col items-center py-6 px-4 gap-6 select-none">
            {!pageErrors[currentPage] ? (
              <img
                key={currentPage}
                src={pageUrl}
                alt={`Page ${currentPage} - ${doc.titre}`}
                className="shadow-2xl rounded-lg max-w-full w-[800px] h-auto"
                style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
                onError={() => handlePageError(currentPage)}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-base-content/40 text-sm">
                {maxPagesReached && currentPage > 1
                  ? 'Fin du document'
                  : 'Page non disponible'}
              </div>
            )}

            {maxPagesReached && currentPage >= 2 && (
              <p className="text-xs text-base-content/30 pb-8">— Fin du document —</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-4">
              <FileText size={48} className="mx-auto text-base-content/30 mb-3" />
              <p className="text-base-content/60 text-sm mb-2">
                Ce type de fichier (DOCX) ne peut pas être affiché en ligne.
              </p>
              <p className="text-xs text-base-content/40">
                Veuillez télécharger le fichier pour le consulter.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
