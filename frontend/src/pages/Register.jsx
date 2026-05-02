// src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm]       = useState({ nom: '', prenom: '', email: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const e = {}
    if (!form.prenom || form.prenom.length < 2) e.prenom = 'Prénom requis (min. 2 caractères)'
    if (!form.nom    || form.nom.length    < 2) e.nom    = 'Nom requis (min. 2 caractères)'
    if (!form.email)                             e.email  = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    if (!form.password || form.password.length < 8) e.password = 'Minimum 8 caractères'
    else if (!/[A-Z]/.test(form.password)) e.password = 'Doit contenir une majuscule'
    else if (!/[0-9]/.test(form.password)) e.password = 'Doit contenir un chiffre'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        nom:             form.nom.trim(),
        prenom:          form.prenom.trim(),
        email:           form.email.trim().toLowerCase(),
        password:        form.password,
        confirmPassword: form.confirmPassword,
      })
      toast.success('Compte créé avec succès !')
      navigate('/')
    } catch (err) {
      const errData = err.response?.data
      if (errData?.details) {
        const fieldErrors = {}
        errData.details.forEach(d => { fieldErrors[d.field] = d.message })
        setErrors(fieldErrors)
      } else {
        toast.error(errData?.error || 'Erreur lors de l\'inscription')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 py-10">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <BookOpen size={32} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Créer un compte</h2>
            <p className="text-base-content/60 text-sm mt-1">Gratuit, rapide et sans engagement</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Prénom</span></label>
                <input
                  type="text"
                  placeholder="Jean"
                  value={form.prenom}
                  onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  className={`input input-bordered w-full ${errors.prenom ? 'input-error' : ''}`}
                  autoComplete="given-name"
                  maxLength={100}
                />
                {errors.prenom && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.prenom}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Nom</span></label>
                <input
                  type="text"
                  placeholder="Dupont"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className={`input input-bordered w-full ${errors.nom ? 'input-error' : ''}`}
                  autoComplete="family-name"
                  maxLength={100}
                />
                {errors.nom && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.nom}</span>
                  </label>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <input
                type="email"
                placeholder="jean@exemple.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                autoComplete="email"
                maxLength={255}
              />
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.email}</span>
                </label>
              )}
            </div>

            {/* Mot de passe */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Mot de passe</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 caract., 1 majuscule, 1 chiffre"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                  autoComplete="new-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password}</span>
                </label>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Confirmer le mot de passe</span></label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                autoComplete="new-password"
                maxLength={128}
              />
              {errors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.confirmPassword}</span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full gap-2 mt-2"
            >
              {loading
                ? <span className="loading loading-spinner loading-sm"></span>
                : <UserPlus size={18} />
              }
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="divider text-xs">OU</div>

          <p className="text-center text-sm text-base-content/70">
            Déjà un compte ?{' '}
            <Link to="/login" className="link link-primary font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}