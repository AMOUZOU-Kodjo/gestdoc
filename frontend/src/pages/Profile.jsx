import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Lock, Settings } from 'lucide-react'
import { usersApi, documentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getClassLabel, getMatiereLabel, getNiveauLabel, STATUS_LABELS, PROFILS } from '../utils/constants'
import AvatarUpload from '../components/AvatarUpload'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, setProfile } = useAuth()
  const [tab, setTab]             = useState('profil')
  const [pwForm, setPwForm]       = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [pwErrors, setPwErrors]   = useState({})
  const [pwLoading, setPwLoading] = useState(false)
  const [profLoading, setProfLoading] = useState(false)

  const { data: uploads = [], isLoading: uploadsLoading } = useQuery({
    queryKey: ['myUploads'],
    queryFn: () => documentsApi.myUploads().then(r => r.data),
    enabled: tab === 'uploads',
  })

  const { data: downloads = [], isLoading: dlLoading } = useQuery({
    queryKey: ['myDownloads'],
    queryFn: () => usersApi.myDownloads().then(r => r.data),
    enabled: tab === 'downloads',
  })

  const handleProfileChange = async (newProfile) => {
    setProfLoading(true)
    try {
      await setProfile(newProfile)
      toast.success('Profil mis à jour !')
    } catch { toast.error('Erreur lors de la mise à jour') }
    finally { setProfLoading(false) }
  }

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
      toast.success('Mot de passe modifié.')
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' })
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur') }
    finally { setPwLoading(false) }
  }

  const TABS = [
    { id: 'profil',    label: 'Mon profil',     icon: <Settings size={15} /> },
    { id: 'uploads',   label: 'Mes uploads',    icon: <FileText size={15} /> },
    { id: 'downloads', label: 'Téléchargements', icon: <Download size={15} /> },
    { id: 'security',  label: 'Sécurité',        icon: <Lock size={15} /> },
  ]

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Card identité avec avatar */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-6">
            <div className="flex items-center gap-5 flex-wrap">
              {/* Avatar cliquable */}
              <AvatarUpload />

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold">{user?.prenom} {user?.nom}</h2>
                {/* <p className="text-sm text-base-content/60 mt-0.5">{user?.email}</p> */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className={`badge badge-sm ${user?.role === 'ADMIN' ? 'badge-primary' : 'badge-ghost'}`}>
                    {user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                  </span>
                  {user?.profile && (
                    <span className="badge badge-sm badge-outline">
                      {PROFILS.find(p => p.value === user.profile)?.icon}{' '}
                      {PROFILS.find(p => p.value === user.profile)?.label || user.profile}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-base-content/50">
                  <span>{user?._count?.documents ?? 0} document{user?._count?.documents !== 1 ? 's' : ''} uploadé{user?._count?.documents !== 1 ? 's' : ''}</span>
                  <span>{user?._count?.downloads ?? 0} téléchargement{user?._count?.downloads !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-sm p-1">
          {TABS.map(t => (
            <button key={t.id} className={`tab gap-1.5 flex-1 text-xs sm:text-sm ${tab === t.id ? 'tab-active' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon}<span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Mon profil ── */}
        {tab === 'profil' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-6">
              <h3 className="font-semibold mb-2">Niveau d'accès</h3>
              <p className="text-sm text-base-content/60 mb-4">Votre profil détermine les niveaux de documents auxquels vous avez accès.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROFILS.map(p => (
                  <button key={p.value} onClick={() => handleProfileChange(p.value)} disabled={profLoading}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      user?.profile === p.value
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-base-200 hover:border-base-300 bg-base-100'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: '18px' }}>{p.icon}</span>
                      <span className="font-medium text-sm">{p.label}</span>
                      {user?.profile === p.value && (
                        <span className="badge badge-primary badge-xs ml-auto">Actuel</span>
                      )}
                    </div>
                    <p className="text-xs text-base-content/50 leading-relaxed">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Mes uploads ── */}
        {tab === 'uploads' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-3">Mes documents uploadés</h3>
              {uploadsLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-12 w-full"/>)}</div>
              ) : uploads.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  <FileText size={36} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">Aucun document uploadé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploads.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                      <FileText size={18} className="text-primary flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.titre}</p>
                        <p className="text-xs text-base-content/50">{getNiveauLabel(doc.niveau)} · {getClassLabel(doc.classe)} · {getMatiereLabel(doc.matiere)}</p>
                      </div>
                      <span className={`badge badge-sm ${STATUS_LABELS[doc.status]?.class}`}>{STATUS_LABELS[doc.status]?.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Téléchargements ── */}
        {tab === 'downloads' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-3">Historique des téléchargements</h3>
              {dlLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-12 w-full"/>)}</div>
              ) : downloads.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  <Download size={36} className="mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">Aucun téléchargement</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {downloads.map(dl => (
                    <div key={dl.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                      <Download size={18} className="text-success flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{dl.document?.titre}</p>
                        <p className="text-xs text-base-content/50">
                          {getNiveauLabel(dl.document?.niveau)} · {getMatiereLabel(dl.document?.matiere)} · {new Date(dl.downloadedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Sécurité ── */}
        {tab === 'security' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-6">
              <h3 className="font-semibold mb-4">Changer le mot de passe</h3>
              <form onSubmit={handlePasswordChange} noValidate className="space-y-3">
                {[
                  { label:'Mot de passe actuel', name:'currentPassword', ac:'current-password' },
                  { label:'Nouveau mot de passe', name:'newPassword',    ac:'new-password' },
                  { label:'Confirmer',            name:'confirm',        ac:'new-password' },
                ].map(f => (
                  <div key={f.name} className="form-control">
                    <label className="label"><span className="label-text font-medium text-sm">{f.label}</span></label>
                    <input type="password" value={pwForm[f.name]}
                      onChange={e => setPwForm(p => ({ ...p, [f.name]: e.target.value }))}
                      className={`input input-bordered input-sm w-full ${pwErrors[f.name] ? 'input-error':''}`}
                      autoComplete={f.ac} maxLength={128}/>
                    {pwErrors[f.name] && <label className="label"><span className="label-text-alt text-error">{pwErrors[f.name]}</span></label>}
                  </div>
                ))}
                <button type="submit" disabled={pwLoading} className="btn btn-primary btn-sm gap-2 mt-1">
                  {pwLoading ? <span className="loading loading-spinner loading-xs"/> : <Lock size={14}/>}
                  Mettre à jour
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
