import NiveauPage from '../../components/NiveauPage'
import { CLASSES_BY_NIVEAU, MATIERES_BY_NIVEAU } from '../../utils/constants'
export default function BepcPage() {
  return <NiveauPage niveau="BEPC" title="BEPC — Troisième" subtitle="Documents de classe de 3ème : cours, exercices, annales" classes={CLASSES_BY_NIVEAU.BEPC} matieres={MATIERES_BY_NIVEAU.BEPC} />
}
