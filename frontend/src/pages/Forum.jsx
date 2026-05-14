// src/pages/Forum.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Plus, Search, Heart, Eye,
  Pin, Trash2, X, Send, ThumbsUp, TrendingUp,
  Sparkles, Filter, ChevronDown, Award, Users
} from 'lucide-react'
import { forumApi } from '../services/api'
import ScientificEditor from '../components/ScientificEditor'
import ScientificContent from '../components/ScientificContent'
import { useAuth } from '../contexts/AuthContext'
import { NIVEAUX } from '../utils/constants'
import UserAvatar from '../components/UserAvatar'
import Pagination from '../components/Pagination'
import toast from 'react-hot-toast'

const PROFIL_LABELS = {
  BEPC: '📚 BEPC', PREMIERE: '📖 Première', TERMINALE: '🎓 Terminale',
  UNIVERSITE: '🏫 Université', ENSEIGNANT: '👨‍🏫 Enseignant', ADMIN: '⚡ Admin',
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)  return 'à l\'instant'
  if (s < 3600) return `il y a ${Math.floor(s/60)} min`
  if (s < 86400) return `il y a ${Math.floor(s/3600)}h`
  if (s < 604800) return `il y a ${Math.floor(s/86400)} j`
  return new Date(date).toLocaleDateString('fr-FR')
}

// Composant pour un post individuel
const ForumPost = ({ post, onDelete, onLike, isDeleting, currentUser }) => {
  const isPinned = post.pinned
  const isHot = (post._count?.likes || 0) > 10 || (post._count?.replies || 0) > 5
  const isNew = new Date(post.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  return (
    <div className={`card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 border ${
      isPinned ? 'border-primary/40 bg-gradient-to-r from-primary/5 to-transparent' : 'border-base-200'
    }`}>
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <UserAvatar user={post.user} size="sm" />
          
          <div className="flex-1 min-w-0">
            {/* En-tête du post */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {isPinned && (
                  <span className="badge badge-primary badge-sm gap-0.5">
                    <Pin size={10} /> Épinglé
                  </span>
                )}
                {isHot && (
                  <span className="badge badge-warning badge-sm gap-0.5">
                    <TrendingUp size={10} /> Tendance
                  </span>
                )}
                {isNew && (
                  <span className="badge badge-success badge-sm gap-0.5 animate-pulse">
                    <Sparkles size={10} /> Nouveau
                  </span>
                )}
                
                <Link to={`/forum/${post.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1 text-base">
                  {post.titre}
                </Link>
              </div>
              
              {(currentUser?.id === post.userId || currentUser?.role === 'ADMIN') && (
                <button 
                  onClick={() => onDelete(post.id)}
                  disabled={isDeleting}
                  className="btn btn-ghost btn-xs text-error opacity-60 hover:opacity-100 flex-shrink-0"
                  title="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Aperçu du contenu */}
            <div className="text-sm text-base-content/70 line-clamp-2 mt-1.5">
              <ScientificContent content={post.contenu} />
            </div>

            {/* Métadonnées utilisateur */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs font-medium text-base-content/60">
                {post.user?.prenom} {post.user?.nom}
              </span>
              {post.user?.profile && (
                <span className="badge badge-ghost badge-xs">
                  {PROFIL_LABELS[post.user.profile] || post.user.profile}
                </span>
              )}
              {post.niveau && (
                <span className="badge badge-primary badge-xs">
                  {NIVEAUX.find(n => n.value === post.niveau)?.label || post.niveau}
                </span>
              )}
              <span className="text-xs text-base-content/40 flex items-center gap-1">
                <Eye size={10} /> {post.views}
              </span>
            </div>

            {/* Actions et stats */}
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-base-200">
              <button
                onClick={() => onLike(post.id)}
                className={`flex items-center gap-1 text-xs transition-all duration-200 ${
                  post.likedByMe ? 'text-error font-medium' : 'text-base-content/50 hover:text-error'
                }`}
                title={post.likedByMe ? 'Retirer le like' : 'Aimer'}
              >
                <Heart size={13} className={post.likedByMe ? 'fill-error' : ''} />
                {post._count?.likes || 0}
              </button>
              
              <Link to={`/forum/${post.id}`} className="flex items-center gap-1 text-xs text-base-content/50 hover:text-primary transition-colors">
                <MessageSquare size={13} /> 
                {post._count?.replies || 0} réponse{post._count?.replies !== 1 ? 's' : ''}
              </Link>
              
              <span className="text-xs text-base-content/40 ml-auto">
                {timeAgo(post.createdAt)}
              </span>
              
              <Link to={`/forum/${post.id}`} className="btn btn-xs btn-ghost btn-primary gap-1">
                Lire <ChevronDown size={12} className="rotate-270" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Forum() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [niveau, setNiveau]       = useState('')
  const [sortBy, setSortBy]       = useState('recent') // recent, popular, trending
  const [showCreate, setShowCreate] = useState(false)
  const [newPost, setNewPost]     = useState({ titre: '', contenu: '', niveau: '' })
  const [errors, setErrors]       = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['forumPosts', { page, search, niveau, sortBy }],
    queryFn: () => forumApi.getPosts({ page, limit: 10, search, niveau, sortBy }).then(r => r.data),
    keepPreviousData: true,
  })

  const createMutation = useMutation({
    mutationFn: (data) => forumApi.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries(['forumPosts'])
      setShowCreate(false)
      setNewPost({ titre: '', contenu: '', niveau: '' })
      toast.success('📝 Sujet créé avec succès !')
    },
    onError: (err) => {
      const details = err.response?.data?.details
      if (details) {
        const e = {}; details.forEach(d => { e[d.field] = d.message }); setErrors(e)
      } else toast.error(err.response?.data?.error || 'Erreur')
    },
  })

  const likeMutation = useMutation({
    mutationFn: (id) => forumApi.likePost(id),
    onSuccess: () => qc.invalidateQueries(['forumPosts']),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => forumApi.deletePost(id),
    onSuccess: () => { 
      qc.invalidateQueries(['forumPosts'])
      toast.success('Sujet supprimé')
    },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    const errs = {}
    if (!newPost.titre || newPost.titre.length < 5) errs.titre = 'Titre trop court (min 5 caractères)'
    if (!newPost.contenu || newPost.contenu.length < 10) errs.contenu = 'Message trop court (min 10 caractères)'
    if (Object.keys(errs).length) { setErrors(errs); return }
    createMutation.mutate(newPost)
  }

  const posts = data?.posts || []
  const pinnedPosts = posts.filter(p => p.pinned)
  const regularPosts = posts.filter(p => !p.pinned)
  const pagination = data?.pagination || {}

  const sortOptions = [
    { value: 'recent', label: 'Plus récents', icon: <Sparkles size={12} /> },
    { value: 'popular', label: 'Plus populaires', icon: <TrendingUp size={12} /> },
    { value: 'trending', label: 'Tendance', icon: <Award size={12} /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-100">
      {/* Header amélioré */}
      <div className="relative bg-gradient-to-br from-primary to-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <MessageSquare size={36} /> Forum
                </h1>
                <p className="text-white/80 mt-2">
                  Échangez, posez vos questions et partagez vos connaissances
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="badge badge-white/20 text-white gap-1">
                    <Users size={10} /> {pagination.total || 0} sujets
                  </span>
                </div>
              </div>
              
              {user && (
                <button 
                  onClick={() => setShowCreate(true)} 
                  className="btn btn-white gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={18} /> Nouveau sujet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Filtres et recherche améliorés */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input 
                  type="text" 
                  placeholder="Rechercher un sujet..."
                  value={search} 
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="input input-bordered input-sm w-full pl-9" 
                />
              </div>
              
              <select 
                value={niveau} 
                onChange={e => { setNiveau(e.target.value); setPage(1) }}
                className="select select-bordered select-sm"
              >
                <option value="">📚 Tous les niveaux</option>
                {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
              
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-sm btn-ghost gap-1">
                  <Filter size={12} />
                  {sortOptions.find(s => s.value === sortBy)?.label || 'Trier'}
                  <ChevronDown size={12} />
                </label>
                <ul tabIndex={0} className="dropdown-content z-10 menu menu-sm p-2 shadow-lg bg-base-100 rounded-box w-40">
                  {sortOptions.map(opt => (
                    <li key={opt.value}>
                      <button onClick={() => { setSortBy(opt.value); setPage(1) }} className="gap-2">
                        {opt.icon} {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Affichage des résultats */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm animate-pulse">
                <div className="card-body p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-5 w-3/4" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="flex gap-2">
                        <div className="skeleton h-6 w-16" />
                        <div className="skeleton h-6 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-base-100 rounded-xl">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
              <MessageSquare size={40} className="text-base-content/30" />
            </div>
            <h3 className="text-lg font-semibold text-base-content/60">Aucun sujet trouvé</h3>
            <p className="text-sm text-base-content/40 mt-1">Soyez le premier à lancer une discussion !</p>
            {user && (
              <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm mt-4 gap-2">
                <Plus size={15} /> Créer le premier sujet
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Sujets épinglés */}
            {pinnedPosts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pin size={14} className="text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                    Sujets épinglés
                  </h3>
                  <div className="flex-1 h-px bg-base-300"></div>
                </div>
                <div className="space-y-2">
                  {pinnedPosts.map(post => (
                    <ForumPost 
                      key={post.id}
                      post={post}
                      onDelete={deleteMutation.mutate}
                      onLike={likeMutation.mutate}
                      isDeleting={deleteMutation.isPending}
                      currentUser={user}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sujets normaux */}
            {regularPosts.length > 0 && (
              <div>
                {pinnedPosts.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-base-content/40" />
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                      Tous les sujets
                    </h3>
                    <div className="flex-1 h-px bg-base-300"></div>
                  </div>
                )}
                <div className="space-y-2">
                  {regularPosts.map(post => (
                    <ForumPost 
                      key={post.id}
                      post={post}
                      onDelete={deleteMutation.mutate}
                      onLike={likeMutation.mutate}
                      isDeleting={deleteMutation.isPending}
                      currentUser={user}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal création post amélioré */}
      {showCreate && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-primary/10">
                  <MessageSquare size={18} className="text-primary" />
                </div>
                <h3 className="font-bold text-lg">Créer un nouveau sujet</h3>
              </div>
              <button 
                onClick={() => { setShowCreate(false); setErrors({}) }} 
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Titre du sujet *</span>
                  <span className="label-text-alt text-base-content/50">{newPost.titre.length}/200</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Comment réussir son examen de maths ?"
                  value={newPost.titre}
                  onChange={e => setNewPost(p => ({ ...p, titre: e.target.value }))}
                  className={`input input-bordered w-full ${errors.titre ? 'input-error' : ''}`}
                  maxLength={200}
                />
                {errors.titre && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.titre}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Niveau concerné</span>
                  <span className="label-text-alt text-base-content/50">Optionnel</span>
                </label>
                <select 
                  value={newPost.niveau} 
                  onChange={e => setNewPost(p => ({ ...p, niveau: e.target.value }))}
                  className="select select-bordered w-full"
                >
                  <option value="">📚 Général (tous niveaux)</option>
                  {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Message *</span>
                  <span className="label-text-alt text-base-content/50">{newPost.contenu.length}/5000</span>
                </label>
                <ScientificEditor
                  value={newPost.contenu}
                  onChange={(val) => setNewPost(p => ({ ...p, contenu: val }))}
                  placeholder="Décrivez votre question ou partagez votre expérience en détail... Utilisez $$formule$$ pour les maths"
                />
                {errors.contenu && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.contenu}</span>
                  </label>
                )}
              </div>

              <div className="alert alert-info text-xs py-2">
                <Sparkles size={12} />
                <span>Conseil : Soyez précis dans votre titre pour attirer plus de réponses.</span>
              </div>

              <div className="modal-action mt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowCreate(false); setErrors({}) }} 
                  className="btn btn-ghost"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending} 
                  className="btn btn-primary gap-2"
                >
                  {createMutation.isPending ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <Send size={15} />
                  )}
                  Publier le sujet
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreate(false)}></div>
        </div>
      )}
    </div>
  )
}