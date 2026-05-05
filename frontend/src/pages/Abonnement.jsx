import { useQuery } from '@tanstack/react-query'
import { Crown, Upload, Download, Check, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import api from '../services/api'

const fetchSettings = () => api.get('/admin/settings').then(r => r.data).catch(() => null)

const PLANS = [
  { label: 'Gratuit',   prix: 0,     jours: null, color: 'border-base-300', avantages: ['2 téléchargements gratuits', '+2 par document validé', 'Accès au forum', 'Upload de documents'] },
  { label: '1 Semaine', prix: 500,   jours: 7,    color: 'border-info',     avantages: ['Téléchargements illimités', 'Accès à tous les niveaux', 'Accès au forum', 'Upload illimité'], recommended: false },
  { label: '1 Mois',    prix: 1500,  jours: 30,   color: 'border-primary',  avantages: ['Téléchargements illimités', 'Accès à tous les niveaux', 'Accès au forum', 'Upload illimité', 'Support prioritaire'], recommended: true },
  { label: '3 Mois',    prix: 4000,  jours: 90,   color: 'border-secondary',avantages: ['Téléchargements illimités', 'Accès à tous les niveaux', 'Accès au forum', 'Upload illimité', 'Support prioritaire', 'Économisez 11%'] },
]

export default function Abonnement() {
  const { user } = useAuth()

  const { data: quota } = useQuery({
    queryKey: ['myQuota'],
    queryFn: () => usersApi.quota().then(r => r.data),
    enabled: !!user,
  })

  const { data: settings } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: fetchSettings,
  })

  const numero = settings?.donNumero || '+228 XX XX XX XX'
  const nom    = settings?.donNom    || 'GestDoc'

  const handleAbonner = (plan) => {
    const instructions = [
      `Pour vous abonner au plan "${plan.label}" (${plan.prix.toLocaleString('fr-FR')} FCFA) :`,
      ``,
      `1. Envoyez ${plan.prix.toLocaleString('fr-FR')} FCFA via T-Money au :`,
      `   📱 ${numero} (${nom})`,
      ``,
      `2. Après paiement, contactez-nous avec :`,
      `   - Votre email : ${user?.email || 'votre@email.com'}`,
      `   - La référence T-Money`,
      `   - Le plan choisi : ${plan.label}`,
      ``,
      `3. L'administrateur activera votre abonnement sous 24h.`,
      ``,
      `Contactez-nous : ${settings?.contactEmail || 'contact@gestdoc.tg'}`,
    ].join('\n')
    alert(instructions)
  }

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-warning/20 rounded-2xl">
              <Crown size={40} className="text-warning" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Abonnements GestDoc</h1>
          <p className="text-base-content/60 mt-2">Accédez à tous les documents sans limite</p>
        </div>

        {/* Statut actuel */}
        {user && quota && (
          <div className={`card shadow-md ${quota.unlimited ? 'bg-success/10 border-2 border-success' : 'bg-base-100'}`}>
            <div className="card-body p-5">
              <h3 className="font-semibold mb-3">Votre situation actuelle</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Download size={16} className="text-primary" />
                  {quota.unlimited
                    ? <span className="text-success font-semibold">Téléchargements illimités ✅</span>
                    : <span><strong>{quota.used}</strong> utilisé(s) sur <strong>{quota.totalAllowed}</strong> ({quota.remaining} restant{quota.remaining !== 1 ? 's' : ''})</span>
                  }
                </div>
                {quota.hasSubscription && (
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-warning" />
                    <span>Abonnement actif jusqu'au <strong>{new Date(quota.subscription.fin).toLocaleDateString('fr-FR')}</strong></span>
                  </div>
                )}
                {!quota.unlimited && (
                  <div className="flex items-center gap-2">
                    <Upload size={16} className="text-info" />
                    <span>Uploadez un document validé pour gagner <strong>+2 téléchargements</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.label} className={`card bg-base-100 shadow-md border-2 ${plan.color} relative`}>
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge badge-primary badge-sm font-semibold">⭐ Recommandé</span>
                </div>
              )}
              <div className="card-body p-5 space-y-4">
                <div>
                  <p className="font-bold text-lg">{plan.label}</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {plan.prix === 0 ? 'Gratuit' : `${plan.prix.toLocaleString('fr-FR')} FCFA`}
                  </p>
                  {plan.jours && <p className="text-xs text-base-content/50">pour {plan.jours} jours</p>}
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.avantages.map(a => (
                    <li key={a} className="flex items-start gap-2 text-sm">
                      <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>

                {plan.prix === 0 ? (
                  !user
                    ? <Link to="/register" className="btn btn-outline btn-sm w-full">Créer un compte</Link>
                    : <button className="btn btn-ghost btn-sm w-full" disabled>Plan actuel</button>
                ) : (
                  user
                    ? <button onClick={() => handleAbonner(plan)} className={`btn btn-sm w-full gap-2 ${plan.recommended ? 'btn-primary' : 'btn-outline'}`}>
                        <Phone size={14} /> Souscrire via T-Money
                      </button>
                    : <Link to="/login" className="btn btn-outline btn-sm w-full">Se connecter</Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comment ça marche */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <h3 className="font-bold mb-4">Comment souscrire ?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                { num: '1', title: 'Choisissez un plan', desc: 'Sélectionnez la durée qui vous convient.' },
                { num: '2', title: 'Payez via T-Money', desc: `Envoyez le montant au ${numero}.` },
                { num: '3', title: 'Activation sous 24h', desc: "L'admin valide et active votre accès." },
              ].map(s => (
                <div key={s.num} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold flex-shrink-0">{s.num}</div>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-base-content/60 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gratuit via upload */}
        <div className="card bg-primary/5 border-2 border-primary/20 shadow-sm">
          <div className="card-body p-5 flex-row items-center gap-4 flex-wrap">
            <div className="p-3 bg-primary/20 rounded-xl"><Upload size={24} className="text-primary" /></div>
            <div className="flex-1">
              <p className="font-bold">Alternative gratuite 💡</p>
              <p className="text-sm text-base-content/70">Uploadez des documents et faites-les valider par l'admin pour gagner <strong>+2 téléchargements</strong> à chaque validation.</p>
            </div>
            <Link to="/upload" className="btn btn-primary btn-sm gap-2"><Upload size={14} /> Uploader maintenant</Link>
          </div>
        </div>
      </div>
    </div>
  )
}