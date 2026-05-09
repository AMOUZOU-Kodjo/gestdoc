import { useQuery, useMutation } from '@tanstack/react-query'
import { Crown, Upload, Download, Check, Phone, Star, Clock, Zap, Shield, TrendingUp, MessageCircle, Smartphone, Key, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import api from '../services/api'
import { useState } from 'react'

const fetchSettings = () => api.get('/admin/settings').then(r => r.data).catch(() => null)

// Mutation pour traiter le paiement mobile
const processMobilePayment = async (paymentData) => {
  const response = await api.post('/payments/mobile', paymentData)
  return response.data
}

const PLANS = [
  { 
    id: 'free',
    label: 'Gratuit', 
    prix: 0, 
    jours: null, 
    icon: Zap,
    gradient: 'from-gray-50 to-gray-100',
    badge: 'Démarrage',
    avantages: ['2 téléchargements gratuits', '+2 par document validé', 'Accès au forum', 'Upload de documents'] 
  },
  { 
    id: 'weekly',
    label: '1 Semaine', 
    prix: 500, 
    jours: 7, 
    code: 'WEEK001',
    icon: Clock,
    gradient: 'from-blue-50 to-cyan-50',
    badge: 'Essai',
    avantages: ['Téléchargements illimités', 'Accès à tous les niveaux', 'Accès au forum', 'Upload illimité'], 
    recommended: false 
  },
  { 
    id: 'monthly',
    label: '1 Mois', 
    prix: 1500, 
    jours: 30, 
    code: 'MONTH001',
    icon: Crown,
    gradient: 'from-primary/10 to-secondary/10',
    badge: 'Populaire',
    avantages: ['Téléchargements illimités', 'Accès à tous les niveaux', 'Accès au forum', 'Upload illimité', 'Support prioritaire'], 
    recommended: true 
  },
  { 
    id: 'quarterly',
    label: '3 Mois', 
    prix: 4000, 
    jours: 90, 
    code: 'QUART001',
    icon: TrendingUp,
    gradient: 'from-purple-50 to-pink-50',
    badge: 'Économie',
    avantages: ['Téléchargements illimités', 'Accès à tous les niveaux', 'Accès au forum', 'Upload illimité', 'Support prioritaire', 'Économisez 11%'] 
  },
]

export default function Abonnement() {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pinCode, setPinCode] = useState(['', '', '', ''])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState('form') // form, processing, success, error
  const [errorMessage, setErrorMessage] = useState('')

  const { data: quota, isLoading: quotaLoading } = useQuery({
    queryKey: ['myQuota'],
    queryFn: () => usersApi.quota().then(r => r.data),
    enabled: !!user,
  })

  const { data: settings } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: fetchSettings,
  })

  const paymentMutation = useMutation({
    mutationFn: processMobilePayment,
    onSuccess: (data) => {
      setPaymentStep('success')
      // Recharger les données du quota après succès
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    },
    onError: (error) => {
      setPaymentStep('error')
      setErrorMessage(error.response?.data?.message || 'Le paiement a échoué. Vérifiez votre code ou solde.')
      setTimeout(() => {
        setPaymentStep('form')
        setErrorMessage('')
      }, 3000)
    }
  })

  const numero = settings?.donNumero || '+228 70 85 59 01'
  const nom = settings?.donNom || 'AMOUZOU Kodjo'

  const handleAbonner = (plan) => {
    if (plan.prix === 0) return
    setSelectedPlan(plan)
    setPhoneNumber('')
    setPinCode(['', '', '', ''])
    setPaymentStep('form')
    setShowPaymentModal(true)
  }

  const handlePinChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pinCode]
      newPin[index] = value
      setPinCode(newPin)
      
      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }

  const handleSubmitPayment = (e) => {
    e.preventDefault()
    
    if (!phoneNumber || phoneNumber.length < 8) {
      setErrorMessage('Numéro de téléphone invalide')
      return
    }
    
    const pin = pinCode.join('')
    if (pin.length !== 4) {
      setErrorMessage('Code PIN invalide (4 chiffres requis)')
      return
    }
    
    setPaymentStep('processing')
    setErrorMessage('')
    
    paymentMutation.mutate({
      planId: selectedPlan.id,
      planCode: selectedPlan.code,
      phoneNumber: phoneNumber,
      pinCode: pin,
      amount: selectedPlan.prix,
      userId: user?.id,
      userEmail: user?.email
    })
  }

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.startsWith('228')) {
      return cleaned.slice(0, 12)
    }
    return cleaned.slice(0, 8)
  }

  const getPricePerDay = (prix, jours) => {
    if (!jours) return null
    return (prix / jours).toFixed(0)
  }

  const closeModal = () => {
    setShowPaymentModal(false)
    setSelectedPlan(null)
    setPhoneNumber('')
    setPinCode(['', '', '', ''])
    setPaymentStep('form')
    setErrorMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-warning/20 rounded-full blur-xl"></div>
              <div className="relative p-4 bg-gradient-to-br from-warning/20 to-warning/5 rounded-2xl shadow-lg">
                <Crown size={48} className="text-warning animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Abonnements GestDoc
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Abonnez-vous en quelques secondes via T-Money ou Moov Money
          </p>
        </div>

        {/* Statut actuel */}
        {user && quota && !quotaLoading && (
          <div className="animate-fade-in-up animation-delay-100">
            <div className={`card shadow-xl transition-all duration-300 hover:shadow-2xl ${quota.unlimited ? 'bg-gradient-to-r from-success/10 to-success/5 border-2 border-success' : 'bg-base-100'}`}>
              <div className="card-body p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Crown size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Votre situation actuelle</h3>
                      <p className="text-sm text-base-content/60">Statut de votre compte</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200">
                      <Download size={16} className="text-primary" />
                      {quota.unlimited ? (
                        <span className="text-success font-semibold flex items-center gap-1">
                          <Check size={14} /> Téléchargements illimités
                        </span>
                      ) : (
                        <span>
                          <strong>{quota.used}</strong> / <strong>{quota.totalAllowed}</strong> téléchargements
                          <span className="text-base-content/60 ml-1">({quota.remaining} restants)</span>
                        </span>
                      )}
                    </div>
                    {quota.hasSubscription && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10">
                        <Crown size={16} className="text-warning" />
                        <span>Actif jusqu'au <strong>{new Date(quota.subscription.fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up animation-delay-200">
          {PLANS.map((plan, index) => (
            <div 
              key={plan.label} 
              className={`group relative card bg-gradient-to-br ${plan.gradient} shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${plan.recommended ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.recommended && (
                <div className="absolute -top-3 -right-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-md opacity-50 rounded-full"></div>
                    <div className="relative bg-primary text-primary-content px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Star size={12} fill="currentColor" /> Recommandé
                    </div>
                  </div>
                </div>
              )}
              
              <div className="absolute top-4 left-4">
                <span className="badge badge-sm bg-white/50 backdrop-blur-sm border-0 shadow-sm">
                  {plan.badge}
                </span>
              </div>

              <div className="card-body p-6 space-y-4">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-2xl bg-white/50 backdrop-blur-sm shadow-md group-hover:scale-110 transition-transform duration-300">
                      <plan.icon size={32} className={`${plan.recommended ? 'text-primary' : 'text-base-content/70'}`} />
                    </div>
                  </div>
                  <p className="font-bold text-xl">{plan.label}</p>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-primary">
                      {plan.prix === 0 ? 'Gratuit' : `${plan.prix.toLocaleString('fr-FR')} FCFA`}
                    </p>
                    {plan.jours && (
                      <>
                        <p className="text-xs text-base-content/50">pour {plan.jours} jours</p>
                        <p className="text-xs text-success font-semibold mt-1">
                          Soit {getPricePerDay(plan.prix, plan.jours)} FCFA/jour
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="divider my-2"></div>

                <ul className="space-y-2 flex-1">
                  {plan.avantages.map(avantage => (
                    <li key={avantage} className="flex items-start gap-2 text-sm">
                      <div className="p-0.5 rounded-full bg-success/20 mt-0.5">
                        <Check size={12} className="text-success" />
                      </div>
                      <span className="text-base-content/80">{avantage}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  {plan.prix === 0 ? (
                    !user ? (
                      <Link to="/register" className="btn btn-outline w-full gap-2 group-hover:gap-3 transition-all">
                        Créer un compte <span>→</span>
                      </Link>
                    ) : (
                      <button className="btn btn-ghost w-full" disabled>
                        <Check size={16} /> Plan actuel
                      </button>
                    )
                  ) : (
                    user ? (
                      <button 
                        onClick={() => handleAbonner(plan)} 
                        className={`btn w-full gap-2 transition-all duration-300 ${plan.recommended ? 'btn-primary shadow-lg hover:shadow-xl' : 'btn-outline'} group-hover:gap-3`}
                      >
                        <Smartphone size={16} /> Payer maintenant
                      </button>
                    ) : (
                      <Link to="/login" className="btn btn-outline w-full gap-2">
                        Se connecter pour payer
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Support info */}
        <div className="text-center text-sm text-base-content/60 animate-fade-in-up animation-delay-300">
          <div className="flex items-center justify-center gap-2">
            <Shield size={14} />
            <span>Paiement 100% sécurisé via T-Money</span>
          </div>
        </div>
      </div>

      {/* Modal de paiement mobile */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="card bg-base-100 max-w-md w-full shadow-2xl animate-scale-in overflow-hidden">
            {paymentStep === 'form' && (
              <div className="card-body p-6">
                <div className="text-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full inline-flex mb-3">
                    <Smartphone size={32} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">Paiement Mobile</h3>
                  <p className="text-sm text-base-content/60 mt-1">
                    Plan {selectedPlan.label} - {selectedPlan.prix.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>

                <form onSubmit={handleSubmitPayment} className="space-y-5">
                  {/* Numéro de téléphone */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <Phone size={14} /> Numéro T-Money/Moov
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-base-content/40 text-sm">+228</span>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                        placeholder="70 85 59 01"
                        className="input input-bordered w-full pl-16"
                        required
                        autoFocus
                      />
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/50">
                        Entrez votre numéro sans l'indicateur +228
                      </span>
                    </label>
                  </div>

                  {/* Code PIN */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <Key size={14} /> Code secret (PIN)
                      </span>
                    </label>
                    <div className="flex gap-3 justify-center">
                      {pinCode.map((digit, index) => (
                        <input
                          key={index}
                          id={`pin-${index}`}
                          type="password"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handlePinChange(index, e.target.value)}
                          className="input input-bordered w-14 h-14 text-center text-xl font-bold"
                          inputMode="numeric"
                          pattern="\d*"
                          required
                        />
                      ))}
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/50">
                        Code à 4 chiffres reçu par SMS
                      </span>
                    </label>
                  </div>

                  {errorMessage && (
                    <div className="alert alert-error shadow-lg text-sm">
                      <AlertCircle size={16} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="modal-action flex gap-3 mt-6">
                    <button type="button" onClick={closeModal} className="btn btn-ghost flex-1">
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-primary flex-1 gap-2">
                      <Lock size={14} /> Payer {selectedPlan.prix.toLocaleString('fr-FR')} FCFA
                    </button>
                  </div>
                </form>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="card-body p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="loading loading-spinner loading-lg text-primary"></div>
                  <h3 className="font-bold text-xl">Traitement en cours...</h3>
                  <p className="text-sm text-base-content/60">
                    Nous vérifions votre paiement auprès de T-Money
                  </p>
                  <p className="text-xs text-base-content/40 mt-2">
                    Ne fermez pas cette fenêtre
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="card-body p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                    <Check size={40} className="text-success" />
                  </div>
                  <h3 className="font-bold text-xl text-success">Paiement réussi !</h3>
                  <p className="text-sm text-base-content/70">
                    Votre abonnement {selectedPlan.label} a été activé avec succès.
                  </p>
                  <p className="text-xs text-base-content/50 mt-2">
                    Redirection en cours...
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'error' && (
              <div className="card-body p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center">
                    <AlertCircle size={40} className="text-error" />
                  </div>
                  <h3 className="font-bold text-xl text-error">Paiement échoué</h3>
                  <p className="text-sm text-base-content/70">
                    {errorMessage}
                  </p>
                  <button onClick={() => setPaymentStep('form')} className="btn btn-primary mt-4">
                    Réessayer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .animation-delay-100 {
          animation-delay: 100ms;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}