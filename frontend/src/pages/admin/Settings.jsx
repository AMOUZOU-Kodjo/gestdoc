import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Settings, Globe, Mail, Phone, MapPin,
  Facebook, Twitter, Instagram, Youtube,
  Upload, Shield, AlertTriangle, Save, RefreshCw
} from 'lucide-react'
import { adminApi } from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const qc = useQueryClient()
  const [form, setForm] = useState(null)
  const [activeTab, setActiveTab] = useState('general')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminApi.getSettings().then(r => r.data),
  })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const mutation = useMutation({
    mutationFn: (data) => adminApi.updateSettings(data),
    onSuccess: (res) => {
      qc.setQueryData(['adminSettings'], res.data)
      toast.success('Paramètres sauvegardés !')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde'),
  })

  const handleSave = () => {
    if (!form) return
    mutation.mutate(form)
  }

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const tabs = [
    { id: 'general',  label: 'Général',     icon: <Globe size={15} /> },
    { id: 'contact',  label: 'Contact',      icon: <Mail size={15} /> },
    { id: 'social',   label: 'Réseaux',      icon: <Facebook size={15} /> },
    { id: 'security', label: 'Sécurité',     icon: <Shield size={15} /> },
  ]

  if (isLoading || !form) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  )

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="btn btn-ghost btn-sm btn-square">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              <h1 className="text-xl font-bold">Paramètres du site</h1>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="btn btn-primary btn-sm gap-2"
          >
            {mutation.isPending
              ? <span className="loading loading-spinner loading-xs"></span>
              : <Save size={15} />
            }
            Sauvegarder
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-sm p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`tab gap-2 flex-1 text-sm ${activeTab === t.id ? 'tab-active' : ''}`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-6 space-y-5">

            {/* ── Général ─────────────────────────────────────────────── */}
            {activeTab === 'general' && (
              <>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Globe size={18} className="text-primary" /> Informations générales
                </h2>

                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Nom du site</span></label>
                  <input type="text" value={form.siteName || ''} onChange={e => set('siteName', e.target.value)}
                    className="input input-bordered w-full" maxLength={100} />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Description du site</span></label>
                  <textarea value={form.siteDescription || ''} onChange={e => set('siteDescription', e.target.value)}
                    className="textarea textarea-bordered w-full h-24 resize-none" maxLength={300} />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">Utilisée dans les balises meta SEO</span>
                    <span className="label-text-alt">{(form.siteDescription || '').length}/300</span>
                  </label>
                </div>

                <div className="divider my-2">Aperçu</div>
                <div className="bg-base-200 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-semibold">{form.siteName || 'GestDoc'}</p>
                  <p className="text-xs text-base-content/60">{form.siteDescription || '—'}</p>
                </div>
              </>
            )}

            {/* ── Contact ─────────────────────────────────────────────── */}
            {activeTab === 'contact' && (
              <>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Mail size={18} className="text-primary" /> Informations de contact
                </h2>

                {[
                  { label: 'Email de contact', key: 'contactEmail', icon: <Mail size={15} />, type: 'email', placeholder: 'contact@gestdoc.tg' },
                  { label: 'Téléphone',        key: 'contactPhone', icon: <Phone size={15} />, type: 'text', placeholder: '+228 90 00 00 00' },
                  { label: 'Adresse',          key: 'contactAddress', icon: <MapPin size={15} />, type: 'text', placeholder: 'Lomé, Togo' },
                ].map(f => (
                  <div key={f.key} className="form-control">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">{f.icon}{f.label}</span>
                    </label>
                    <input type={f.type} value={form[f.key] || ''} placeholder={f.placeholder}
                      onChange={e => set(f.key, e.target.value)}
                      className="input input-bordered w-full" />
                  </div>
                ))}
              </>
            )}

            {/* ── Réseaux sociaux ──────────────────────────────────────── */}
            {activeTab === 'social' && (
              <>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Facebook size={18} className="text-primary" /> Réseaux sociaux
                </h2>
                <p className="text-sm text-base-content/60">Entrez l'URL complète ou laissez vide pour masquer l'icône dans le footer.</p>

                {[
                  { label: 'Facebook',  key: 'facebookUrl',  icon: <Facebook  size={16} className="text-blue-600" />, placeholder: 'https://facebook.com/votrepage' },
                  { label: 'Twitter/X', key: 'twitterUrl',   icon: <Twitter   size={16} className="text-sky-500" />,  placeholder: 'https://twitter.com/votrecompte' },
                  { label: 'Instagram', key: 'instagramUrl', icon: <Instagram size={16} className="text-pink-500" />, placeholder: 'https://instagram.com/votrecompte' },
                  { label: 'YouTube',   key: 'youtubeUrl',   icon: <Youtube   size={16} className="text-red-500" />,  placeholder: 'https://youtube.com/@votrechaine' },
                ].map(f => (
                  <div key={f.key} className="form-control">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">{f.icon}{f.label}</span>
                    </label>
                    <input type="url" value={form[f.key] || ''} placeholder={f.placeholder}
                      onChange={e => set(f.key, e.target.value)}
                      className="input input-bordered w-full" />
                  </div>
                ))}
              </>
            )}

            {/* ── Sécurité & Fonctionnalités ───────────────────────────── */}
            {activeTab === 'security' && (
              <>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Shield size={18} className="text-primary" /> Sécurité & Fonctionnalités
                </h2>

                {/* Mode maintenance */}
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${form.maintenanceMode ? 'border-error bg-error/5' : 'border-base-200'}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className={form.maintenanceMode ? 'text-error mt-0.5' : 'text-base-content/40 mt-0.5'} />
                    <div>
                      <p className="font-medium text-sm">Mode maintenance</p>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Affiche une page de maintenance aux visiteurs. Seuls les admins peuvent accéder au site.
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" checked={!!form.maintenanceMode}
                    onChange={e => set('maintenanceMode', e.target.checked)}
                    className="toggle toggle-error" />
                </div>

                {/* Autoriser les uploads */}
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${!form.allowUploads ? 'border-warning bg-warning/5' : 'border-base-200'}`}>
                  <div className="flex items-start gap-3">
                    <Upload size={20} className={!form.allowUploads ? 'text-warning mt-0.5' : 'text-base-content/40 mt-0.5'} />
                    <div>
                      <p className="font-medium text-sm">Autoriser les uploads</p>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Permettre aux utilisateurs de soumettre de nouveaux documents.
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" checked={!!form.allowUploads}
                    onChange={e => set('allowUploads', e.target.checked)}
                    className="toggle toggle-success" />
                </div>

                {/* Taille max fichier */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Taille maximale des fichiers</span>
                    <span className="label-text-alt font-semibold text-primary">{form.maxFileSizeMb} Mo</span>
                  </label>
                  <input type="range" min={1} max={100} value={form.maxFileSizeMb || 20}
                    onChange={e => set('maxFileSizeMb', parseInt(e.target.value))}
                    className="range range-primary range-sm" step={1} />
                  <div className="flex justify-between text-xs text-base-content/50 mt-1 px-1">
                    <span>1 Mo</span><span>25 Mo</span><span>50 Mo</span><span>100 Mo</span>
                  </div>
                </div>

                {/* Résumé */}
                <div className="bg-base-200 rounded-xl p-4 space-y-2 mt-2">
                  <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Résumé</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${form.maintenanceMode ? 'bg-error' : 'bg-success'}`}></div>
                    {form.maintenanceMode ? 'Site en maintenance' : 'Site en ligne'}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${form.allowUploads ? 'bg-success' : 'bg-warning'}`}></div>
                    {form.allowUploads ? 'Uploads activés' : 'Uploads désactivés'}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-info"></div>
                    Taille max : {form.maxFileSizeMb} Mo
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bouton bas */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={mutation.isPending} className="btn btn-primary gap-2">
            {mutation.isPending
              ? <span className="loading loading-spinner loading-sm"></span>
              : <Save size={16} />
            }
            Sauvegarder les paramètres
          </button>
        </div>
      </div>
    </div>
  )
}