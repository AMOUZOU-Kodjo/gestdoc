import { Shield, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="btn btn-ghost btn-sm gap-2 mb-6">
          <ArrowLeft size={16} /> Retour
        </Link>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-base-200">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Shield size={28} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Politique de Confidentialité</h1>
                <p className="text-sm text-base-content/60 mt-1">Dernière mise à jour : Janvier 2026</p>
              </div>
            </div>

            {[
              {
                title: '1. Collecte des données',
                content: `GestDoc collecte les informations suivantes lors de votre inscription : nom, prénom, adresse email et mot de passe (chiffré). Ces données sont nécessaires pour vous permettre d'accéder aux fonctionnalités de la plateforme, notamment le téléchargement et l'upload de documents.`,
              },
              {
                title: '2. Utilisation des données',
                content: `Vos données personnelles sont utilisées exclusivement pour : la gestion de votre compte, l'affichage de votre historique de téléchargements, la modération des contenus uploadés et la communication relative à votre compte. Nous ne vendons, ne louons et ne partageons jamais vos données avec des tiers à des fins commerciales.`,
              },
              {
                title: '3. Stockage et sécurité',
                content: `Vos données sont stockées sur des serveurs sécurisés (Neon PostgreSQL). Les mots de passe sont hashés avec l'algorithme bcrypt (niveau 12) et ne sont jamais stockés en clair. Les communications entre votre navigateur et nos serveurs sont chiffrées via HTTPS/TLS.`,
              },
              {
                title: '4. Cookies et tokens',
                content: `GestDoc utilise des tokens JWT (JSON Web Tokens) stockés dans le localStorage de votre navigateur pour maintenir votre session. Ces tokens expirent automatiquement après 15 minutes (access token) et 7 jours (refresh token). Nous n'utilisons pas de cookies de tracking ou publicitaires.`,
              },
              {
                title: '5. Documents uploadés',
                content: `Les documents que vous uploadez sont stockés sur Cloudinary (service cloud sécurisé). En uploadant un document, vous certifiez en être l'auteur ou disposer des droits nécessaires pour le partager. GestDoc se réserve le droit de supprimer tout contenu inapproprié ou en violation des droits d'auteur.`,
              },
              {
                title: '6. Vos droits',
                content: `Conformément aux lois en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à l'adresse : contact@gestdoc.tg. Votre demande sera traitée dans un délai de 30 jours.`,
              },
              {
                title: '7. Contact',
                content: `Pour toute question relative à cette politique de confidentialité, vous pouvez nous contacter par email à contact@gestdoc.tg ou par courrier à notre adresse à Lomé, Togo.`,
              },
            ].map((section, i) => (
              <div key={i} className="space-y-2">
                <h2 className="text-lg font-semibold text-primary">{section.title}</h2>
                <p className="text-base-content/80 text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}