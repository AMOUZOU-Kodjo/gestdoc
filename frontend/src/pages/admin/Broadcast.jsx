// src/pages/admin/AdminBroadcast.jsx
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { 
  Mail, Send, Users, CheckCircle, AlertCircle, Clock, Calendar,
  FileText, Sparkles, Copy, Eye, Zap, BarChart3, TrendingUp,
  AlertTriangle, MessageSquare, UserCheck, Target, Timer
} from 'lucide-react'
import { adminApi } from '../../services/api'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const CIBLES = [
  { value: 'tous',        label: 'Tous les utilisateurs',   icon: '👥', count: null, color: 'primary' },
  { value: 'actifs',      label: 'Utilisateurs actifs',     icon: '✅', count: null, color: 'success' },
  { value: 'inactifs',    label: 'Utilisateurs inactifs',   icon: '⏸️', count: null, color: 'warning' },
  { value: 'BEPC',        label: 'Élèves BEPC',             icon: '📚', count: null, color: 'info' },
  { value: 'PREMIERE',    label: 'Élèves Première',         icon: '📖', count: null, color: 'info' },
  { value: 'TERMINALE',   label: 'Élèves Terminale',        icon: '🎓', count: null, color: 'info' },
  { value: 'UNIVERSITE',  label: 'Étudiants Université',    icon: '🏫', count: null, color: 'info' },
  { value: 'ENSEIGNANT',  label: 'Enseignants',             icon: '👨‍🏫', count: null, color: 'secondary' },
]

const TEMPLATES = [
  {
    id: 'welcome',
    name: 'Bienvenue',
    sujet: 'Bienvenue sur GestDoc !',
    message: `Bonjour,\n\nNous sommes ravis de vous accueillir sur GestDoc, la plateforme de partage de documents éducatifs au Togo.\n\nDécouvrez des milliers de cours, exercices et annales pour réussir vos études.\n\nÀ très bientôt sur GestDoc !\n\nL'équipe GestDoc`
  },
  {
    id: 'new_documents',
    name: 'Nouveaux documents',
    sujet: '📚 Nouveaux documents disponibles sur GestDoc',
    message: `Bonjour,\n\nDe nouveaux documents viennent d'être ajoutés sur GestDoc, spécialement pour vous !\n\nRendez-vous vite sur la plateforme pour les consulter et booster vos révisions.\n\nBonne étude !\n\nL'équipe GestDoc`
  },
  {
    id: 'donation',
    name: 'Soutien à la plateforme',
    sujet: 'Soutenez GestDoc !',
    message: `Bonjour,\n\nGestDoc a besoin de votre soutien pour continuer à offrir des ressources éducatives de qualité gratuitement.\n\nVotre don, même modeste, nous aide à maintenir la plateforme et à ajouter de nouveaux contenus.\n\nMerci pour votre générosité !\n\nL'équipe GestDoc`
  },
  {
    id: 'reminder',
    name: 'Relance activité',
    sujet: 'Revenez sur GestDoc !',
    message: `Bonjour,\n\nCela fait un moment que vous n'avez pas visité GestDoc. Nous avons ajouté de nombreuses nouvelles ressources qui pourraient vous intéresser.\n\nConnectez-vous dès maintenant et découvrez-les !\n\nÀ bientôt,\n\nL'équipe GestDoc`
  }
]

export default function AdminBroadcast() {
  const [form, setForm] = useState({ 
    sujet: '', 
    message: '', 
    cible: 'tous',
    schedule: 'now',
    scheduleDate: '',
    scheduleTime: ''
  })
  const [result, setResult] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Récupérer les statistiques des cibles
  const { data: targetStats } = useQuery({
    queryKey: ['broadcastStats'],
    queryFn: () => adminApi.getBroadcastStats().then(r => r.data).catch(() => null),
    staleTime: 5 * 60 * 1000,
  })

  // Mettre à jour les comptes dans CIBLES
  const ciblesWithCount = CIBLES.map(cible => ({
    ...cible,
    count: targetStats?.[cible.value] ?? null
  }))

  const mutation = useMutation({
    mutationFn: (data) => adminApi.broadcast(data),
    onSuccess: (res) => {
      setResult(res.data)
      toast.success(`Email envoyé à ${res.data.count} utilisateur(s) !`)
      setForm(f => ({ ...f, sujet: '', message: '' }))
      setTimeout(() => setResult(null), 8000)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.sujet.trim()) return toast.error('Sujet requis')
    if (!form.message.trim()) return toast.error('Message requis')
    if (form.message.length > 5000) return toast.error('Message trop long (max 5000 caractères)')
    
    // Vérification antispam basique
    const spamWords = ['viagra', 'crypto', 'bitcoin', 'gagner de l\'argent']
    const hasSpam = spamWords.some(word => form.message.toLowerCase().includes(word))
    if (hasSpam) {
      toast.error('Message suspect détecté. Veuillez vérifier votre contenu.')
      return
    }
    
    mutation.mutate(form)
  }

  const applyTemplate = (template) => {
    setForm(f => ({
      ...f,
      sujet: template.sujet,
      message: template.message
    }))
    setSelectedTemplate(template.id)
    toast.success(`Template "${template.name}" chargé`)
  }

  const charCount = form.message.length
  const charLimit = 5000
  const isNearLimit = charCount > charLimit * 0.9
  const isOverLimit = charCount > charLimit

  const getTargetSummary = () => {
    const target = ciblesWithCount.find(c => c.value === form.cible)
    if (!target) return 'Destinataires inconnus'
    if (target.count === null) return `Envoyer à ${target.label}`
    return `Envoyer à ${target.label} (${target.count} destinataires)`
  }

  return (
    <AdminLayout title="Notifications par email">
      <div className="max-w-4xl space-y-4">

        {/* Info avec statistiques */}
        <div className="alert alert-info text-sm py-3 shadow-md">
          <Mail size={16} />
          <div className="flex-1">
            <span>Envoyez un email à vos utilisateurs ou à un groupe spécifique.</span>
          </div>
          <div className="flex gap-2">
            <div className="badge badge-sm">📧 SMTP Ready</div>
            <div className="badge badge-sm">🎯 Ciblage précis</div>
          </div>
        </div>

        {/* Formulaire principal */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <Send size={20} className="text-primary" /> 
                Composer un email
              </h2>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-sm btn-ghost gap-2"
              >
                <Eye size={14} />
                {showPreview ? 'Masquer' : 'Aperçu'}
              </button>
            </div>

            {/* Templates */}
            <div className="bg-base-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-warning" />
                <span className="text-xs font-semibold">Templates rapides</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`btn btn-xs gap-1 ${
                      selectedTemplate === template.id ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    <Copy size={12} />
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Cible */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Target size={14} /> Destinataires
                  </span>
                  <span className="label-text-alt text-base-content/50">
                    {targetStats ? `${targetStats.total || 0} utilisateurs au total` : 'Chargement...'}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ciblesWithCount.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, cible: c.value }))}
                      className={`text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${
                        form.cible === c.value
                          ? `border-${c.color} bg-${c.color}/5 ring-2 ring-${c.color}/20`
                          : 'border-base-200 hover:border-base-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.icon}</span>
                          <span className="font-medium text-xs sm:text-sm">{c.label}</span>
                        </div>
                        {c.count !== null && (
                          <span className="text-[10px] text-base-content/40">{c.count}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Planification */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Timer size={14} /> Planification
                  </span>
                </label>
                <div className="flex gap-3 flex-wrap">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="now"
                      checked={form.schedule === 'now'}
                      onChange={() => setForm(f => ({ ...f, schedule: 'now' }))}
                      className="radio radio-xs"
                    />
                    <span className="text-sm">Envoyer maintenant</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="later"
                      checked={form.schedule === 'later'}
                      onChange={() => setForm(f => ({ ...f, schedule: 'later' }))}
                      className="radio radio-xs"
                    />
                    <span className="text-sm">Programmer</span>
                  </label>
                </div>
                {form.schedule === 'later' && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="date"
                      value={form.scheduleDate}
                      onChange={e => setForm(f => ({ ...f, scheduleDate: e.target.value }))}
                      className="input input-bordered input-sm flex-1"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <input
                      type="time"
                      value={form.scheduleTime}
                      onChange={e => setForm(f => ({ ...f, scheduleTime: e.target.value }))}
                      className="input input-bordered input-sm flex-1"
                    />
                  </div>
                )}
              </div>

              {/* Sujet */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Sujet de l'email</span>
                  <span className="label-text-alt text-base-content/50">
                    {form.sujet.length}/200
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 📢 Nouveaux documents disponibles sur GestDoc !"
                  value={form.sujet}
                  onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))}
                  className="input input-bordered w-full"
                  maxLength={200}
                />
              </div>

              {/* Message avec compteur */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Message</span>
                  <span className={`label-text-alt ${isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-base-content/50'}`}>
                    {charCount}/{charLimit} caractères
                  </span>
                </label>
                <textarea
                  placeholder={`Bonjour,\n\nNous avons le plaisir de vous informer...\n\nCordialement,\nL'équipe GestDoc`}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className={`textarea textarea-bordered w-full h-48 resize-none ${isOverLimit ? 'border-error' : ''}`}
                  maxLength={charLimit}
                />
                {isNearLimit && !isOverLimit && (
                  <div className="alert alert-warning text-xs mt-2 py-2">
                    <AlertCircle size={12} />
                    Approche de la limite de caractères
                  </div>
                )}
              </div>

              {/* Aperçu cible */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-3 flex items-center justify-between flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <span>{getTargetSummary()}</span>
                </div>
                {targetStats && (
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <UserCheck size={12} /> Actifs: {targetStats.actifs || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>👥</span> Total: {targetStats.total || 0}
                    </span>
                  </div>
                )}
              </div>

              {/* Bouton d'envoi */}
              <button
                type="submit"
                disabled={mutation.isPending || !form.sujet || !form.message || isOverLimit}
                className="btn btn-primary w-full gap-2 h-12 group"
              >
                {mutation.isPending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Send size={18} className="group-hover:scale-110 transition-transform" />
                )}
                {mutation.isPending 
                  ? 'Envoi en cours...' 
                  : form.schedule === 'later' 
                    ? 'Programmer l\'envoi' 
                    : 'Envoyer maintenant'}
              </button>
            </form>
          </div>
        </div>

        {/* Aperçu du message */}
        {showPreview && form.message && (
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={16} className="text-primary" />
                <h3 className="font-semibold">Aperçu du message</h3>
              </div>
              <div className="bg-base-200 rounded-xl p-4 space-y-3">
                <div className="border-b border-base-300 pb-2">
                  <p className="text-xs text-base-content/50">Sujet</p>
                  <p className="font-semibold">{form.sujet || '...'}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/50 mb-2">Message</p>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {form.message || '...'}
                  </div>
                </div>
                <div className="border-t border-base-300 pt-2 text-xs text-base-content/40 text-center">
                  Cet email sera envoyé depuis noreply@gestdoc.tg
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résultat d'envoi */}
        {result && (
          <div className="card bg-base-100 shadow-md border-2 border-success animate-fade-in">
            <div className="card-body p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle size={22} className="text-success" />
                <h3 className="font-semibold text-lg">{result.message}</h3>
              </div>
              <div className="bg-base-200 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Sujet :</span>
                  <span className="font-medium">{result.preview?.sujet}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Cible :</span>
                  <span className="font-medium">{CIBLES.find(c => c.value === result.preview?.cible)?.label || result.preview?.cible}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60">Destinataires :</span>
                  <span className="font-bold text-success">{result.count} utilisateur(s)</span>
                </div>
                {result.schedule && (
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/60">Planifié pour :</span>
                    <span className="font-medium">{new Date(result.schedule).toLocaleString('fr-FR')}</span>
                  </div>
                )}
              </div>
              <div className="alert alert-warning text-xs mt-3 py-2">
                <AlertCircle size={14} />
                <span>Pour activer l'envoi réel, configurez SMTP (nodemailer) ou Resend dans le backend.</span>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques des campagnes */}
        {targetStats?.campaigns && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-primary" />
                <h3 className="font-semibold">Dernières campagnes</h3>
              </div>
              <div className="space-y-2">
                {targetStats.campaigns.slice(0, 3).map((campaign, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={12} className="text-base-content/40" />
                      <span>{campaign.sujet?.substring(0, 30)}...</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-base-content/50">
                      <span className="flex items-center gap-1">
                        <Users size={10} /> {campaign.count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </AdminLayout>
  )
}