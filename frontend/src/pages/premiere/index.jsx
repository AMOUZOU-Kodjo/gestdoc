import NiveauPage from '../../components/NiveauPage'
import { CLASSES_BY_NIVEAU, MATIERES_BY_NIVEAU } from '../../utils/constants'
export default function PremierePage() {
  return <NiveauPage niveau="PREMIERE" title="Lycée — Première" subtitle="Documents de Première A, C & D : cours, exercices, annales" classes={CLASSES_BY_NIVEAU.PREMIERE} matieres={MATIERES_BY_NIVEAU.PREMIERE} />
}
