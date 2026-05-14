import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Plus, Search, Heart, Eye,
  Pin, Trash2, X, Send, TrendingUp,
  Sparkles, Filter, ChevronDown, Award, Users,
  Clock, CheckCircle, AlertCircle, ListOrdered
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
  BEPC: 'BEPC', PREMIERE: '1ère', TERMINALE: 'Tle',
  UNIVERSITE: 'Univ.', ENSEIGNANT: 'Ens.', ADMIN: 'Admin',
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'à l\'instant'
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`
  if (s < 604800) return `il y a ${Math.floor(s / 86400)} j`
  return new Date(date).toLocaleDateString('fr-FR')
}

const PostCard = ({ post, onDelete, onLike, isDeleting, currentUser }) => {
  const isPinned = post.pinned
  const isHot = (post._count?.likes || 0) > 10 || (post._count?.replies || 0) > 5
  const isNew = new Date(post.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)

  return (
    <div className={`card bg-base-100 border transition-all duration-200 hover:shadow-md group ${
      isPinned ? 'border-primary/30 bg-gradient-to-r from-primary/[0.04] to-transparent' : 'border-base-200'
    }`}>
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <UserAvatar user={post.user} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {isPinned && <Pin size={11} className="text-primary flex-shrink-0" />}
                {isHot && <TrendingUp size={11} className="text-warning flex-shrink-0" />}
                {isNew && <Sparkles size={11} className="text-success flex-shrink-0" />}
                <Link to={`/forum/${post.id}`} className="font-semibold hover:text-primary transition-colors truncate text-sm">
                  {post.titre}
                </Link>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {(currentUser?.id === post.userId || currentUser?.role === 'ADMIN') && (
                  <button onClick={() => onDelete(post.id)} disabled={isDeleting}
                    className="btn btn-ghost btn-xs text-error/50 hover:text-error p-0.5 min-h-0 h-auto"
                    title="Supprimer"><Trash2 size={12} /></button>
                )}
              </div>
            </div>

            <div className="text-sm text-base-content/60 line-clamp-2 mt-1">
              <ScientificContent content={post.contenu} />
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-base-content/40">
              <span className="font-medium text-base-content/60">{post.user?.prenom}</span>
              {post.user?.profile && (
                <span className="badge badge-ghost badge-xs font-normal">{PROFIL_LABELS[post.user.profile]}</span>
              )}
              {post.niveau && (
                <span className="badge badge-primary/10 text-primary badge-xs font-normal border-0">
                  {NIVEAUX.find(n => n.value === post.niveau)?.label || post.niveau}
                </span>
              )}
              <span className="flex items-center gap-1"><Eye size={10} />{post.views}</span>
            </div>

            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-base-200">
              <button onClick={() => onLike(post.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  post.likedByMe ? 'text-error font-medium' : 'text-base-content/40 hover:text-error'
                }`}>
                <Heart size={11} className={post.likedByMe ? 'fill-error' : ''} />
                {post._count?.likes || 0}
              </button>
              <Link to={`/forum/${post.id}`} className="flex items-center gap-1 text-xs text-base-content/40 hover:text-primary transition-colors">
                <MessageSquare size={11} />
                {post._count?.replies || 0}
              </Link>
              <span className="flex items-center gap-1 text-xs text-base-content/30 ml-auto">
                <Clock size={10} />{timeAgo(post.createdAt)}
              </span>
              <Link to={`/forum/${post.id}`} className="btn btn-ghost btn-xs text-primary font-medium gap-1 p-0 min-h-0 h-auto hover:bg-transparent">
                Lire <ChevronDown size={10} className="rotate-[-90deg]" />
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
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [niveau, setNiveau] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [showCreate, setShowCreate] = useState(false)
  const [newPost, setNewPost] = useState({ titre: '', contenu: '', niveau: '' })
  const [errors, setErrors] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['forumPosts', { page, search, niveau, sortBy }],
    queryFn: () => forumApi.getPosts({ page, limit: 10, search, niveau, sortBy }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: (data) => forumApi.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forumPosts'] })
      setShowCreate(false)
      setNewPost({ titre: '', contenu: '', niveau: '' })
      toast.success('Sujet créé avec succès !')
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forumPosts'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => forumApi.deletePost(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forumPosts'] }); toast.success('Sujet supprimé') },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    const errs = {}
    if (!newPost.titre || newPost.titre.length < 5) errs.titre = 'Titre trop court (min 5 car.)'
    if (!newPost.contenu || newPost.contenu.length < 10) errs.contenu = 'Message trop court (min 10 car.)'
    if (Object.keys(errs).length) { setErrors(errs); return }
    createMutation.mutate(newPost)
  }

  const posts = data?.posts || []
  const pinnedPosts = posts.filter(p => p.pinned)
  const regularPosts = posts.filter(p => !p.pinned)
  const pagination = data?.pagination || {}

  const sortOptions = [
    { value: 'recent', label: 'Récents', icon: <Clock size={12} /> },
    { value: 'popular', label: 'Populaires', icon: <TrendingUp size={12} /> },
    { value: 'trending', label: 'Tendance', icon: <Award size={12} /> },
  ]

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MessageSquare size={28} /> Forum
              </h1>
              <p className="text-white/70 mt-1 text-sm">Échangez, posez vos questions et partagez vos connaissances</p>
            </div>
            {user && (
              <button onClick={() => setShowCreate(true)}
                className="btn bg-white text-primary hover:bg-white/90 border-0 gap-2 shadow-lg">
                <Plus size={16} /> Nouveau sujet
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Filtres */}
        <div className="card bg-base-100 border border-base-200">
          <div className="card-body p-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input type="text" placeholder="Rechercher..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="input input-bordered input-sm w-full pl-9 text-sm" />
              </div>
              <select value={niveau} onChange={e => { setNiveau(e.target.value); setPage(1) }}
                className="select select-bordered select-sm text-sm">
                <option value="">Tous les niveaux</option>
                {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
              <div className="dropdown dropdown-end">
                <button tabIndex={0} className="btn btn-sm btn-ghost gap-1 text-sm">
                  <Filter size={12} />{sortOptions.find(s => s.value === sortBy)?.label}
                  <ChevronDown size={10} />
                </button>
                <ul tabIndex={0} className="dropdown-content z-10 menu menu-sm p-1 shadow-lg bg-base-100 rounded-box border border-base-200 w-36">
                  {sortOptions.map(opt => (
                    <li key={opt.value}><button onClick={() => { setSortBy(opt.value); setPage(1) }} className="gap-2">{opt.icon}{opt.label}</button></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des sujets */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card bg-base-100 border border-base-200 animate-pulse">
                <div className="card-body p-4"><div className="flex gap-3">
                  <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /><div className="skeleton h-3 w-1/3" /></div>
                </div></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-base-100 rounded-xl border border-base-200">
            <MessageSquare size={40} className="mx-auto mb-3 text-base-content/20" />
            <h3 className="font-semibold text-base-content/60">Aucun sujet trouvé</h3>
            <p className="text-sm text-base-content/40 mt-1">Soyez le premier à lancer une discussion !</p>
            {user && (
              <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm mt-4 gap-2">
                <Plus size={15} /> Créer un sujet
              </button>
            )}
          </div>
        ) : (
          <>
            {pinnedPosts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-base-content/50 uppercase tracking-wide">
                  <Pin size={12} /> Épinglés
                  <div className="flex-1 h-px bg-base-300" />
                </div>
                {pinnedPosts.map(post => (
                  <PostCard key={post.id} post={post} onDelete={deleteMutation.mutate}
                    onLike={likeMutation.mutate} isDeleting={deleteMutation.isPending} currentUser={user} />
                ))}
              </div>
            )}
            <div className="space-y-2">
              {pinnedPosts.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold text-base-content/50 uppercase tracking-wide">
                  <MessageSquare size={12} /> Tous les sujets
                  <div className="flex-1 h-px bg-base-300" />
                </div>
              )}
              {regularPosts.map(post => (
                <PostCard key={post.id} post={post} onDelete={deleteMutation.mutate}
                  onLike={likeMutation.mutate} isDeleting={deleteMutation.isPending} currentUser={user} />
              ))}
            </div>
          </>
        )}

        {pagination.totalPages > 1 && (
          <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
        )}
      </div>

      {/* Modal création */}
      {showCreate && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-xl p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Nouveau sujet</h3>
                <button onClick={() => { setShowCreate(false); setErrors({}) }} className="btn btn-ghost btn-sm btn-circle text-white/70 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <input type="text" placeholder="Titre du sujet"
                value={newPost.titre} onChange={e => setNewPost(p => ({ ...p, titre: e.target.value }))}
                className={`input input-bordered w-full text-sm ${errors.titre ? 'input-error' : ''}`} maxLength={200} />
              {errors.titre && <p className="text-xs text-error">{errors.titre}</p>}

              <select value={newPost.niveau} onChange={e => setNewPost(p => ({ ...p, niveau: e.target.value }))}
                className="select select-bordered w-full text-sm">
                <option value="">Niveau concerné (optionnel)</option>
                {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>

              <div>
                <div className="flex justify-between text-xs text-base-content/40 mb-1">
                  <span>Message</span>
                  <span>{newPost.contenu.length}/5000</span>
                </div>
                <ScientificEditor value={newPost.contenu}
                  onChange={(val) => setNewPost(p => ({ ...p, contenu: val }))}
                  placeholder="Décrivez votre question en détail..." minHeight="200px" />
              </div>
              {errors.contenu && <p className="text-xs text-error">{errors.contenu}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setErrors({}) }} className="btn btn-ghost btn-sm">Annuler</button>
                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary btn-sm gap-2">
                  {createMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <Send size={14} />}
                  Publier
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreate(false)} />
        </div>
      )}
    </div>
  )
}
