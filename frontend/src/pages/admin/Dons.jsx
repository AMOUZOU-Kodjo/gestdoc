import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Phone, Save, Eye, EyeOff } from 'lucide-react'
import { adminApi } from '../../services/api'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminDons() {
  const qc = useQueryClient()
  const [preview, setPreview] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminApi.getSettings().then(r => r.data),
  })

  const [form, setForm] = useState({
    donTitre:     '',
    donMessage:   '',
    donNumero:    '',
    donNom:       '',
    donActif:     true,
    donMontants:  '500,1000,2000,5000',
  })

  const [initialized, setInitialized] = useState(false)
  if (settings && !initialized) {
    setForm({
      donTitre:    settings.donTitre    || 'Soutenez GestDoc 💙',
      donMessage:  settings.donMessage  || 'Votre don nous aide à maintenir la plateforme et à ajouter de nouvelles fonctionnalités. Merci pour votre générosité !',
      donNumero:   settings.donNumero   || '',
      donNom:      settings.donNom      || '',
      donActif:    settings.donActif    !== false,
      donMontants: settings.donMontants || '500,1000,2000,5000',
    })
    setInitialized(true)
  }

  const mutation = useMutation({
    mutationFn: (data) => adminApi.updateSettings(data),
    onSuccess: () => { qc.invalidateQueries(['adminSettings']); toast.success('Paramètres dons sauvegardés !') },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  })

  const montants = form.donMontants.split(',').map(m => m.trim()).filter(m => m && !isNaN(m))

  return (
    <AdminLayout title="Gestion des Dons">
      <div className="max-w-2xl space-y-5">

        <div className="alert alert-info text-sm py-3">
          <Heart size={16} className="text-error fill-error" />
          <span>Configurez la section de dons visible par les utilisateurs. Les dons se font via <strong>T-Money</strong> sur votre numéro.</span>
        </div>

        {/* Formulaire paramètres dons */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Heart size={18} className="text-primary" /> Configuration
              </h2>
              {/* Toggle activer/désactiver */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-base-content/70">Activer les dons</span>
                <input type="checkbox" className="toggle toggle-primary toggle-sm"
                  checked={!!form.donActif}
                  onChange={e => setForm(f => ({ ...f, donActif: e.target.checked }))} />
              </label>
            </div>

            {/* Numéro T-Money */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Phone size={14} /> Numéro T-Money
                </span>
              </label>
              <input type="tel" placeholder="Ex: 90000000"
                value={form.donNumero}
                onChange={e => setForm(f => ({ ...f, donNumero: e.target.value }))}
                className="input input-bordered w-full font-mono text-lg tracking-widest"
                maxLength={20} />
              <label className="label">
                <span className="label-text-alt text-base-content/50">Le numéro qui recevra les dons via T-Money</span>
              </label>
            </div>

            {/* Nom du bénéficiaire */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Nom du bénéficiaire</span></label>
              <input type="text" placeholder="Ex: AMOUZOU Kodjo"
                value={form.donNom}
                onChange={e => setForm(f => ({ ...f, donNom: e.target.value }))}
                className="input input-bordered w-full" maxLength={100} />
            </div>

            {/* Titre */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Titre de la section</span></label>
              <input type="text" placeholder="Soutenez GestDoc 💙"
                value={form.donTitre}
                onChange={e => setForm(f => ({ ...f, donTitre: e.target.value }))}
                className="input input-bordered w-full" maxLength={100} />
            </div>

            {/* Message */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Message d'appel au don</span></label>
              <textarea
                value={form.donMessage}
                onChange={e => setForm(f => ({ ...f, donMessage: e.target.value }))}
                className="textarea textarea-bordered w-full h-28 resize-none"
                maxLength={500} />
            </div>

            {/* Montants suggérés */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Montants suggérés (FCFA)</span>
                <span className="label-text-alt text-base-content/50">Séparés par des virgules</span>
              </label>
              <input type="text" placeholder="500,1000,2000,5000"
                value={form.donMontants}
                onChange={e => setForm(f => ({ ...f, donMontants: e.target.value }))}
                className="input input-bordered w-full font-mono" />
              <div className="flex gap-2 mt-2 flex-wrap">
                {montants.map(m => (
                  <span key={m} className="badge badge-outline">{parseInt(m).toLocaleString('fr-FR')} FCFA</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPreview(!preview)} className="btn btn-ghost btn-sm gap-2">
                {preview ? <EyeOff size={15} /> : <Eye size={15} />}
                {preview ? 'Masquer' : 'Aperçu'}
              </button>
              <button
                onClick={() => mutation.mutate(form)}
                disabled={mutation.isPending}
                className="btn btn-primary gap-2 flex-1"
              >
                {mutation.isPending ? <span className="loading loading-spinner loading-sm"></span> : <Save size={15} />}
                Sauvegarder
              </button>
            </div>
          </div>
        </div>

        {/* Aperçu de la bannière dons */}
        {preview && (
          <div>
            <p className="text-xs text-base-content/50 mb-2 text-center">— Aperçu tel qu'affiché aux utilisateurs —</p>
            <DonBannerPreview
              titre={form.donTitre}
              message={form.donMessage}
              numero={form.donNumero}
              nom={form.donNom}
              montants={montants}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

// Composant aperçu de la bannière
function DonBannerPreview({ titre, message, numero, nom, montants }) {
  const [montantChoisi, setMontantChoisi] = useState(null)

  const handleDon = () => {
    if (!numero) return
    // Instructions T-Money
    const instructions = `Pour faire un don via T-Money :\n\n1. Composez *145# sur votre téléphone\n2. Choisissez "Transfert d'argent"\n3. Entrez le numéro : ${numero}\n4. Montant : ${montantChoisi || '...'} FCFA\n5. Confirmez\n\nBénéficiaire : ${nom || 'GestDoc'}\n\nMerci pour votre soutien ! 💙`
    alert(instructions)
  }

  return (
    <div className="card bg-gradient-to-br from-rose-500 to-pink-700 text-white shadow-xl">
      <div className="card-body p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-white/20 rounded-full">
            <Heart size={32} className="fill-white" />
          </div>
        </div>

        <h3 className="text-xl font-bold">{titre || 'Soutenez GestDoc 💙'}</h3>
        <p className="text-white/90 text-sm leading-relaxed max-w-sm mx-auto">
          {message}
        </p>

        {/* Montants */}
        {montants.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {montants.map(m => (
              <button
                key={m}
                onClick={() => setMontantChoisi(m)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
                  montantChoisi === m
                    ? 'bg-white text-pink-600 border-white'
                    : 'bg-white/20 border-white/40 text-white hover:bg-white/30'
                }`}
              >
                {parseInt(m).toLocaleString('fr-FR')} FCFA
              </button>
            ))}
          </div>
        )}

        {/* Numéro */}
        {numero && (
          <div className="bg-white/20 rounded-2xl p-3 inline-block mx-auto">
            <p className="text-xs text-white/70 mb-1">Numéro T-Money</p>
            <p className="text-2xl font-bold tracking-widest">{numero}</p>
            {nom && <p className="text-xs text-white/80 mt-1">{nom}</p>}
          </div>
        )}

        <button
          onClick={handleDon}
          className="btn bg-white text-pink-600 hover:bg-white/90 border-0 gap-2 font-bold"
        >
          <Heart size={16} className="fill-pink-600" />
          Faire un don via T-Money
        </button>

        <p className="text-xs text-white/60">
          Paiement sécurisé via T-Money · Togo
        </p>
      </div>
    </div>
  )
}