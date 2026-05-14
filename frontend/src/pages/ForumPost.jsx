import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft, MessageSquare, ThumbsUp, Eye, Send, Trash2,
  CornerDownRight, Pin, X, CheckCircle, Award, Share2, ChevronDown,
  ChevronUp, AlertCircle, Users, Clock
} from "lucide-react"
import { forumApi } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import UserAvatar from "../components/UserAvatar"
import toast from "react-hot-toast"
import ScientificContent from "../components/ScientificContent"
import ScientificEditor from "../components/ScientificEditor"

const PROFIL_LABELS = {
  BEPC: "BEPC", PREMIERE: "1ère", TERMINALE: "Tle",
  UNIVERSITE: "Univ.", ENSEIGNANT: "Ens.", ADMIN: "Admin",
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`
  if (s < 604800) return `il y a ${Math.floor(s / 86400)} j`
  return new Date(date).toLocaleDateString("fr-FR")
}

function ReplyCard({ reply, postId, user, onDelete, onAccept, depth = 0, isAcceptedAnswer = false }) {
  const qc = useQueryClient()
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = reply.children && reply.children.length > 0

  const replyMutation = useMutation({
    mutationFn: (data) => forumApi.createReply(postId, data),
    onSuccess: () => {
      qc.invalidateQueries(["forumPost", postId])
      setShowReply(false)
      setReplyText("")
      toast.success("Réponse ajoutée !")
    },
    onError: () => toast.error("Erreur lors de la réponse"),
  })

  const handleReply = () => {
    if (!replyText.trim()) return toast.error("Réponse vide")
    if (replyText.length < 2) return toast.error("Réponse trop courte")
    replyMutation.mutate({ contenu: replyText, parentId: reply.id })
  }

  return (
    <div className={depth > 0 ? "ml-5 pl-4 border-l-2 border-base-200" : ""}>
      <div className={`flex gap-2.5 ${isAcceptedAnswer ? "bg-success/[0.04] rounded-xl p-3 -mx-3" : ""}`}>
        <UserAvatar user={reply.user} size="xs" />
        <div className="flex-1 min-w-0">
          {/* Header de la réponse */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs">{reply.user?.prenom} {reply.user?.nom}</span>
              {reply.user?.profile && <span className="badge badge-ghost badge-xs font-normal">{PROFIL_LABELS[reply.user.profile]}</span>}
              {reply.user?.role === "ADMIN" && <span className="badge badge-primary badge-xs font-normal">Admin</span>}
              {reply.user?.role === "TEACHER" && <span className="badge badge-secondary badge-xs font-normal">Ens.</span>}
              {isAcceptedAnswer && (
                <span className="badge badge-success badge-xs gap-0.5 font-normal"><CheckCircle size={9} /> Solution</span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {(user?.id === reply.userId || user?.role === "ADMIN") && (
                <button onClick={() => onDelete(reply.id)}
                  className="btn btn-ghost btn-xs text-error/40 hover:text-error p-0.5 min-h-0 h-auto" title="Supprimer">
                  <Trash2 size={10} />
                </button>
              )}
              {user?.role === "ADMIN" && (
                <button onClick={() => onAccept(reply.id)}
                  className={`btn btn-ghost btn-xs p-0.5 min-h-0 h-auto ${isAcceptedAnswer ? "text-success" : "text-base-content/30 hover:text-success"}`}
                  title={isAcceptedAnswer ? "Réponse acceptée" : "Accepter comme solution"}>
                  <Award size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Contenu de la réponse */}
          <div className="text-sm leading-relaxed text-base-content/85 bg-base-200/50 rounded-xl px-3.5 py-2.5 mt-1">
            <ScientificContent content={reply.contenu} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[11px] text-base-content/30">{timeAgo(reply.createdAt)}</span>
            {user && depth === 0 && (
              <button onClick={() => setShowReply(!showReply)}
                className="text-[11px] text-base-content/40 hover:text-primary flex items-center gap-0.5 transition-colors">
                <CornerDownRight size={10} /> Répondre
              </button>
            )}
            {hasChildren && (
              <button onClick={() => setIsExpanded(!isExpanded)}
                className="text-[11px] text-base-content/40 hover:text-primary flex items-center gap-0.5 transition-colors">
                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {reply.children.length} réponse{reply.children.length > 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* Sous-réponses */}
          {isExpanded && hasChildren && (
            <div className="mt-2 space-y-2">
              {reply.children.map((child) => (
                <ReplyCard key={child.id} reply={child} postId={postId} user={user}
                  onDelete={onDelete} onAccept={onAccept} depth={depth + 1} />
              ))}
            </div>
          )}

          {/* Formulaire sous-réponse */}
          {showReply && (
            <div className="flex gap-2 mt-3">
              <UserAvatar user={user} size="xs" />
              <div className="flex-1 space-y-1.5">
                <ScientificEditor value={replyText} onChange={setReplyText}
                  placeholder="Votre réponse..." minHeight="80px" />
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => setShowReply(false)} className="btn btn-ghost btn-xs">Annuler</button>
                  <button onClick={handleReply} disabled={replyMutation.isPending}
                    className="btn btn-primary btn-xs gap-1">
                    {replyMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <Send size={11} />}
                    Répondre
                  </button>
                </div>
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
  const [replyText, setReplyText] = useState("")

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["forumPost", id],
    queryFn: () => forumApi.getPost(id).then((r) => r.data),
  })

  const likeMutation = useMutation({
    mutationFn: () => forumApi.likePost(id),
    onSuccess: () => qc.invalidateQueries(["forumPost", id]),
  })

  const replyMutation = useMutation({
    mutationFn: (data) => forumApi.createReply(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["forumPost", id])
      setReplyText("")
      toast.success("Réponse publiée !")
    },
    onError: (err) => toast.error(err.response?.data?.error || "Erreur"),
  })

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => forumApi.deleteReply(replyId),
    onSuccess: () => { qc.invalidateQueries(["forumPost", id]); toast.success("Réponse supprimée") },
    onError: () => toast.error("Erreur"),
  })

  const deletePostMutation = useMutation({
    mutationFn: () => forumApi.deletePost(id),
    onSuccess: () => { navigate("/forum"); toast.success("Sujet supprimé") },
    onError: () => toast.error("Erreur"),
  })

  const pinMutation = useMutation({
    mutationFn: (pinned) => forumApi.pinPost(id, pinned),
    onSuccess: () => qc.invalidateQueries(["forumPost", id]),
  })

  const acceptAnswerMutation = useMutation({
    mutationFn: (replyId) => forumApi.acceptAnswer(id, replyId),
    onSuccess: () => { qc.invalidateQueries(["forumPost", id]); toast.success("Solution acceptée !") },
    onError: () => toast.error("Erreur"),
  })

  const handleReply = () => {
    if (!user) { toast.error("Connectez-vous pour répondre"); return }
    if (!replyText.trim()) return toast.error("Réponse vide")
    if (replyText.length < 5) return toast.error("Réponse trop courte (min. 5 car.)")
    replyMutation.mutate({ contenu: replyText })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Lien copié !")
  }

  const acceptedReplyId = post?.replies?.find((r) => r.isAccepted)?.id

  if (isLoading) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center"><span className="loading loading-spinner loading-lg text-primary" /><p className="mt-2 text-sm text-base-content/50">Chargement...</p></div>
    </div>
  )

  if (isError || !post) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertCircle size={40} className="mx-auto mb-3 text-error/50" />
        <h2 className="text-xl font-bold mb-1">Sujet introuvable</h2>
        <p className="text-sm text-base-content/60 mb-4">Ce sujet n'existe pas ou a été supprimé.</p>
        <Link to="/forum" className="btn btn-primary btn-sm gap-2"><ArrowLeft size={15} /> Retour</Link>
      </div>
    </div>
  )

  const totalReplies = post.replies?.reduce((acc, r) => acc + 1 + (r.children?.length || 0), 0) || 0

  return (
    <div className="min-h-screen bg-base-200 py-5 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link to="/forum" className="btn btn-ghost btn-sm gap-1.5 text-sm"><ArrowLeft size={15} /> Forum</Link>
          <div className="flex gap-1">
            <button onClick={handleShare} className="btn btn-ghost btn-sm btn-square" title="Partager"><Share2 size={14} /></button>
            {user?.role === "ADMIN" && (
              <button onClick={() => pinMutation.mutate(!post.pinned)}
                className={`btn btn-ghost btn-sm btn-square ${post.pinned ? "text-primary" : "text-base-content/40"}`}
                title={post.pinned ? "Désépingler" : "Épingler"}><Pin size={14} /></button>
            )}
            {(user?.id === post.userId || user?.role === "ADMIN") && (
              <button onClick={() => { if (window.confirm("Supprimer ce sujet ?")) deletePostMutation.mutate() }}
                className="btn btn-ghost btn-sm btn-square text-error/40 hover:text-error" title="Supprimer"><Trash2 size={14} /></button>
            )}
          </div>
        </div>

        {/* Post principal */}
        <div className={`card bg-base-100 border ${post.pinned ? "border-primary/30" : "border-base-200"}`}>
          {post.pinned && <div className="h-0.5 bg-gradient-to-r from-primary to-primary/50" />}
          <div className="card-body p-5">
            <div className="flex items-start gap-3">
              <UserAvatar user={post.user} size="sm" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold">{post.titre}</h1>
                <div className="flex items-center gap-2 mt-1 text-xs text-base-content/50 flex-wrap">
                  <span className="font-medium text-base-content/70">{post.user?.prenom} {post.user?.nom}</span>
                  {post.user?.profile && <span className="badge badge-ghost badge-xs font-normal">{PROFIL_LABELS[post.user.profile]}</span>}
                  {post.user?.role === "ADMIN" && <span className="badge badge-primary badge-xs font-normal">Admin</span>}
                  {post.niveau && <span className="badge badge-primary/10 text-primary badge-xs font-normal border-0">{post.niveau}</span>}
                  {post.pinned && <span className="badge badge-primary/10 text-primary badge-xs font-normal border-0 gap-0.5"><Pin size={9} /> Épinglé</span>}
                </div>
              </div>
            </div>

            <div className="mt-4 bg-base-100 rounded-xl border border-base-200 p-4 text-sm leading-relaxed">
              <ScientificContent content={post.contenu} />
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-base-200 text-sm">
              <button onClick={() => user ? likeMutation.mutate() : toast.error("Connectez-vous")}
                className={`flex items-center gap-1.5 transition-colors ${
                  post.likedByMe ? "text-error font-medium" : "text-base-content/40 hover:text-error"
                }`}>
                <ThumbsUp size={14} className={post.likedByMe ? "fill-error" : ""} />
                {post._count?.likes || 0}
              </button>
              <span className="flex items-center gap-1.5 text-base-content/40">
                <MessageSquare size={14} /> {totalReplies}
              </span>
              <span className="flex items-center gap-1.5 text-base-content/30">
                <Eye size={14} /> {post.views || 0}
              </span>
              <span className="text-xs text-base-content/30 ml-auto">
                <Clock size={11} className="inline mr-1" />
                {new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Section réponses */}
        <div className="card bg-base-100 border border-base-200" id="reponses">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-1.5 text-sm">
                <MessageSquare size={16} className="text-primary" />
                {totalReplies} Réponse{totalReplies !== 1 ? "s" : ""}
              </h2>
              {totalReplies > 0 && (
                <span className="text-xs text-base-content/40 flex items-center gap-1">
                  <Users size={12} /> {post.replies?.length} participant{post.replies?.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {post.replies?.length === 0 ? (
              <div className="text-center py-10 bg-base-200 rounded-xl">
                <MessageSquare size={36} className="mx-auto mb-2 text-base-content/20" />
                <p className="text-sm text-base-content/50">Aucune réponse encore</p>
                <p className="text-xs text-base-content/40 mt-0.5">Soyez le premier à répondre !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {post.replies.map((reply) => (
                  <ReplyCard key={reply.id} reply={reply} postId={id} user={user}
                    onDelete={deleteReplyMutation.mutate} onAccept={acceptAnswerMutation.mutate}
                    isAcceptedAnswer={reply.id === acceptedReplyId} />
                ))}
              </div>
            )}

            {/* Formulaire réponse */}
            <div className="mt-5 pt-4 border-t border-base-200">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-base-content/60">
                    <UserAvatar user={user} size="xs" />
                    Votre réponse
                  </div>
                  <ScientificEditor value={replyText} onChange={setReplyText}
                    placeholder="Écrivez votre réponse..." minHeight="120px" />
                  <div className="flex justify-end">
                    <button onClick={handleReply} disabled={replyMutation.isPending || !replyText.trim()}
                      className="btn btn-primary btn-sm gap-2">
                      {replyMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <Send size={14} />}
                      Publier
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-base-200 rounded-xl">
                  <p className="text-sm text-base-content/60 mb-2">Connectez-vous pour participer</p>
                  <Link to={`/login?redirect=/forum/${id}`} className="btn btn-primary btn-sm gap-2">
                    <MessageSquare size={14} /> Se connecter
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
