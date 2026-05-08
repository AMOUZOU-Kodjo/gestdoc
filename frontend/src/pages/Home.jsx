import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, Upload, Users, ArrowRight, Download, FileText, TrendingUp,
  Sun, Moon, ChevronLeft, ChevronRight, Eye, Calendar, Clock, RefreshCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { NIVEAUX, getNiveauxForProfile, getMatiereLabel, getClassLabel } from '../utils/constants'
import DonBanner from '../components/DonBanner'
import { documentsApi, adminApi } from '../services/api'

const NIVEAU_COLORS = {
  BEPC:       { bg: 'bg-info/10',       border: 'border-info/30',       text: 'text-info',       btn: 'btn-info',       gradient: 'from-info/20 to-info/5' },
  PREMIERE:   { bg: 'bg-success/10',    border: 'border-success/30',    text: 'text-success',    btn: 'btn-success',    gradient: 'from-success/20 to-success/5' },
  TERMINALE:  { bg: 'bg-warning/10',    border: 'border-warning/30',    text: 'text-warning',    btn: 'btn-warning',    gradient: 'from-warning/20 to-warning/5' },
  UNIVERSITE: { bg: 'bg-secondary/10',  border: 'border-secondary/30',  text: 'text-secondary',  btn: 'btn-secondary',  gradient: 'from-secondary/20 to-secondary/5' },
}

const NIVEAU_DETAILS = {
  BEPC:       { icon: '📚', classes: 'Troisième',              desc: 'Cours, exercices et annales pour préparer le BEPC' },
  PREMIERE:   { icon: '📖', classes: 'Première A, C & D',      desc: 'Ressources pour la classe de Première' },
  TERMINALE:  { icon: '🎓', classes: 'Terminale A, C & D',     desc: 'Préparez votre BAC avec les meilleures ressources' },
  UNIVERSITE: { icon: '🏫', classes: 'L1–M2, BTS, DUT, CPGE', desc: "Documents pour l'enseignement supérieur" },
}

// ─── Stat Cards (défini APRÈS la déclaration, sera utilisé dans le composant) ───
// Note: Les valeurs seront remplacées dynamiquement dans le composant

// ─── Skeletons ────────────────────────────────────────────────────────────────
const DocumentSkeleton = () => (
  <div className="w-full flex-shrink-0 px-4">
    <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden animate-pulse">
      <div className="h-2 bg-base-300" />
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-base-300 rounded-xl" />
            <div className="space-y-2">
              <div className="w-20 h-5 bg-base-300 rounded-full" />
              <div className="w-16 h-4 bg-base-300 rounded-full" />
            </div>
          </div>
          <div className="w-12 h-5 bg-base-300 rounded" />
        </div>
        <div className="h-6 bg-base-300 rounded w-3/4" />
        <div className="h-4 bg-base-300 rounded w-1/2" />
        <div className="flex gap-4">
          <div className="h-4 bg-base-300 rounded w-24" />
          <div className="h-4 bg-base-300 rounded w-20" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-base-300 rounded flex-1" />
          <div className="h-10 w-10 bg-base-300 rounded" />
        </div>
      </div>
    </div>
  </div>
)

const NiveauCardSkeleton = () => (
  <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden animate-pulse">
    <div className="h-1 bg-base-300" />
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="w-14 h-14 bg-base-300 rounded-xl" />
        <div className="w-20 h-6 bg-base-300 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-base-300 rounded w-1/2" />
        <div className="h-4 bg-base-300 rounded w-3/4" />
        <div className="h-4 bg-base-300 rounded w-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-base-300 rounded w-32" />
        <div className="h-8 w-20 bg-base-300 rounded-full" />
      </div>
    </div>
  </div>
)

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Home() {
  const { user, hasAllAccess } = useAuth()
  const [darkMode, setDarkMode]       = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [autoPlay, setAutoPlay]       = useState(true)
  const autoPlayRef = useRef(null)

  // ─── Thème ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved ? saved === 'dark' : prefersDark
    setDarkMode(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // ─── Données réelles : documents récents ─────────────────────────────────
  const {
    data: docsData,
    isLoading: isLoadingDocs,
    refetch: refetchDocs,
    isFetching: isFetchingDocs,
  } = useQuery({
    queryKey: ['recentDocuments'],
    queryFn:  () => documentsApi.getAll({ limit: 5, page: 1 }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })
  const recentDocuments = docsData?.documents || []

  // ─── Données réelles : stats admin (public) ───────────────────────────────
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['publicStats'],
    queryFn:  () => adminApi.stats().then(r => r.data).catch(() => null),
    staleTime: 10 * 60 * 1000,
  })

  // ─── Données réelles : comptage par niveau ────────────────────────────────
  const { data: niveauCounts } = useQuery({
    queryKey: ['niveauCounts'],
    queryFn: async () => {
      const results = await Promise.all(
        NIVEAUX.map(n =>
          documentsApi.getAll({ niveau: n.value, limit: 1 })
            .then(r => ({ niveau: n.value, count: r.data.pagination?.total || 0 }))
            .catch(() => ({ niveau: n.value, count: 0 }))
        )
      )
      return Object.fromEntries(results.map(r => [r.niveau, r.count]))
    },
    staleTime: 10 * 60 * 1000,
  })

  // ─── STAT_CARDS avec valeurs dynamiques ────────────────────────────────────
  const STAT_CARDS = [
    { 
      icon: <Users size={20} />,    
      label: 'Utilisateurs',      
      value: stats?.totalUsers ? stats.totalUsers.toLocaleString('fr-FR') : (isLoadingStats ? '...' : '—'),      
      color: 'text-primary',  
      bg: 'bg-primary/10' 
    },
    { 
      icon: <FileText size={20} />, 
      label: 'Documents publiés', 
      value: stats?.totalDocuments ? stats.totalDocuments.toLocaleString('fr-FR') : (isLoadingStats ? '...' : '—'),  
      color: 'text-success',  
      bg: 'bg-success/10' 
    },
    { 
      icon: <Download size={20} />, 
      label: 'Téléchargements',   
      value: stats?.totalDownloads ? stats.totalDownloads.toLocaleString('fr-FR') : (isLoadingStats ? '...' : '—'),  
      color: 'text-info',     
      bg: 'bg-info/10' 
    },
    { 
      icon: <Clock size={20} />,    
      label: 'En attente',        
      value: stats?.pendingDocuments ? stats.pendingDocuments.toLocaleString('fr-FR') : (isLoadingStats ? '...' : '—'),  
      color: 'text-warning',  
      bg: 'bg-warning/10' 
    },
  ]

  // ─── Carrousel ────────────────────────────────────────────────────────────
  const nextSlide = useCallback(() => {
    if (isAnimating || recentDocuments.length === 0) return
    setIsAnimating(true)
    setCurrentSlide(prev => (prev + 1) % recentDocuments.length)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating, recentDocuments.length])

  const prevSlide = () => {
    if (isAnimating || recentDocuments.length === 0) return
    setIsAnimating(true)
    setCurrentSlide(prev => (prev - 1 + recentDocuments.length) % recentDocuments.length)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const goToSlide = (index) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 500)
    setAutoPlay(true)
  }

  useEffect(() => {
    if (autoPlay && recentDocuments.length > 1 && !isLoadingDocs) {
      autoPlayRef.current = setInterval(nextSlide, 5000)
    }
    return () => clearInterval(autoPlayRef.current)
  }, [autoPlay, nextSlide, recentDocuments.length, isLoadingDocs])

  // ─── Intersection Observer pour animations d'entrée ───────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )
    document.querySelectorAll('.card-animate').forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [isLoadingDocs, niveauCounts])

  const accessibleNiveaux = user
    ? NIVEAUX.filter(n => getNiveauxForProfile(user.profile).includes(n.value) || hasAllAccess)
    : NIVEAUX

  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .card-animate        { opacity: 0; }
      `}</style>

      {/* Bouton thème */}
      <button
        onClick={() => setDarkMode(d => !d)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        style={{ background: darkMode ? 'linear-gradient(135deg,#1a1a2e,#16213e)' : 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white' }}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 animate-bounce">
              <span className="text-xs font-medium tracking-wide text-white">📚 Éducation pour tous</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white tracking-tight">
              GestDoc
              <span className="block text-2xl md:text-3xl font-light mt-2 text-primary-content/90">
                La réussite par le partage
              </span>
            </h1>
            <p className="text-lg md:text-xl text-primary-content/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Plateforme de partage de documents scolaires et universitaires au TOGO —
              cours, exercices, annales pour tous les niveaux.
            </p>
            {!user ? (
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register" className="btn btn-white btn-lg gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                  <Users size={20} /> Créer un compte gratuit
                </Link>
                <Link to="/login" className="btn btn-outline btn-white btn-lg backdrop-blur-sm bg-white/10 hover:bg-white/20">
                  Se connecter
                </Link>
              </div>
            ) : (
              <Link to="/upload" className="btn btn-white btn-lg gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                <Upload size={20} /> Uploader un document
              </Link>
            )}
          </div>
        </div>
      </div>

      <DonBanner />

      {/* Stats avec STAT_CARDS */}
      <div className="bg-base-100 border-b border-base-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STAT_CARDS.map((card, i) => (
              <div key={i} className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-200`}>
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {card.value}
                      </p>
                      <p className="text-xs text-base-content/60">{card.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carrousel — documents réels */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={24} className="text-primary" />
            <h2 className="text-3xl font-bold">Derniers documents ajoutés</h2>
            <button
              onClick={() => refetchDocs()}
              disabled={isFetchingDocs}
              className="ml-2 p-2 rounded-full hover:bg-base-300 transition-colors"
              title="Actualiser"
            >
              <RefreshCw size={18} className={`${isFetchingDocs ? 'animate-spin' : ''} text-base-content/60`} />
            </button>
          </div>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          <p className="text-base-content/60 mt-3">Découvrez les ressources les plus récentes partagées par la communauté</p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          {!isLoadingDocs && recentDocuments.length > 0 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 rounded-full bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft size={20} className="text-base-content" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 rounded-full bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
              >
                <ChevronRight size={20} className="text-base-content" />
              </button>
            </>
          )}

          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {isLoadingDocs ? (
                Array(3).fill(0).map((_, i) => <DocumentSkeleton key={i} />)
              ) : recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <div key={doc.id} className="w-full flex-shrink-0 px-4">
                    <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="bg-gradient-to-r from-primary to-secondary h-2" />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-xl">
                              {doc.fileType === 'pdf'
                                ? <FileText size={24} className="text-red-500" />
                                : <FileText size={24} className="text-blue-500" />
                              }
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {getMatiereLabel(doc.matiere)}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-info/20 text-info">
                                {getClassLabel(doc.classe)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-base-content/60 flex-shrink-0">
                            <Download size={14} />
                            <span>{doc.downloadCount ?? 0}</span>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                          {doc.titre}
                        </h3>

                        {doc.description && (
                          <p className="text-sm text-base-content/60 mb-3 line-clamp-2">{doc.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-base-content/50 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={12} />
                            <span>{doc.downloadCount ?? 0} téléchargements</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-base-200">
                            {doc.annee}
                          </span>
                        </div>

                        <div className="flex gap-3 mt-4">
                          <Link to={`/documents/${doc.id}`} className="btn btn-primary btn-sm flex-1 gap-2">
                            <Eye size={16} /> Voir le document
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-12">
                  <FileText size={40} className="mx-auto text-base-content/30 mb-3" />
                  <p className="text-base-content/60">Aucun document disponible pour le moment</p>
                </div>
              )}
            </div>
          </div>

          {!isLoadingDocs && recentDocuments.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {recentDocuments.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index ? 'w-8 bg-primary' : 'w-2 bg-base-content/30 hover:bg-base-content/50'
                  }`}
                />
              ))}
            </div>
          )}

          {autoPlay && !isLoadingDocs && recentDocuments.length > 1 && (
            <div className="text-center mt-4">
              <span className="text-xs text-base-content/40 animate-pulse">
                ⏵ Lecture automatique · survolez pour mettre en pause
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Niveaux avec comptages réels */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Choisissez votre niveau</h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full mb-4" />
          <p className="text-base-content/60">
            {user ? 'Accédez directement à vos documents' : 'Connectez-vous pour accéder aux documents'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!niveauCounts ? (
            Array(4).fill(0).map((_, i) => <NiveauCardSkeleton key={i} />)
          ) : (
            NIVEAUX.map((n, idx) => {
              const c      = NIVEAU_COLORS[n.value]
              const d      = NIVEAU_DETAILS[n.value]
              const count  = niveauCounts?.[n.value] ?? 0
              const locked = !!user && !hasAllAccess && !getNiveauxForProfile(user.profile).includes(n.value)

              return (
                <div
                  key={n.value}
                  className={`card-animate group relative bg-base-100 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                    locked ? 'opacity-60' : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${c.bg} text-3xl transition-transform group-hover:scale-110 duration-200`}>
                        {d.icon}
                      </div>
                      {!locked && (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c.bg} ${c.text}`}>
                          {count > 0 ? `${count} doc${count > 1 ? 's' : ''}` : 'Nouveau'}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-xl font-bold ${c.text} mb-1`}>{n.label}</h3>
                    <p className="text-xs font-mono text-base-content/50 mb-3">{d.classes}</p>
                    <p className="text-sm text-base-content/70 leading-relaxed mb-4">{d.desc}</p>

                    <div className="flex items-center justify-between mt-2">
                      {locked ? (
                        <span className="text-xs text-base-content/40 flex items-center gap-1">
                          🔒 Non accessible avec votre profil
                        </span>
                      ) : (
                        <Link
                          to={n.route}
                          className={`inline-flex items-center gap-2 text-sm font-medium ${c.text} hover:underline transition-all`}
                        >
                          Explorer les ressources
                          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                      {!locked && (
                        <Link to={n.route} className={`btn btn-xs ${c.btn} btn-outline rounded-full`}>
                          Accéder
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* CTA non connecté */}
        {!user && (
          <div className="mt-16 text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8">
            <FileText size={40} className="mx-auto text-primary/40 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Prêt à réussir ?</h3>
            <p className="text-base-content/60 mb-4 text-sm max-w-md mx-auto">
              Inscrivez-vous gratuitement et accédez à des milliers de documents pour exceller dans vos études.
            </p>
            <Link to="/register" className="btn btn-primary gap-2">
              <Users size={18} /> Créer un compte gratuit
            </Link>
          </div>
        )}

        {/* CTA profil manquant */}
        {user && !user.profile && (
          <div className="alert alert-info mt-8 max-w-xl mx-auto shadow-xl rounded-xl">
            <TrendingUp size={20} />
            <span className="text-sm">Configurez votre profil pour accéder aux documents de votre niveau.</span>
            <Link to="/profile" className="btn btn-sm btn-info">Configurer maintenant</Link>
          </div>
        )}
      </div>
    </div>
  )
}