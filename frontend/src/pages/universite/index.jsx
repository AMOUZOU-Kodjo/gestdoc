import NiveauPage from '../../components/NiveauPage'
import { CLASSES_BY_NIVEAU, MATIERES_BY_NIVEAU } from '../../utils/constants'
export default function UniversitePage() {
  return <NiveauPage niveau="UNIVERSITE" title="Université" subtitle="Documents universitaires : L1-L3, Master, BTS, DUT, CPGE" classes={CLASSES_BY_NIVEAU.UNIVERSITE} matieres={MATIERES_BY_NIVEAU.UNIVERSITE} />
}
