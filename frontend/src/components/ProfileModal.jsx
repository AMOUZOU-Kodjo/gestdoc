import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PROFILS } from '../utils/constants'
import toast from 'react-hot-toast'

export default function ProfileModal() {
  const { user, setProfile, needsProfile } = useAuth()
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)

  if (!needsProfile) return null

  const handleConfirm = async () => {
    if (!selected) return toast.error('Veuillez choisir un profil')
    setLoading(true)
    try {
      await setProfile(selected)
      toast.success('Profil configuré !')
    } catch {
      toast.error('Erreur lors de la configuration du profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-2xl w-full">
        <h3 className="text-xl font-bold mb-1">Bienvenue, {user?.prenom} !</h3>
        <p className="text-base-content/60 text-sm mb-6">
          Choisissez votre profil pour accéder aux documents correspondant à votre niveau.
          Vous pourrez le modifier depuis votre profil.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {PROFILS.map(p => (
            <button
              key={p.value}
              onClick={() => setSelected(p.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selected === p.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-base-200 hover:border-base-300 bg-base-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontSize: '24px' }}>{p.icon}</span>
                <span className="font-semibold text-sm">{p.label}</span>
              </div>
              <p className="text-xs text-base-content/60 leading-relaxed">{p.description}</p>
            </button>
          ))}
        </div>

        <div className="modal-action justify-center">
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="btn btn-primary btn-wide gap-2"
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : null}
            Confirmer mon profil
          </button>
        </div>
      </div>
    </div>
  )
}
