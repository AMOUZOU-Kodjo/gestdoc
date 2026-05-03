import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, MessageSquare, ThumbsUp, Eye,
  Send, Trash2, CornerDownRight, Pin, X
} from 'lucide-react'
import { forumApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import UserAvatar from '../components/UserAvatar'
import toast from 'react-hot-toast'

const PROFIL_LABELS = {
  BEPC: '📚 BEPC', PREMIERE: '📖 Première', TERMINALE: '🎓 Terminale',
  UNIVERSITE: '🏫 Université', ENSEIGNANT: '👨‍🏫 Enseignant', ADMIN: '⚡ Admin',
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'à l\'instant'
  if (s < 3600) return `il y a ${Math.floor(s/60)} min`
  if (s < 86400) return `il y a ${Math.floor(s/3600)}h`
  if (s < 604800) return `il y a ${Math.floor(s/86400)} j`
  return new Date(date).toLocaleDateString('fr-FR')
}

function ReplyCard({ reply, postId, user, onDelete, depth = 0 }) {
  const qc = useQueryClient()
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')

  const replyMutation = useMutation({
    mutationFn: (data) => forumApi.createReply(postId, data),
    onSuccess: () => {
      qc.invalidateQueries(['forumPost', postId])
      setShowReply(false)
      setReplyText('')
      toast.success('Réponse ajoutée !')
    },
    onError: () => toast.error('Erreur lors de la réponse'),
  })

  const handleReply = () => {
    if (!replyText.trim()) return toast.error('Réponse vide')
    replyMutation.mutate({ contenu: replyText, parentId: reply.id })
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3 pl-3 border-l-2 border-base-300' : ''}`}>
      <div className="flex gap-3">
        <UserAvatar user={reply.user} size="xs" />
        <div className="flex-1 min-w-0">
          <div className="bg-base-200 rounded-2xl rounded-tl-none px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{reply.user?.prenom} {reply.user?.nom}</span>
                {reply.user?.profile && (
                  <span className="badge badge-ghost badge-xs">{PROFIL_LABELS[reply.user.profile]}</span>
                )}
                {reply.user?.role === 'ADMIN' && <span className="badge badge-primary badge-xs">Admin</span>}
              </div>
              {(user?.id === reply.userId || user?.role === 'ADMIN') && (
                <button onClick={() => onDelete(reply.id)} className="btn btn-ghost btn-xs text-error opacity-60 hover:opacity-100">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.contenu}</p>
          </div>

          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-xs text-base-content/40">{timeAgo(reply.createdAt)}</span>
            {user && depth === 0 && (
              <button onClick={() => setShowReply(!showReply)}
                className="text-xs text-base-content/50 hover:text-primary flex items-center gap-1 transition-colors">
                <CornerDownRight size={12} /> Répondre
              </button>
            )}
          </div>

          {/* Sous-réponses */}
          {reply.children?.map(child => (
            <ReplyCard key={child.id} reply={child} postId={postId} user={user} onDelete={onDelete} depth={1} />
          ))}

          {/* Champ sous-réponse */}
          {showReply && (
            <div className="flex gap-2 mt-3 ml-2">
              <UserAvatar user={user} size="xs" />
              <div className="flex-1 flex gap-2">
                <input type="text" placeholder="Votre réponse..."
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  className="input input-bordered input-sm flex-1"
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                  maxLength={2000} autoFocus />
                <button onClick={handleReply} disabled={replyMutation.isPending} className="btn btn-primary btn-sm btn-square">
                  {replyMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Send size={14} />}
                </button>
                <button onClick={() => setShowReply(false)} className="btn btn-ghost btn-sm btn-square">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ForumPostPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [replyText, setReplyText] = useState('')

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['forumPost', id],
    queryFn: () => forumApi.getPost(id).then(r => r.data),
  })

  const likeMutation = useMutation({
    mutationFn: () => forumApi.likePost(id),
    onSuccess: () => qc.invalidateQueries(['forumPost', id]),
  })

  const replyMutation = useMutation({
    mutationFn: (data) => forumApi.createReply(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['forumPost', id])
      setReplyText('')
      toast.success('Réponse publiée !')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (replyId) => forumApi.deleteReply(replyId),
    onSuccess: () => { qc.invalidateQueries(['forumPost', id]); toast.success('Réponse supprimée') },
  })

  const deletePostMutation = useMutation({
    mutationFn: () => forumApi.deletePost(id),
    onSuccess: () => { navigate('/forum'); toast.success('Sujet supprimé') },
  })

  const pinMutation = useMutation({
    mutationFn: (pinned) => forumApi.pinPost(id, pinned),
    onSuccess: () => qc.invalidateQueries(['forumPost', id]),
  })

  const handleReply = () => {
    if (!replyText.trim()) return toast.error('Réponse vide')
    if (replyText.length < 2) return toast.error('Réponse trop courte')
    replyMutation.mutate({ contenu: replyText })
  }

  if (isLoading) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  )

  if (isError || !post) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Sujet introuvable</h2>
        <Link to="/forum" className="btn btn-primary btn-sm">Retour au forum</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-base-200 py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Back */}
        <Link to="/forum" className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft size={16} /> Forum
        </Link>

        {/* Post principal */}
        <div className={`card bg-base-100 shadow-md ${post.pinned ? 'border-2 border-primary/30' : ''}`}>
          <div className="card-body p-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <UserAvatar user={post.user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h1 className="text-xl font-bold leading-snug">{post.titre}</h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-medium text-sm">{post.user?.prenom} {post.user?.nom}</span>
                      {post.user?.profile && <span className="badge badge-ghost badge-xs">{PROFIL_LABELS[post.user.profile]}</span>}
                      {post.user?.role === 'ADMIN' && <span className="badge badge-primary badge-xs">Admin</span>}
                      {post.niveau && <span className="badge badge-secondary badge-xs">{post.niveau}</span>}
                      {post.pinned && <span className="badge badge-primary badge-xs gap-1"><Pin size={10} /> Épinglé</span>}
                    </div>
                  </div>
                  {/* Actions admin/auteur */}
                  <div className="flex gap-1">
                    {user?.role === 'ADMIN' && (
                      <button onClick={() => pinMutation.mutate(!post.pinned)}
                        className={`btn btn-xs btn-ghost ${post.pinned ? 'text-primary' : 'text-base-content/50'}`}
                        title={post.pinned ? 'Désépingler' : 'Épingler'}>
                        <Pin size={14} />
                      </button>
                    )}
                    {(user?.id === post.userId || user?.role === 'ADMIN') && (
                      <button onClick={() => deletePostMutation.mutate()}
                        className="btn btn-xs btn-ghost text-error opacity-60 hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="mt-4 text-base-content/90 leading-relaxed whitespace-pre-wrap text-sm bg-base-200 rounded-2xl p-4">
              {post.contenu}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-base-200">
              <button
                onClick={() => user ? likeMutation.mutate() : toast.error('Connectez-vous pour liker')}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.likedByMe ? 'text-error' : 'text-base-content/50 hover:text-error'}`}
              >
                <ThumbsUp size={15} className={post.likedByMe ? 'fill-error' : ''} />
                {post._count?.likes || 0} j'aime
              </button>
              <span className="flex items-center gap-1.5 text-sm text-base-content/50">
                <MessageSquare size={15} /> {post._count?.replies || 0} réponse{post._count?.replies !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-base-content/40">
                <Eye size={14} /> {post.views} vue{post.views !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-base-content/40 ml-auto">
                {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Réponses */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <h2 className="font-bold text-lg mb-4">
              {post.replies?.length || 0} Réponse{post.replies?.length !== 1 ? 's' : ''}
            </h2>

            {post.replies?.length === 0 ? (
              <div className="text-center py-8 text-base-content/50">
                <MessageSquare size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune réponse encore. Soyez le premier !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {post.replies.map(reply => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    postId={id}
                    user={user}
                    onDelete={deleteMutation.mutate}
                  />
                ))}
              </div>
            )}

            {/* Formulaire réponse */}
            <div className="mt-6 pt-4 border-t border-base-200">
              {user ? (
                <div className="flex gap-3">
                  <UserAvatar user={user} size="sm" />
                  <div className="flex-1 space-y-2">
                    <textarea
                      placeholder="Écrivez votre réponse... (Entrée pour envoyer)"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }}
                      className="textarea textarea-bordered w-full h-24 resize-none text-sm"
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-base-content/40">{replyText.length}/2000 · Entrée pour envoyer</span>
                      <button onClick={handleReply} disabled={replyMutation.isPending || !replyText.trim()}
                        className="btn btn-primary btn-sm gap-2">
                        {replyMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Send size={14} />}
                        Répondre
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-base-200 rounded-2xl">
                  <p className="text-sm text-base-content/70 mb-3">Connectez-vous pour répondre</p>
                  <Link to="/login" className="btn btn-primary btn-sm">Se connecter</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}