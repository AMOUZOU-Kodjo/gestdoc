import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Heart } from 'lucide-react'
import { NIVEAUX } from '../utils/constants'
import api from '../services/api'

// Récupère les settings publics (pas besoin d'auth)
const fetchPublicSettings = () =>
  api.get('/admin/settings').then(r => r.data).catch(() => null)

export default function Footer() {
  const year = new Date().getFullYear()

  const { data: s } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000, // recharge toutes les 5 min
    retry: false,
  })

  // Valeurs dynamiques avec fallback si settings non chargés
  const siteName    = s?.siteName        || 'GestDoc'
  const siteDesc    = s?.siteDescription || 'Plateforme togolaise de partage de documents scolaires et universitaires.'
  const email       = s?.contactEmail    || 'phipsipy@gmail.com'
  const phone       = s?.contactPhone    || '+228 91 03 87 27'
  const address     = s?.contactAddress  || 'Lomé, Togo'

  // Réseaux sociaux — n'afficher que ceux qui ont une URL renseignée
  const socials = [
    { icon: <Facebook  size={16} />, href: s?.facebookUrl,  label: 'Facebook'  },
    { icon: <Twitter   size={16} />, href: s?.twitterUrl,   label: 'Twitter'   },
    { icon: <Instagram size={16} />, href: s?.instagramUrl, label: 'Instagram' },
    { icon: <Youtube   size={16} />, href: s?.youtubeUrl,   label: 'YouTube'   },
  ].filter(soc => soc.href && soc.href.trim() !== '')

  // Si aucun réseau renseigné, afficher quand même les icônes avec href="#"
  const socialsToShow = socials.length > 0 ? socials : [
    { icon: <Facebook  size={16} />, href: '#', label: 'Facebook'  },
    { icon: <Twitter   size={16} />, href: '#', label: 'Twitter'   },
    { icon: <Instagram size={16} />, href: '#', label: 'Instagram' },
    { icon: <Youtube   size={16} />, href: '#', label: 'YouTube'   },
  ]

  return (
    <footer className="bg-neutral text-neutral-content mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Colonne 1 — Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
              <div className="p-2 bg-primary rounded-xl">
                <BookOpen size={20} />
              </div>
              {siteName}
            </Link>
            <p className="text-neutral-content/70 text-sm leading-relaxed">
              {siteDesc}
            </p>
            {/* Réseaux sociaux */}
            <div className="flex gap-2 pt-1">
              {socialsToShow.map(soc => (
                <a
                  key={soc.label}
                  href={soc.href}
                  target={soc.href !== '#' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  aria-label={soc.label}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 2 — Niveaux */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Niveaux</h3>
            <ul className="space-y-2">
              {NIVEAUX.map(n => (
                <li key={n.value}>
                  <Link
                    to={n.route}
                    className="text-neutral-content/70 hover:text-white text-sm flex items-center gap-2 transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 group-hover:opacity-100"></span>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 — Liens utiles */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Liens utiles</h3>
            <ul className="space-y-2">
              {[
                { to: '/',             label: 'Accueil' },
                { to: '/upload',       label: 'Uploader un document' },
                { to: '/register',     label: 'Créer un compte' },
                { to: '/login',        label: 'Se connecter' },
                { to: '/profile',      label: 'Mon profil' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-neutral-content/70 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 — Contact dynamique */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              {address && (
                <li className="flex items-start gap-3 text-sm text-neutral-content/70">
                  <MapPin size={15} className="flex-shrink-0 mt-0.5 text-primary" />
                  <span>{address}</span>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-3 text-sm text-neutral-content/70">
                  <Mail size={15} className="flex-shrink-0 text-primary" />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors truncate">
                    {email}
                  </a>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-3 text-sm text-neutral-content/70">
                  <Phone size={15} className="flex-shrink-0 text-primary" />
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">
                    {phone}
                  </a>
                </li>
              )}
            </ul>

            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-xs text-neutral-content/80">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              Service disponible 24h/24
            </div>
          </div>
        </div>
      </div>

      {/* Barre bas */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-neutral-content/50 text-xs">
            © {year} {siteName}. Tous droits réservés.
          </p>
          <p className="text-neutral-content/50 text-xs flex items-center gap-1">
            Fait avec <Heart size={11} className="text-error fill-error mx-1" /> au Togo
          </p>
          <div className="flex gap-4 text-xs text-neutral-content/50">
            <Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/conditions" className="hover:text-white transition-colors">Conditions d'utilisation</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}