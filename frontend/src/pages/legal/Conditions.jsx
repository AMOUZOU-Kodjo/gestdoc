import { FileText, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Conditions() {
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
              <div className="p-3 bg-secondary/10 rounded-2xl">
                <FileText size={28} className="text-secondary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Conditions d'Utilisation</h1>
                <p className="text-sm text-base-content/60 mt-1">Dernière mise à jour : Janvier 2026</p>
              </div>
            </div>

            {[
              {
                title: '1. Acceptation des conditions',
                content: `En accédant à GestDoc et en utilisant ses services, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.`,
              },
              {
                title: '2. Description du service',
                content: `GestDoc est une plateforme en ligne permettant le partage de documents pédagogiques (cours, exercices, annales) destinés aux élèves du secondaire et aux étudiants du supérieur. L'accès à la plateforme est gratuit après création d'un compte.`,
              },
              {
                title: '3. Création de compte',
                content: `Pour utiliser les fonctionnalités de téléchargement et d'upload, vous devez créer un compte avec des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées depuis votre compte.`,
              },
              {
                title: '4. Règles de publication',
                content: `En uploadant un document, vous vous engagez à : (a) être l'auteur du document ou disposer des droits nécessaires pour le diffuser, (b) ne pas publier de contenu illégal, offensant ou trompeur, (c) ne pas publier de documents protégés par des droits d'auteur sans autorisation. Tout document soumis est modéré avant publication.`,
              },
              {
                title: '5. Droits de propriété intellectuelle',
                content: `Les documents partagés sur GestDoc restent la propriété de leurs auteurs. En publiant un document, vous accordez à GestDoc une licence non exclusive pour l'héberger et le diffuser aux utilisateurs de la plateforme. GestDoc respecte les droits d'auteur et supprimera tout contenu signalé comme en violation.`,
              },
              {
                title: '6. Comportement des utilisateurs',
                content: `Il est interdit d'utiliser GestDoc pour : diffuser des contenus à caractère pornographique, violent ou haineux, tenter de pirater ou compromettre la sécurité de la plateforme, créer de faux comptes ou usurper l'identité d'autrui, utiliser des bots ou scripts automatisés sans autorisation.`,
              },
              {
                title: '7. Suspension et résiliation',
                content: `GestDoc se réserve le droit de suspendre ou supprimer tout compte qui violerait les présentes conditions, sans préavis ni remboursement. L'utilisateur peut demander la suppression de son compte à tout moment en contactant contact@gestdoc.tg.`,
              },
              {
                title: '8. Limitation de responsabilité',
                content: `GestDoc s'efforce d'assurer la disponibilité et la qualité des services, mais ne peut garantir un service ininterrompu. GestDoc ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme.`,
              },
              {
                title: '9. Modifications des conditions',
                content: `GestDoc se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des modifications importantes par email ou notification sur la plateforme. L'utilisation continue du service après modification vaut acceptation des nouvelles conditions.`,
              },
              {
                title: '10. Droit applicable',
                content: `Les présentes conditions sont régies par le droit togolais. Tout litige relatif à l'utilisation de GestDoc sera soumis à la juridiction compétente de Lomé, Togo.`,
              },
            ].map((section, i) => (
              <div key={i} className="space-y-2">
                <h2 className="text-lg font-semibold text-secondary">{section.title}</h2>
                <p className="text-base-content/80 text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}