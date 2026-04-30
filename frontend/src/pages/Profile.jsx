// src/pages/Profile.jsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { User, FileText, Download, Lock, ChevronRight } from 'lucide-react'
import { usersApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getClassLabel, getMatiereLabel, STATUS_LABELS } from '../utils/constants'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('uploads')
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwLoading, setPwLoading] = useState(false)

  const { data: uploads = [], isLoading: uploadsLoading } = useQuery({
    queryKey: ['myUploads'],
    queryFn: () => usersApi.me().then(() => require('../services/api').documentsApi.myUploads().then(r => r.data)),
    enabled: tab === 'uploads',
  })

  const { data: downloads = [], isLoading: dlLoading } = useQuery({
    queryKey: ['myDownloads'],
    queryFn: () => usersApi.myDownloads().then(r => r.data),
    enabled: tab === 'downloads',
  })

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.currentPassword) errs.currentPassword = 'Requis'
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) errs.newPassword = 'Min. 8 caractères'
    else if (!/[A-Z]/.test(pwForm.newPassword)) errs.newPassword = 'Doit contenir une majuscule'
    else if (!/[0-9]/.test(pwForm.newPassword)) errs.newPassword = 'Doit contenir un chiffre'
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm = 'Les mots de passe ne correspondent pas'
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setPwLoading(true)
    try {
      await usersApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Mot de passe modifié. Reconnectez-vous.')
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Profile Card */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-6">
            <div className="flex items-center gap-4">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-16">
                  <span className="text-xl font-bold">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.prenom} {user?.nom}</h2>
                <p className="text-sm text-base-content/60">{user?.email}</p>
                <span className={`badge badge-sm mt-1 ${user?.role === 'ADMIN' ? 'badge-primary' : 'badge-ghost'}`}>
                  {user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-sm p-1">
          {[
            { id: 'uploads', label: 'Mes uploads', icon: <FileText size={15} /> },
            { id: 'downloads', label: 'Téléchargements', icon: <Download size={15} /> },
            { id: 'security', label: 'Sécurité', icon: <Lock size={15} /> },
          ].map(t => (
            <button
              key={t.id}
              className={`tab gap-2 flex-1 ${tab === t.id ? 'tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'uploads' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-3">Mes documents uploadés</h3>
              {uploadsLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 w-full"></div>)}</div>
              ) : uploads.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  <FileText size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun document uploadé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploads.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                      <FileText size={18} className="text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.titre}</p>
                        <p className="text-xs text-base-content/50">{getClassLabel(doc.classe)} · {getMatiereLabel(doc.matiere)} · {doc.annee}</p>
                      </div>
                      <span className={`badge badge-sm ${STATUS_LABELS[doc.status]?.class}`}>
                        {STATUS_LABELS[doc.status]?.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'downloads' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-3">Historique des téléchargements</h3>
              {dlLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 w-full"></div>)}</div>
              ) : downloads.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  <Download size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun téléchargement</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {downloads.map(dl => (
                    <div key={dl.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                      <Download size={18} className="text-success flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{dl.document?.titre}</p>
                        <p className="text-xs text-base-content/50">
                          {getClassLabel(dl.document?.classe)} · {getMatiereLabel(dl.document?.matiere)} · {new Date(dl.downloadedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-6">
              <h3 className="font-semibold mb-4">Changer le mot de passe</h3>
              <form onSubmit={handlePasswordChange} noValidate className="space-y-3">
                {[
                  { label: 'Mot de passe actuel', name: 'currentPassword', ac: 'current-password' },
                  { label: 'Nouveau mot de passe', name: 'newPassword', ac: 'new-password' },
                  { label: 'Confirmer le nouveau mot de passe', name: 'confirm', ac: 'new-password' },
                ].map(f => (
                  <div key={f.name} className="form-control">
                    <label className="label"><span className="label-text font-medium text-sm">{f.label}</span></label>
                    <input
                      type="password"
                      value={pwForm[f.name]}
                      onChange={e => setPwForm(p => ({ ...p, [f.name]: e.target.value }))}
                      className={`input input-bordered input-sm w-full ${pwErrors[f.name] ? 'input-error' : ''}`}
                      autoComplete={f.ac}
                      maxLength={128}
                    />
                    {pwErrors[f.name] && <label className="label"><span className="label-text-alt text-error">{pwErrors[f.name]}</span></label>}
                  </div>
                ))}
                <button type="submit" disabled={pwLoading} className="btn btn-primary btn-sm gap-2 mt-1">
                  {pwLoading ? <span className="loading loading-spinner loading-xs"></span> : <Lock size={14} />}
                  Mettre à jour le mot de passe
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
