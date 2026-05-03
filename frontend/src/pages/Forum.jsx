import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Plus, Search, Heart, Eye,
  Pin, Trash2, X, Send, ThumbsUp
} from 'lucide-react'
import { forumApi } from '../services/api'
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

export default function Forum() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [niveau, setNiveau]       = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newPost, setNewPost]     = useState({ titre: '', contenu: '', niveau: '' })
  const [errors, setErrors]       = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['forumPosts', { page, search, niveau }],
    queryFn: () => forumApi.getPosts({ page, limit: 10, search, niveau }).then(r => r.data),
    keepPreviousData: true,
  })

  const createMutation = useMutation({
    mutationFn: (data) => forumApi.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries(['forumPosts'])
      setShowCreate(false)
      setNewPost({ titre: '', contenu: '', niveau: '' })
      toast.success('Sujet créé !')
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
    onSuccess: () => { qc.invalidateQueries(['forumPosts']); toast.success('Sujet supprimé') },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    const errs = {}
    if (!newPost.titre || newPost.titre.length < 5) errs.titre = 'Titre trop court (min 5 caractères)'
    if (!newPost.contenu || newPost.contenu.length < 10) errs.contenu = 'Message trop court (min 10 caractères)'
    if (Object.keys(errs).length) { setErrors(errs); return }
    createMutation.mutate(newPost)
  }

  const posts      = data?.posts || []
  const pagination = data?.pagination || {}

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-secondary text-white py-10 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare size={32} /> Forum
            </h1>
            <p className="text-white/80 mt-1">Posez vos questions, partagez vos idées</p>
          </div>
          {user && (
            <button onClick={() => setShowCreate(true)} className="btn btn-white gap-2">
              <Plus size={18} /> Nouveau sujet
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Filtres */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input type="text" placeholder="Rechercher un sujet..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="input input-bordered input-sm w-full pl-9" />
              </div>
              <select value={niveau} onChange={e => { setNiveau(e.target.value); setPage(1) }}
                className="select select-bordered select-sm">
                <option value="">Tous les niveaux</option>
                {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        {pagination.total > 0 && (
          <p className="text-sm text-base-content/60 px-1">
            <strong className="text-base-content">{pagination.total}</strong> sujet{pagination.total > 1 ? 's' : ''}
          </p>
        )}

        {/* Liste posts */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 space-y-2">
                  <div className="skeleton h-5 w-3/4"></div>
                  <div className="skeleton h-4 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={48} className="mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold text-base-content/60">Aucun sujet trouvé</h3>
            {user && <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm mt-4 gap-2"><Plus size={15} /> Créer le premier sujet</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className={`card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-200 ${post.pinned ? 'border-primary/30 bg-primary/5' : ''}`}>
                <div className="card-body p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={post.user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.pinned && <Pin size={13} className="text-primary flex-shrink-0" />}
                          <Link to={`/forum/${post.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">
                            {post.titre}
                          </Link>
                        </div>
                        {(user?.id === post.userId || user?.role === 'ADMIN') && (
                          <button onClick={() => deleteMutation.mutate(post.id)}
                            className="btn btn-ghost btn-xs text-error opacity-60 hover:opacity-100 flex-shrink-0">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-base-content/60 line-clamp-2 mt-1">{post.contenu}</p>

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-base-content/50 font-medium">
                          {post.user?.prenom} {post.user?.nom}
                        </span>
                        {post.user?.profile && (
                          <span className="badge badge-ghost badge-xs">
                            {PROFIL_LABELS[post.user.profile] || post.user.profile}
                          </span>
                        )}
                        {post.niveau && (
                          <span className="badge badge-primary badge-xs">{post.niveau}</span>
                        )}
                        <span className="text-xs text-base-content/40 ml-auto">{timeAgo(post.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-base-200">
                        <button
                          onClick={() => user ? likeMutation.mutate(post.id) : toast.error('Connectez-vous pour liker')}
                          className={`flex items-center gap-1 text-xs transition-colors ${post.likedByMe ? 'text-error font-medium' : 'text-base-content/50 hover:text-error'}`}
                        >
                          <ThumbsUp size={13} className={post.likedByMe ? 'fill-error' : ''} />
                          {post._count?.likes || 0}
                        </button>
                        <Link to={`/forum/${post.id}`} className="flex items-center gap-1 text-xs text-base-content/50 hover:text-primary transition-colors">
                          <MessageSquare size={13} /> {post._count?.replies || 0} réponse{post._count?.replies !== 1 ? 's' : ''}
                        </Link>
                        <span className="flex items-center gap-1 text-xs text-base-content/40">
                          <Eye size={12} /> {post.views}
                        </span>
                        <Link to={`/forum/${post.id}`} className="btn btn-xs btn-ghost ml-auto">
                          Voir →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
      </div>

      {/* Modal création post */}
      {showCreate && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Nouveau sujet</h3>
              <button onClick={() => { setShowCreate(false); setErrors({}) }} className="btn btn-ghost btn-sm btn-square">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Titre *</span></label>
                <input type="text" placeholder="Ex: Comment résoudre les équations du second degré ?"
                  value={newPost.titre}
                  onChange={e => setNewPost(p => ({ ...p, titre: e.target.value }))}
                  className={`input input-bordered w-full ${errors.titre ? 'input-error' : ''}`}
                  maxLength={200} />
                {errors.titre && <label className="label"><span className="label-text-alt text-error">{errors.titre}</span></label>}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Niveau <span className="text-base-content/50">(optionnel)</span></span></label>
                <select value={newPost.niveau} onChange={e => setNewPost(p => ({ ...p, niveau: e.target.value }))}
                  className="select select-bordered w-full">
                  <option value="">Général (tous niveaux)</option>
                  {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Message *</span>
                  <span className="label-text-alt text-base-content/50">{newPost.contenu.length}/5000</span>
                </label>
                <textarea placeholder="Décrivez votre question ou sujet en détail..."
                  value={newPost.contenu}
                  onChange={e => setNewPost(p => ({ ...p, contenu: e.target.value }))}
                  className={`textarea textarea-bordered w-full h-32 resize-none ${errors.contenu ? 'textarea-error' : ''}`}
                  maxLength={5000} />
                {errors.contenu && <label className="label"><span className="label-text-alt text-error">{errors.contenu}</span></label>}
              </div>

              <div className="modal-action mt-2">
                <button type="button" onClick={() => { setShowCreate(false); setErrors({}) }} className="btn btn-ghost">Annuler</button>
                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary gap-2">
                  {createMutation.isPending ? <span className="loading loading-spinner loading-sm"></span> : <Send size={15} />}
                  Publier
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