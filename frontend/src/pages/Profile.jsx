// src/pages/Profile.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  FileText, Download, Lock, Settings, User, Mail, Calendar, 
  Crown, Upload, TrendingUp, Award, Clock, CheckCircle, 
  AlertCircle, Edit2, Star, Users, BookOpen, GraduationCap
} from 'lucide-react'
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

  // Statistiques de l'utilisateur
  const stats = {
    documentsUploaded: user?._count?.documents ?? 0,
    totalDownloads: user?._count?.downloads ?? 0,
    pendingUploads: uploads?.filter(d => d.status === 'PENDING').length || 0,
    approvedUploads: uploads?.filter(d => d.status === 'APPROVED').length || 0,
    rejectedUploads: uploads?.filter(d => d.status === 'REJECTED').length || 0,
  }

  const handleProfileChange = async (newProfile) => {
    setProfLoading(true)
    try {
      await setProfile(newProfile)
      toast.success('🎓 Profil mis à jour avec succès !')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setProfLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.currentPassword) errs.currentPassword = 'Mot de passe actuel requis'
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) errs.newPassword = 'Minimum 8 caractères'
    else if (!/[A-Z]/.test(pwForm.newPassword)) errs.newPassword = 'Doit contenir une majuscule'
    else if (!/[0-9]/.test(pwForm.newPassword)) errs.newPassword = 'Doit contenir un chiffre'
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm = 'Les mots de passe ne correspondent pas'
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    
    setPwLoading(true)
    try {
      await usersApi.changePassword({ 
        currentPassword: pwForm.currentPassword, 
        newPassword: pwForm.newPassword 
      })
      toast.success('🔒 Mot de passe modifié avec succès')
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' })
      setPwErrors({})
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Erreur lors du changement de mot de passe')
    } finally {
      setPwLoading(false)
    }
  }

  const profileLocked = !!user?.profile && user?.role !== 'ADMIN'
  const currentProfile = PROFILS.find(p => p.value === user?.profile)

  const TABS = [
    { id: 'profil',    label: 'Mon profil',      icon: <User size={15} /> },
    { id: 'uploads',   label: 'Mes uploads',     icon: <Upload size={15} />, badge: stats.pendingUploads },
    { id: 'downloads', label: 'Téléchargements', icon: <Download size={15} />, badge: downloads.length },
    { id: 'security',  label: 'Sécurité',        icon: <Lock size={15} /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Card identité améliorée */}
        <div className="card bg-base-100 shadow-xl overflow-hidden">
          {/* Bandeau décoratif */}
          <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
          
          <div className="card-body p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <AvatarUpload />
              
              {/* Infos utilisateur */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold">{user?.prenom} {user?.nom}</h2>
                  {user?.role === 'ADMIN' && (
                    <span className="badge badge-primary gap-1">
                      <Crown size={10} /> Admin
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-base-content/60 flex items-center justify-center md:justify-start gap-1 mt-1">
                  <Mail size={12} /> {user?.email}
                </p>
                
                <div className="flex gap-2 mt-3 flex-wrap justify-center md:justify-start">
                  {user?.profile && (
                    <span className="badge badge-outline gap-1 py-2">
                      <GraduationCap size={12} />
                      {PROFILS.find(p => p.value === user.profile)?.label || user.profile}
                    </span>
                  )}
                  <span className="badge badge-ghost gap-1">
                    <Calendar size={12} />
                    Membre depuis {new Date(user?.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              
              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                <div className="text-center px-2 md:px-4 border-r border-base-300 last:border-0">
                  <div className="text-xl md:text-2xl font-bold text-primary">{stats.documentsUploaded}</div>
                  <div className="text-[9px] md:text-[10px] text-base-content/50 whitespace-nowrap">Uploads</div>
                </div>
                <div className="text-center px-2 md:px-4 border-r border-base-300 last:border-0">
                  <div className="text-xl md:text-2xl font-bold text-success">{stats.totalDownloads}</div>
                  <div className="text-[9px] md:text-[10px] text-base-content/50 whitespace-nowrap">Downloads</div>
                </div>
                <div className="text-center px-2 md:px-4">
                  <div className="text-xl md:text-2xl font-bold text-warning">{stats.pendingUploads}</div>
                  <div className="text-[9px] md:text-[10px] text-base-content/50 whitespace-nowrap">En attente</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions rapides */}
          <div className="bg-base-200 px-6 py-3 flex gap-2 justify-center md:justify-start">
            <Link to="/upload" className="btn btn-xs btn-primary gap-1">
              <Upload size={12} /> Uploader
            </Link>
            <Link to="/abonnement" className="btn btn-xs btn-outline gap-1">
              <Crown size={12} /> Abonnement
            </Link>
          </div>
        </div>

        {/* Tabs améliorés */}
        <div className="tabs tabs-boxed bg-base-100 shadow-sm p-1 overflow-x-auto flex-nowrap gap-0">
          {TABS.map(t => (
            <button 
              key={t.id} 
              className={`tab gap-1.5 flex-shrink-0 text-xs sm:text-sm transition-all ${tab === t.id ? 'tab-active' : ''}`} 
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge > 0 && (
                <span className="badge badge-xs badge-primary ml-1">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Mon profil amélioré ── */}
        {tab === 'profil' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-primary" />
                Mon niveau d'accès
              </h3>

              {profileLocked ? (
                /* Profil verrouillé */
                <div className="space-y-4">
                  <div className="alert alert-warning text-sm py-3">
                    <Lock size={16} className="flex-shrink-0" />
                    <span>Votre profil a été défini et ne peut plus être modifié.</span>
                  </div>

                  {/* Profil actuel */}
                  {currentProfile && (
                    <div className="p-5 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-4xl">{currentProfile.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-lg">{currentProfile.label}</p>
                            <span className="badge badge-primary badge-sm">Actuel</span>
                          </div>
                          <p className="text-sm text-base-content/70 mt-1">{currentProfile.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-base-200 rounded-xl p-4">
                    <p className="text-xs text-base-content/50 text-center flex items-center justify-center gap-1">
                      <AlertCircle size={12} />
                      Pour modifier votre profil, veuillez contacter un administrateur.
                    </p>
                  </div>
                </div>
              ) : (
                /* Profil modifiable */
                <div className="space-y-4">
                  <div className="alert alert-info text-sm py-3">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>Choisissez votre profil académique. <strong>Ce choix est définitif</strong> et ne pourra plus être modifié ultérieurement.</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PROFILS.map(p => {
                      const isSelected = user?.profile === p.value
                      return (
                        <button 
                          key={p.value} 
                          onClick={() => handleProfileChange(p.value)}
                          disabled={profLoading || isSelected}
                          className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-base-200 hover:border-primary/40 hover:bg-base-200'
                          } ${profLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{p.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{p.label}</span>
                                {isSelected && (
                                  <span className="badge badge-primary badge-xs">
                                    <CheckCircle size={10} /> Actuel
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-base-content/60 mt-1 leading-relaxed">
                                {p.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Mes uploads amélioré ── */}
        {tab === 'uploads' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Upload size={18} className="text-primary" />
                  Mes documents uploadés
                </h3>
                <div className="flex gap-2">
                  <span className="badge badge-success gap-1">
                    <CheckCircle size={10} /> Approuvés: {stats.approvedUploads}
                  </span>
                  <span className="badge badge-warning gap-1">
                    <Clock size={10} /> En attente: {stats.pendingUploads}
                  </span>
                </div>
              </div>
              
              {uploadsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="skeleton h-16 w-full animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : uploads.length === 0 ? (
                <div className="text-center py-12 bg-base-200 rounded-xl">
                  <FileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-base-content/60">Aucun document uploadé</p>
                  <Link to="/upload" className="btn btn-xs btn-primary mt-3 gap-1">
                    <Upload size={12} /> Uploader un document
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploads.map(doc => {
                    const statusConfig = STATUS_LABELS[doc.status]
                    return (
                      <div key={doc.id} className="flex items-start gap-3 p-3 bg-base-200 rounded-xl hover:shadow-md transition-all group">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          doc.status === 'APPROVED' ? 'bg-success/20' :
                          doc.status === 'REJECTED' ? 'bg-error/20' : 'bg-warning/20'
                        }`}>
                          <FileText size={18} className={
                            doc.status === 'APPROVED' ? 'text-success' :
                            doc.status === 'REJECTED' ? 'text-error' : 'text-warning'
                          } />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/documents/${doc.id}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                            {doc.titre}
                          </Link>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-[10px] text-base-content/50">
                              {getNiveauLabel(doc.niveau)} · {getClassLabel(doc.classe)} · {getMatiereLabel(doc.matiere)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`badge badge-sm ${statusConfig?.class}`}>
                            {statusConfig?.label}
                          </span>
                          <span className="text-[10px] text-base-content/40 whitespace-nowrap">
                            {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Téléchargements amélioré ── */}
        {tab === 'downloads' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-5">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Download size={18} className="text-success" />
                Historique des téléchargements
                <span className="badge badge-success gap-1 ml-2">
                  {downloads.length} total
                </span>
              </h3>
              
              {dlLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="skeleton h-16 w-full animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : downloads.length === 0 ? (
                <div className="text-center py-12 bg-base-200 rounded-xl">
                  <Download size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-base-content/60">Aucun téléchargement</p>
                  <Link to="/" className="btn btn-xs btn-primary mt-3 gap-1">
                    <FileText size={12} /> Explorer les documents
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {downloads.map(dl => (
                    <div key={dl.id} className="flex items-start gap-3 p-3 bg-base-200 rounded-xl hover:shadow-md transition-all group">
                      <div className="p-2 rounded-lg bg-success/20 flex-shrink-0">
                        <Download size={18} className="text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/documents/${dl.document?.id}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                          {dl.document?.titre}
                        </Link>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[10px] text-base-content/50">
                            {getNiveauLabel(dl.document?.niveau)} · {getMatiereLabel(dl.document?.matiere)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-[10px] text-base-content/40 flex items-center gap-1 whitespace-nowrap">
                          <Calendar size={10} />
                          {new Date(dl.downloadedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Sécurité améliorée ── */}
        {tab === 'security' && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock size={18} className="text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Sécurité du compte</h3>
              </div>
              
              <form onSubmit={handlePasswordChange} noValidate className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Mot de passe actuel</span>
                  </label>
                  <input 
                    type="password" 
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    className={`input input-bordered w-full ${pwErrors.currentPassword ? 'input-error' : ''}`}
                    autoComplete="current-password"
                    maxLength={128}
                  />
                  {pwErrors.currentPassword && (
                    <label className="label">
                      <span className="label-text-alt text-error">{pwErrors.currentPassword}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Nouveau mot de passe</span>
                  </label>
                  <input 
                    type="password" 
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    className={`input input-bordered w-full ${pwErrors.newPassword ? 'input-error' : ''}`}
                    autoComplete="new-password"
                    maxLength={128}
                  />
                  {pwErrors.newPassword && (
                    <label className="label">
                      <span className="label-text-alt text-error">{pwErrors.newPassword}</span>
                    </label>
                  )}
                  {!pwErrors.newPassword && pwForm.newPassword && (
                    <label className="label">
                      <span className="label-text-alt text-success flex items-center gap-1">
                        <CheckCircle size={10} /> Mot de passe valide
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Confirmer le nouveau mot de passe</span>
                  </label>
                  <input 
                    type="password" 
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    className={`input input-bordered w-full ${pwErrors.confirm ? 'input-error' : ''}`}
                    autoComplete="new-password"
                    maxLength={128}
                  />
                  {pwErrors.confirm && (
                    <label className="label">
                      <span className="label-text-alt text-error">{pwErrors.confirm}</span>
                    </label>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={pwLoading} 
                  className="btn btn-primary gap-2 mt-2"
                >
                  {pwLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <Lock size={14} />
                  )}
                  {pwLoading ? 'Mise à jour...' : 'Changer le mot de passe'}
                </button>
              </form>

              <div className="mt-4 p-3 bg-base-200 rounded-lg">
                <p className="text-xs text-center text-base-content/50">
                  🔒 Votre mot de passe doit contenir au moins 8 caractères,<br />
                  une majuscule et un chiffre.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}