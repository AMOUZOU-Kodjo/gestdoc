import { useState, useRef } from 'react'
import { Camera, Trash2, User } from 'lucide-react'
import { usersApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AvatarUpload() {
  const { user, updateUser } = useAuth()
  const fileRef   = useRef()
  const [loading, setLoading]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [preview, setPreview]   = useState(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image dépasse 2 Mo')
      return
    }

    // Aperçu local immédiat
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await usersApi.uploadAvatar(formData)
      updateUser({ avatarUrl: data.avatarUrl })
      setPreview(null)
      toast.success('Photo de profil mise à jour !')
    } catch (err) {
      setPreview(null)
      toast.error(err.response?.data?.error || 'Erreur lors de l\'upload')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await usersApi.deleteAvatar()
      updateUser({ avatarUrl: null })
      toast.success('Photo supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const avatarSrc = preview || user?.avatarUrl
  const initials  = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar display */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-base-200 shadow-md bg-primary flex items-center justify-center">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Photo de profil"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary-content">{initials}</span>
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
              <span className="loading loading-spinner loading-sm text-white"></span>
            </div>
          )}
        </div>

        {/* Bouton caméra overlay */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="absolute bottom-0 right-0 btn btn-circle btn-xs btn-primary shadow-md"
          title="Changer la photo"
        >
          <Camera size={12} />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="btn btn-sm btn-outline gap-2"
        >
          <Camera size={14} />
          {user?.avatarUrl ? 'Changer' : 'Ajouter une photo'}
        </button>

        {/* {user?.avatarUrl && (
          <button
            onClick={handleDelete}
            disabled={deleting || loading}
            className="btn btn-sm btn-ghost btn-square text-error"
            title="Supprimer la photo"
          >
            {deleting
              ? <span className="loading loading-spinner loading-xs"></span>
              : <Trash2 size={14} />
            }
          </button>
        )} */}
      </div>
        <h2 className="text-xl block md:hidden font-bold">{user?.prenom} {user?.nom}</h2>
        <span className={`badge badge-sm ${user?.role === 'ADMIN' ? 'badge-primary' : 'badge-ghost'} block md:hidden`}>
                    {user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                  </span>
      <p className="text-xs text-base-content/50 text-center">
        JPG, PNG, WebP — max. 2 Mo<br />Recadrage automatique en 200×200
      </p>
    </div>
  )
}
