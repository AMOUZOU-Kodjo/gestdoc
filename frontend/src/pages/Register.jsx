// src/pages/Register.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, BookOpen, CheckCircle, XCircle, AlertCircle, GraduationCap, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PROFILS } from '../utils/constants'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    profile: '' // Profil académique
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' })

  // Calculer la force du mot de passe
  const checkPasswordStrength = (password) => {
    let score = 0
    let message = ''
    
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    
    if (score === 0) message = 'Très faible'
    else if (score <= 2) message = 'Faible'
    else if (score <= 3) message = 'Moyen'
    else if (score <= 4) message = 'Fort'
    else message = 'Très fort'
    
    return { score, message }
  }

  useEffect(() => {
    if (form.password) {
      setPasswordStrength(checkPasswordStrength(form.password))
    } else {
      setPasswordStrength({ score: 0, message: '' })
    }
  }, [form.password])

  // Validation en temps réel
  useEffect(() => {
    const newErrors = {}
    
    if (touched.prenom && (!form.prenom || form.prenom.length < 2)) {
      newErrors.prenom = 'Prénom requis (min. 2 caractères)'
    }
    if (touched.nom && (!form.nom || form.nom.length < 2)) {
      newErrors.nom = 'Nom requis (min. 2 caractères)'
    }
    if (touched.email) {
      if (!form.email) {
        newErrors.email = 'Email requis'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = 'Email invalide'
      }
    }
    if (touched.password) {
      if (!form.password) {
        newErrors.password = 'Mot de passe requis'
      } else if (form.password.length < 8) {
        newErrors.password = 'Minimum 8 caractères'
      } else if (!/[A-Z]/.test(form.password)) {
        newErrors.password = 'Doit contenir une majuscule'
      } else if (!/[0-9]/.test(form.password)) {
        newErrors.password = 'Doit contenir un chiffre'
      }
    }
    if (touched.confirmPassword && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    if (touched.profile && !form.profile) {
      newErrors.profile = 'Sélectionnez votre profil'
    }
    
    setErrors(newErrors)
  }, [form, touched])

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const getStrengthColor = () => {
    const colors = {
      0: 'bg-error',
      1: 'bg-error',
      2: 'bg-warning',
      3: 'bg-info',
      4: 'bg-success',
      5: 'bg-success'
    }
    return colors[passwordStrength.score] || 'bg-base-300'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Marquer tous les champs comme touchés
    const allTouched = { prenom: true, nom: true, email: true, password: true, confirmPassword: true, profile: true }
    setTouched(allTouched)
    
    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs dans le formulaire')
      return
    }
    
    setLoading(true)
    try {
      await register({
        nom:             form.nom.trim(),
        prenom:          form.prenom.trim(),
        email:           form.email.trim().toLowerCase(),
        password:        form.password,
        confirmPassword: form.confirmPassword,
        profile:         form.profile,
      })
      toast.success('Compte créé avec succès ! Bienvenue sur GestDoc 🎉')
      navigate('/')
    } catch (err) {
      const errData = err.response?.data
      if (errData?.details) {
        const fieldErrors = {}
        errData.details.forEach(d => { 
          fieldErrors[d.field] = d.message
          setTouched(prev => ({ ...prev, [d.field]: true }))
        })
        setErrors(fieldErrors)
        toast.error('Veuillez corriger les erreurs')
      } else {
        toast.error(errData?.error || 'Erreur lors de l\'inscription')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 flex items-center justify-center p-4 py-10">
      <div className="card bg-base-100 shadow-xl w-full max-w-md overflow-hidden">
        {/* Bandeau décoratif */}
        <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <div className="card-body p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl animate-pulse">
                <BookOpen size={32} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Créer un compte</h2>
            <p className="text-base-content/60 text-sm mt-1">
              Rejoignez la communauté éducative togolaise
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-medium flex items-center gap-1">
                    <User size={12} /> Prénom
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Jean"
                  value={form.prenom}
                  onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  onBlur={() => handleBlur('prenom')}
                  className={`input input-bordered input-sm w-full transition-all duration-200 ${
                    errors.prenom ? 'input-error' : touched.prenom && !errors.prenom ? 'input-success' : ''
                  }`}
                  autoComplete="given-name"
                  maxLength={100}
                />
                {errors.prenom && (
                  <label className="label py-0.5">
                    <span className="label-text-alt text-error flex items-center gap-1 text-[10px]">
                      <AlertCircle size={10} /> {errors.prenom}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-medium flex items-center gap-1">
                    <User size={12} /> Nom
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Dupont"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  onBlur={() => handleBlur('nom')}
                  className={`input input-bordered input-sm w-full transition-all duration-200 ${
                    errors.nom ? 'input-error' : touched.nom && !errors.nom ? 'input-success' : ''
                  }`}
                  autoComplete="family-name"
                  maxLength={100}
                />
                {errors.nom && (
                  <label className="label py-0.5">
                    <span className="label-text-alt text-error flex items-center gap-1 text-[10px]">
                      <AlertCircle size={10} /> {errors.nom}
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium flex items-center gap-1">
                  <Mail size={12} /> Adresse email
                </span>
              </label>
              <input
                type="email"
                placeholder="jean.dupont@exemple.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onBlur={() => handleBlur('email')}
                className={`input input-bordered input-sm w-full transition-all duration-200 ${
                  errors.email ? 'input-error' : touched.email && !errors.email ? 'input-success' : ''
                }`}
                autoComplete="email"
                maxLength={255}
              />
              {errors.email && (
                <label className="label py-0.5">
                  <span className="label-text-alt text-error flex items-center gap-1 text-[10px]">
                    <AlertCircle size={10} /> {errors.email}
                  </span>
                </label>
              )}
              {touched.email && !errors.email && form.email && (
                <label className="label py-0.5">
                  <span className="label-text-alt text-success flex items-center gap-1 text-[10px]">
                    <CheckCircle size={10} /> Email valide
                  </span>
                </label>
              )}
            </div>

            {/* Profil académique */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium flex items-center gap-1">
                  <GraduationCap size={12} /> Profil académique
                </span>
              </label>
              <select
                value={form.profile}
                onChange={e => setForm(f => ({ ...f, profile: e.target.value }))}
                onBlur={() => handleBlur('profile')}
                className={`select select-bordered select-sm w-full transition-all duration-200 ${
                  errors.profile ? 'select-error' : ''
                }`}
              >
                <option value="">Sélectionnez votre profil</option>
                {PROFILS.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.icon} {p.label} - {p.description}
                  </option>
                ))}
              </select>
              {errors.profile && (
                <label className="label py-0.5">
                  <span className="label-text-alt text-error flex items-center gap-1 text-[10px]">
                    <AlertCircle size={10} /> {errors.profile}
                  </span>
                </label>
              )}
            </div>

            {/* Mot de passe */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium flex items-center gap-1">
                  <Lock size={12} /> Mot de passe
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onBlur={() => handleBlur('password')}
                  className={`input input-bordered input-sm w-full pr-10 transition-all duration-200 ${
                    errors.password ? 'input-error' : touched.password && !errors.password && form.password ? 'input-success' : ''
                  }`}
                  autoComplete="new-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {/* Indicateur de force du mot de passe */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score ? getStrengthColor() : 'bg-base-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] ${
                      passwordStrength.score <= 2 ? 'text-error' :
                      passwordStrength.score === 3 ? 'text-warning' :
                      'text-success'
                    }`}>
                      Force: {passwordStrength.message}
                    </span>
                    <span className="text-[10px] text-base-content/40">
                      8+ caractères, majuscule, chiffre
                    </span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <label className="label py-0.5">
                  <span className="label-text-alt text-error flex items-center gap-1 text-[10px]">
                    <AlertCircle size={10} /> {errors.password}
                  </span>
                </label>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-medium flex items-center gap-1">
                  <Lock size={12} /> Confirmer le mot de passe
                </span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`input input-bordered input-sm w-full pr-10 transition-all duration-200 ${
                    errors.confirmPassword ? 'input-error' : touched.confirmPassword && !errors.confirmPassword && form.confirmPassword ? 'input-success' : ''
                  }`}
                  autoComplete="new-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                  onClick={() => setShowConfirmPass(s => !s)}
                  tabIndex={-1}
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <label className="label py-0.5">
                  <span className="label-text-alt text-error flex items-center gap-1 text-[10px]">
                    <AlertCircle size={10} /> {errors.confirmPassword}
                  </span>
                </label>
              )}
              {touched.confirmPassword && !errors.confirmPassword && form.confirmPassword && (
                <label className="label py-0.5">
                  <span className="label-text-alt text-success flex items-center gap-1 text-[10px]">
                    <CheckCircle size={10} /> Mots de passe identiques
                  </span>
                </label>
              )}
            </div>

            {/* Condition d'utilisation */}
            <div className="flex items-start gap-2 mt-2">
              <input type="checkbox" className="checkbox checkbox-xs mt-0.5" id="terms" required />
              <label htmlFor="terms" className="text-[10px] text-base-content/60 leading-relaxed">
                J'accepte les <Link to="/cgu" className="link link-primary">conditions d'utilisation</Link> et la{' '}
                <Link to="/confidentialite" className="link link-primary">politique de confidentialité</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full gap-2 mt-2 group transition-all duration-300 hover:scale-[1.02]"
            >
              {loading
                ? <span className="loading loading-spinner loading-sm"></span>
                : <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
              }
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="divider text-[10px] text-base-content/40">OU</div>

          <p className="text-center text-sm text-base-content/70">
            Déjà un compte ?{' '}
            <Link to="/login" className="link link-primary font-medium hover:link-secondary transition-all">
              Se connecter
            </Link>
          </p>

          {/* Avantages */}
          <div className="mt-4 pt-3 border-t border-base-200">
            <p className="text-center text-[10px] text-base-content/40">
              En créant un compte, vous pourrez :<br />
              📚 Télécharger des documents • 📤 Partager vos ressources • ⭐ Accéder au contenu premium
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}