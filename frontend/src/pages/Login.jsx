// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Eye, EyeOff, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    if (!form.password) e.password = 'Mot de passe requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password })
      toast.success('Connexion réussie !')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur de connexion'
      toast.error(msg)
      if (err.response?.status === 401) {
        setErrors({ password: 'Email ou mot de passe incorrect' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <BookOpen size={32} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Connexion</h2>
            <p className="text-base-content/60 text-sm mt-1">
              Accédez à votre espace GestDoc
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                autoComplete="email"
                maxLength={255}
              />
              {errors.email && <label className="label"><span className="label-text-alt text-error">{errors.email}</span></label>}
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Mot de passe</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
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
              {errors.password && <label className="label"><span className="label-text-alt text-error">{errors.password}</span></label>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full gap-2 mt-2"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <LogIn size={18} />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="divider text-xs">OU</div>

          <p className="text-center text-sm text-base-content/70">
            Pas encore de compte ?{' '}
            <Link to="/register" className="link link-primary font-medium">
              Créer un compte gratuitement
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
