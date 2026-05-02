import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Mail, Send, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { adminApi } from '../../services/api'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const CIBLES = [
  { value: 'tous',        label: 'Tous les utilisateurs',   icon: '👥' },
  { value: 'actifs',      label: 'Utilisateurs actifs',     icon: '✅' },
  { value: 'BEPC',        label: 'Élèves BEPC',             icon: '📚' },
  { value: 'PREMIERE',    label: 'Élèves Première',         icon: '📖' },
  { value: 'TERMINALE',   label: 'Élèves Terminale',        icon: '🎓' },
  { value: 'UNIVERSITE',  label: 'Étudiants Université',    icon: '🏫' },
  { value: 'ENSEIGNANT',  label: 'Enseignants',             icon: '👨‍🏫' },
]

export default function AdminBroadcast() {
  const [form, setForm] = useState({ sujet: '', message: '', cible: 'tous' })
  const [result, setResult] = useState(null)

  const mutation = useMutation({
    mutationFn: (data) => adminApi.broadcast(data),
    onSuccess: (res) => {
      setResult(res.data)
      toast.success(`Email envoyé à ${res.data.count} utilisateur(s) !`)
      setForm(f => ({ ...f, sujet: '', message: '' }))
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.sujet.trim()) return toast.error('Sujet requis')
    if (!form.message.trim()) return toast.error('Message requis')
    mutation.mutate(form)
  }

  const charCount = form.message.length

  return (
    <AdminLayout title="Notifications par email">
      <div className="max-w-2xl space-y-4">

        {/* Info */}
        <div className="alert alert-info text-sm py-3">
          <Mail size={16} />
          <span>Envoyez un email à tous vos utilisateurs ou à un groupe spécifique en un seul clic.</span>
        </div>

        {/* Formulaire */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <Send size={18} className="text-primary" /> Composer l'email
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cible */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Destinataires</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CIBLES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, cible: c.value }))}
                      className={`text-left px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                        form.cible === c.value
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-base-200 hover:border-base-300'
                      }`}
                    >
                      <span className="mr-1">{c.icon}</span> {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sujet */}
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Sujet de l'email</span></label>
                <input
                  type="text"
                  placeholder="Ex: Nouveaux documents disponibles sur GestDoc !"
                  value={form.sujet}
                  onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))}
                  className="input input-bordered w-full"
                  maxLength={200}
                />
              </div>

              {/* Message */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Message</span>
                  <span className={`label-text-alt ${charCount > 4500 ? 'text-error' : 'text-base-content/50'}`}>
                    {charCount}/5000
                  </span>
                </label>
                <textarea
                  placeholder="Bonjour,&#10;&#10;Nous avons le plaisir de vous informer..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="textarea textarea-bordered w-full h-48 resize-none"
                  maxLength={5000}
                />
              </div>

              {/* Aperçu cible */}
              <div className="bg-base-200 rounded-xl p-3 flex items-center gap-3 text-sm">
                <Users size={16} className="text-primary flex-shrink-0" />
                <span>
                  Envoi à : <strong>{CIBLES.find(c => c.value === form.cible)?.label}</strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending || !form.sujet || !form.message}
                className="btn btn-primary w-full gap-2"
              >
                {mutation.isPending
                  ? <span className="loading loading-spinner loading-sm"></span>
                  : <Send size={16} />
                }
                {mutation.isPending ? 'Envoi en cours...' : 'Envoyer l\'email'}
              </button>
            </form>
          </div>
        </div>

        {/* Résultat */}
        {result && (
          <div className="card bg-base-100 shadow-md border-2 border-success">
            <div className="card-body p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle size={22} className="text-success" />
                <h3 className="font-semibold">{result.message}</h3>
              </div>
              <div className="bg-base-200 rounded-xl p-3 text-sm space-y-1">
                <p><strong>Sujet :</strong> {result.preview?.sujet}</p>
                <p><strong>Cible :</strong> {result.preview?.cible}</p>
                <p><strong>Destinataires :</strong> {result.count} utilisateur(s)</p>
              </div>
              <div className="alert alert-warning text-xs mt-3 py-2">
                <AlertCircle size={14} />
                <span>Pour activer l'envoi réel, configurez SMTP (nodemailer) ou Resend dans le backend.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}