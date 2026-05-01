import NiveauPage from '../../components/NiveauPage'
import { CLASSES_BY_NIVEAU, MATIERES_BY_NIVEAU } from '../../utils/constants'
export default function TerminalePage() {
  return <NiveauPage niveau="TERMINALE" title="Lycée — Terminale" subtitle="Documents de Terminale A, C & D : cours, révisions, annales du BAC" classes={CLASSES_BY_NIVEAU.TERMINALE} matieres={MATIERES_BY_NIVEAU.TERMINALE} />
}
