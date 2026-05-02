import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Heart, X } from 'lucide-react'
import api from '../services/api'

export default function DonBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('don_dismissed') === 'true'
  )

  const { data: s } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data).catch(() => null),
    staleTime: 5 * 60 * 1000,
  })

  const [montantChoisi, setMontantChoisi] = useState(null)

  // Masquer si désactivé, pas de numéro, ou dismissed par l'utilisateur
  if (!s || !s.donActif || !s.donNumero || dismissed) return null

  const montants = (s.donMontants || '500,1000,2000,5000')
    .split(',').map(m => m.trim()).filter(m => m && !isNaN(m))

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('don_dismissed', 'true')
  }

  const handleDon = () => {
    const instructions = [
      `Pour faire un don via T-Money :`,
      ``,
      `1. Composez *145# sur votre téléphone`,
      `2. Choisissez "Transfert d'argent"`,
      `3. Entrez le numéro : ${s.donNumero}`,
      montantChoisi ? `4. Montant : ${parseInt(montantChoisi).toLocaleString('fr-FR')} FCFA` : `4. Entrez le montant souhaité`,
      `5. Confirmez avec votre code PIN`,
      ``,
      `Bénéficiaire : ${s.donNom || 'GestDoc'}`,
      ``,
      `Merci infiniment pour votre soutien ! 💙`,
    ].join('\n')
    alert(instructions)
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white">
      {/* Bouton fermer */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Icône */}
          <div className="p-3 bg-white/20 rounded-2xl flex-shrink-0">
            <Heart size={28} className="fill-white" />
          </div>

          {/* Texte */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-base">{s.donTitre || 'Soutenez GestDoc 💙'}</h3>
            <p className="text-white/85 text-sm mt-0.5 leading-relaxed max-w-xl">
              {s.donMessage}
            </p>
          </div>

          {/* Action */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            {/* Montants */}
            {montants.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center">
                {montants.map(m => (
                  <button
                    key={m}
                    onClick={() => setMontantChoisi(m === montantChoisi ? null : m)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      montantChoisi === m
                        ? 'bg-white text-pink-600 border-white'
                        : 'bg-white/20 border-white/40 hover:bg-white/30'
                    }`}
                  >
                    {parseInt(m).toLocaleString('fr-FR')} FCFA
                  </button>
                ))}
              </div>
            )}

            {/* Numéro + bouton */}
            <div className="text-center">
              <div className="bg-white/20 rounded-xl px-4 py-2 mb-2">
                <p className="text-xs text-white/70">T-Money</p>
                <p className="text-xl font-bold tracking-widest">{s.donNumero}</p>
                {s.donNom && <p className="text-xs text-white/80">{s.donNom}</p>}
              </div>
              <button
                onClick={handleDon}
                className="btn btn-sm bg-white text-pink-600 hover:bg-white/90 border-0 font-bold gap-1.5"
              >
                <Heart size={13} className="fill-pink-600" />
                Faire un don
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}