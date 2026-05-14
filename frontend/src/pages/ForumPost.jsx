// src/pages/ForumPostPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Eye,
  Send,
  Trash2,
  CornerDownRight,
  Pin,
  X,
  CheckCircle,
  Award,
  Flag,
  Share2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
} from "lucide-react";
import { forumApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "../components/UserAvatar";
import toast from "react-hot-toast";
import ScientificContent from "../components/ScientificContent";
// import ScientificContent from '../components/ScientificContent'
// import ScientificContent from '../components/ScientificContent'
import ScientificEditor from "../components/ScientificEditor";
const PROFIL_LABELS = {
  BEPC: "📚 BEPC",
  PREMIERE: "📖 Première",
  TERMINALE: "🎓 Terminale",
  UNIVERSITE: "🏫 Université",
  ENSEIGNANT: "👨‍🏫 Enseignant",
  ADMIN: "⚡ Admin",
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`;
  if (s < 604800) return `il y a ${Math.floor(s / 86400)} j`;
  return new Date(date).toLocaleDateString("fr-FR");
}

// Composant de réponse avec meilleure hiérarchie
function ReplyCard({
  reply,
  postId,
  user,
  onDelete,
  onAccept,
  depth = 0,
  isAcceptedAnswer = false,
}) {
  const qc = useQueryClient();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = reply.children && reply.children.length > 0;

  const replyMutation = useMutation({
    mutationFn: (data) => forumApi.createReply(postId, data),
    onSuccess: () => {
      qc.invalidateQueries(["forumPost", postId]);
      setShowReply(false);
      setReplyText("");
      toast.success("Réponse ajoutée !");
    },
    onError: () => toast.error("Erreur lors de la réponse"),
  });

  const handleReply = () => {
    if (!replyText.trim()) return toast.error("Réponse vide");
    if (replyText.length < 2) return toast.error("Réponse trop courte");
    replyMutation.mutate({ contenu: replyText, parentId: reply.id });
  };

  return (
    <div
      className={`${depth > 0 ? "ml-6 mt-3 pl-3 border-l-2 border-base-300" : ""}`}
    >
      <div
        className={`flex gap-3 ${isAcceptedAnswer ? "bg-success/5 rounded-xl p-3" : ""}`}
      >
        <UserAvatar user={reply.user} size="xs" />
        <div className="flex-1 min-w-0">
          <div
            className={`rounded-2xl rounded-tl-none px-4 py-3 ${isAcceptedAnswer ? "bg-success/10" : "bg-base-200"}`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  {reply.user?.prenom} {reply.user?.nom}
                </span>
                {reply.user?.profile && (
                  <span className="badge badge-ghost badge-xs">
                    {PROFIL_LABELS[reply.user.profile]}
                  </span>
                )}
                {reply.user?.role === "ADMIN" && (
                  <span className="badge badge-primary badge-xs">Admin</span>
                )}
                {reply.user?.role === "TEACHER" && (
                  <span className="badge badge-secondary badge-xs">
                    Enseignant
                  </span>
                )}

                {isAcceptedAnswer && (
                  <span className="badge badge-success gap-1">
                    <CheckCircle size={10} /> Réponse acceptée
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {(user?.id === reply.userId || user?.role === "ADMIN") && (
                  <button
                    onClick={() => onDelete(reply.id)}
                    className="btn btn-ghost btn-xs text-error opacity-60 hover:opacity-100"
                    title="Supprimer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <button
                  onClick={() => onAccept(reply.id)}
                  className={`btn btn-ghost btn-xs transition-colors ${isAcceptedAnswer ? "text-success" : "text-base-content/40 hover:text-success"}`}
                  title={
                    isAcceptedAnswer
                      ? "Réponse acceptée"
                      : "Accepter comme solution"
                  }
                >
                  <Award size={12} />
                </button>
              </div>
            </div>
            {/* <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.contenu}</p> */}
            {/* <ScientificContent content={reply.contenu} /> */}
            <ScientificEditor
              value={replyText}
              onChange={setReplyText}
              placeholder="Écrivez votre réponse... Utilisez $$formule$$ pour les maths"
            />
          </div>

          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-xs text-base-content/40">
              {timeAgo(reply.createdAt)}
            </span>
            <span className="text-xs text-base-content/40 flex items-center gap-0.5">
              <ThumbsUp size={10} /> {reply._count?.likes || 0}
            </span>
            {user && depth === 0 && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-xs text-base-content/50 hover:text-primary flex items-center gap-1 transition-colors"
              >
                <CornerDownRight size={12} /> Répondre
              </button>
            )}
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-base-content/50 hover:text-primary flex items-center gap-1 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
                {reply.children.length} réponse
                {reply.children.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* Sous-réponses */}
          {isExpanded && hasChildren && (
            <div className="mt-3">
              {reply.children.map((child) => (
                <ReplyCard
                  key={child.id}
                  reply={child}
                  postId={postId}
                  user={user}
                  onDelete={onDelete}
                  onAccept={onAccept}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}

          {/* Champ sous-réponse */}
          {showReply && (
            <div className="flex gap-2 mt-3 ml-2 animate-fade-in">
              <UserAvatar user={user} size="xs" />
              <div className="flex-1 flex gap-2">
                {/* <textarea
                  placeholder="Votre réponse..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="textarea textarea-bordered textarea-xs flex-1 h-16 resize-none"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }}
                  maxLength={2000}
                  autoFocus
                /> */}
                <ScientificEditor
                  value={replyText}
                  onChange={setReplyText}
                  placeholder="Écrivez votre réponse... Utilisez $$formule$$ pour les maths"
                />
                <button
                  onClick={handleReply}
                  disabled={replyMutation.isPending}
                  className="btn btn-primary btn-sm btn-square"
                  title="Envoyer"
                >
                  {replyMutation.isPending ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Send size={14} />
                  )}
                </button>
                <button
                  onClick={() => setShowReply(false)}
                  className="btn btn-ghost btn-sm btn-square"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForumPostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState("");
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["forumPost", id],
    queryFn: () => forumApi.getPost(id).then((r) => r.data),
  });

  const likeMutation = useMutation({
    mutationFn: () => forumApi.likePost(id),
    onSuccess: () => qc.invalidateQueries(["forumPost", id]),
  });

  const replyMutation = useMutation({
    mutationFn: (data) => forumApi.createReply(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["forumPost", id]);
      setReplyText("");
      toast.success("Réponse publiée !");
    },
    onError: (err) => toast.error(err.response?.data?.error || "Erreur"),
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => forumApi.deleteReply(replyId),
    onSuccess: () => {
      qc.invalidateQueries(["forumPost", id]);
      toast.success("Réponse supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const deletePostMutation = useMutation({
    mutationFn: () => forumApi.deletePost(id),
    onSuccess: () => {
      navigate("/forum");
      toast.success("Sujet supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const pinMutation = useMutation({
    mutationFn: (pinned) => forumApi.pinPost(id, pinned),
    onSuccess: () => qc.invalidateQueries(["forumPost", id]),
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: (replyId) => forumApi.acceptAnswer(id, replyId),
    onSuccess: () => {
      qc.invalidateQueries(["forumPost", id]);
      toast.success("Solution acceptée !");
    },
    onError: () => toast.error("Erreur"),
  });

  const handleReply = () => {
    if (!user) {
      toast.error("Connectez-vous pour répondre");
      navigate("/login", { state: { from: { pathname: `/forum/${id}` } } });
      return;
    }
    if (!replyText.trim()) return toast.error("Réponse vide");
    if (replyText.length < 5)
      return toast.error("Réponse trop courte (min. 5 caractères)");
    replyMutation.mutate({ contenu: replyText });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.titre,
          text: `Découvrez ce sujet sur GestDoc : ${post?.titre}`,
          url: url,
        });
      } catch (err) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Lien copié dans le presse-papier !");
  };

  const acceptedReplyId = post?.replies?.find((r) => r.isAccepted)?.id;

  if (isLoading)
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-2 text-sm text-base-content/50">
            Chargement du sujet...
          </p>
        </div>
      </div>
    );

  if (isError || !post)
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
            <AlertCircle size={48} className="text-error" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Sujet introuvable</h2>
          <p className="text-base-content/60 mb-6">
            Le sujet que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Link to="/forum" className="btn btn-primary gap-2">
            <ArrowLeft size={18} /> Retour au forum
          </Link>
        </div>
      </div>
    );

  const totalReplies =
    post.replies?.reduce((acc, r) => acc + 1 + (r.children?.length || 0), 0) ||
    0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-100 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            to="/forum"
            className="btn btn-ghost btn-sm gap-2 hover:gap-3 transition-all"
          >
            <ArrowLeft size={16} /> Forum
          </Link>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="btn btn-ghost btn-sm gap-1"
              onMouseEnter={() => setShowShareTooltip(true)}
              onMouseLeave={() => setShowShareTooltip(false)}
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button className="btn btn-ghost btn-sm gap-1">
              <Bookmark size={14} />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>
          </div>
        </div>

        {/* Post principal amélioré */}
        <div
          className={`card bg-base-100 shadow-xl overflow-hidden ${post.pinned ? "border-2 border-primary/30" : ""}`}
        >
          {post.pinned && (
            <div className="h-1 bg-gradient-to-r from-primary to-secondary"></div>
          )}

          <div className="card-body p-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <UserAvatar user={post.user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold leading-snug">
                      {post.titre}
                    </h1>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="font-medium text-sm text-base-content/70">
                        {post.user?.prenom} {post.user?.nom}
                      </span>
                      {post.user?.profile && (
                        <span className="badge badge-ghost badge-sm">
                          {PROFIL_LABELS[post.user.profile]}
                        </span>
                      )}
                      {post.user?.role === "ADMIN" && (
                        <span className="badge badge-primary badge-sm">
                          Admin
                        </span>
                      )}
                      {post.niveau && (
                        <span className="badge badge-secondary badge-sm">
                          {post.niveau}
                        </span>
                      )}
                      {post.pinned && (
                        <span className="badge badge-primary badge-sm gap-1">
                          <Pin size={10} /> Épinglé
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions admin/auteur */}
                  <div className="flex gap-1">
                    {user?.role === "ADMIN" && (
                      <button
                        onClick={() => pinMutation.mutate(!post.pinned)}
                        className={`btn btn-xs btn-ghost ${post.pinned ? "text-primary" : "text-base-content/50"}`}
                        title={post.pinned ? "Désépingler" : "Épingler"}
                      >
                        <Pin size={14} />
                      </button>
                    )}
                    {(user?.id === post.userId || user?.role === "ADMIN") && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Supprimer ce sujet ? Action irréversible.",
                            )
                          ) {
                            deletePostMutation.mutate();
                          }
                        }}
                        className="btn btn-xs btn-ghost text-error opacity-60 hover:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu */}
            {/* <div className="mt-4 text-base-content/90 leading-relaxed whitespace-pre-wrap bg-base-200 rounded-2xl p-5">
              {post.contenu}
            </div> */}
            {/* <ScientificContent content={post.contenu} /> */}
            <div className="mt-4 text-base-content/90 leading-relaxed bg-base-200 rounded-2xl p-5">
              <ScientificContent content={post.contenu} />
            </div>
            {/* Footer avec stats améliorées */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-base-200 flex-wrap">
              <button
                onClick={() =>
                  user
                    ? likeMutation.mutate()
                    : toast.error("Connectez-vous pour liker")
                }
                className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 ${
                  post.likedByMe
                    ? "text-error"
                    : "text-base-content/50 hover:text-error"
                }`}
              >
                <ThumbsUp
                  size={15}
                  className={post.likedByMe ? "fill-error" : ""}
                />
                {post._count?.likes || 0} j'aime
              </button>

              <Link
                to="#reponses"
                className="flex items-center gap-1.5 text-sm text-base-content/50 hover:text-primary transition-all"
              >
                <MessageSquare size={15} /> {totalReplies} réponse
                {totalReplies !== 1 ? "s" : ""}
              </Link>

              <span className="flex items-center gap-1.5 text-sm text-base-content/40">
                <Eye size={14} /> {post.views || 0} vue
                {post.views !== 1 ? "s" : ""}
              </span>

              <span className="text-xs text-base-content/40 ml-auto">
                Publié le{" "}
                {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Section des réponses */}
        <div className="card bg-base-100 shadow-md" id="reponses">
          <div className="card-body p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                {totalReplies} Réponse{totalReplies !== 1 ? "s" : ""}
              </h2>
              {totalReplies > 0 && (
                <div className="flex items-center gap-2 text-xs text-base-content/40">
                  <Users size={12} />
                  <span>
                    {post.replies?.length} participant
                    {post.replies?.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {post.replies?.length === 0 ? (
              <div className="text-center py-12 bg-base-200 rounded-xl">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm text-base-content/60">
                  Aucune réponse encore
                </p>
                <p className="text-xs text-base-content/40 mt-1">
                  Soyez le premier à répondre !
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {post.replies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    postId={id}
                    user={user}
                    onDelete={deleteReplyMutation.mutate}
                    onAccept={acceptAnswerMutation.mutate}
                    isAcceptedAnswer={reply.id === acceptedReplyId}
                  />
                ))}
              </div>
            )}

            {/* Formulaire réponse amélioré */}
            <div className="mt-6 pt-4 border-t border-base-200">
              {user ? (
                <div className="flex gap-3">
                  <UserAvatar user={user} size="sm" />
                  <div className="flex-1 space-y-2">
                    <label className="label py-0">
                      <span className="label-text text-xs font-medium">
                        Votre réponse
                      </span>
                      <span className="label-text-alt text-base-content/40">
                        {replyText.length}/2000
                      </span>
                    </label>
                    <ScientificEditor
                      value={replyText}
                      onChange={setReplyText}
                      placeholder="Écrivez votre réponse... Utilisez $$formule$$ pour les maths"
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-base-content/40 flex items-center gap-2">
                        <span>💡 Conseil : Soyez précis et courtois</span>
                      </div>
                      <button
                        onClick={handleReply}
                        disabled={replyMutation.isPending || !replyText.trim()}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        {replyMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <Send size={14} />
                        )}
                        Publier la réponse
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-base-200 rounded-xl">
                  <p className="text-sm text-base-content/70 mb-3">
                    Connectez-vous pour participer à la discussion
                  </p>
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/forum/${id}` } }}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <MessageSquare size={14} /> Se connecter
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
