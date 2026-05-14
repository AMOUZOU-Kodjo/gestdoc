import { useState, useRef } from 'react'
import { Sigma, Bold, Italic, Code, Square, List, Quote, Table2, Heading1, Heading2, ListOrdered, Pilcrow } from 'lucide-react'

const formulas = [
  { label: 'Fraction', code: ' $$\\frac{a}{b}$$ ' },
  { label: 'Racine carrée', code: ' $$\\sqrt{x}$$ ' },
  { label: 'Puissance', code: ' $$x^{n}$$ ' },
  { label: 'Indice', code: ' $$x_{i}$$ ' },
  { label: 'Somme', code: ' $$\\sum_{i=1}^{n} x_i$$ ' },
  { label: 'Intégrale', code: ' $$\\int_{a}^{b} f(x) dx$$ ' },
  { label: 'Limite', code: ' $$\\lim_{x \\to \\infty} f(x)$$ ' },
  { label: 'Produit', code: ' $$\\prod_{i=1}^{n} x_i$$ ' },
  { label: 'Alpha', code: ' $$\\alpha$$ ' },
  { label: 'Bêta', code: ' $$\\beta$$ ' },
  { label: 'Delta', code: ' $$\\delta$$ ' },
  { label: 'Pi', code: ' $$\\pi$$ ' },
  { label: 'Thêta', code: ' $$\\theta$$ ' },
  { label: 'Omega', code: ' $$\\omega$$ ' },
  { label: 'Infini', code: ' $$\\infty$$ ' },
  { label: 'Approx', code: ' $$\\approx$$ ' },
  { label: 'Différentiel', code: ' $$\\partial$$ ' },
  { label: 'Vecteur', code: ' $$\\vec{v}$$ ' },
  { label: 'Matrice', code: ' $$\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$$ ' },
]

const ScientificEditor = ({ value, onChange, placeholder, minHeight = '150px' }) => {
  const [showFormulaHelp, setShowFormulaHelp] = useState(false)
  const [showMath, setShowMath] = useState(false)
  const textareaRef = useRef(null)

  const insert = (before, after = '') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.substring(start, end) || before.trim()
    const newVal = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newVal)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const insertAtEnd = (text) => {
    onChange(value + text)
  }

  return (
    <div className="space-y-2">
      {/* Barre d'outils */}
      <div className="flex flex-wrap gap-0.5 bg-base-200 rounded-xl p-1.5 border border-base-300">
        <button onClick={() => insert('**', '**')} className="btn btn-xs btn-ghost btn-square" title="Gras"><Bold size={13} /></button>
        <button onClick={() => insert('*', '*')} className="btn btn-xs btn-ghost btn-square" title="Italique"><Italic size={13} /></button>
        <button onClick={() => insert('`', '`')} className="btn btn-xs btn-ghost btn-square" title="Code"><Code size={13} /></button>

        <div className="divider divider-horizontal h-5 mx-0.5" />

        <button onClick={() => insert('# ', '', true)} className="btn btn-xs btn-ghost btn-square" title="Titre 1"><Heading1 size={13} /></button>
        <button onClick={() => insert('## ', '', true)} className="btn btn-xs btn-ghost btn-square" title="Titre 2"><Heading2 size={13} /></button>
        <button onClick={() => insert('- ', '', true)} className="btn btn-xs btn-ghost btn-square" title="Liste"><List size={13} /></button>
        <button onClick={() => insert('1. ', '', true)} className="btn btn-xs btn-ghost btn-square" title="Liste numérotée"><ListOrdered size={13} /></button>
        <button onClick={() => insert('\n> ', '', true)} className="btn btn-xs btn-ghost btn-square" title="Citation"><Quote size={13} /></button>

        <div className="divider divider-horizontal h-5 mx-0.5" />

        {/* Menu formules mathématiques */}
        <div className="dropdown dropdown-hover">
          <button onClick={() => setShowMath(!showMath)} className="btn btn-xs btn-ghost gap-0.5" title="Formules mathématiques">
            <Sigma size={13} /> <span className="hidden sm:inline text-xs">Math</span>
          </button>
          {showMath && (
            <div className="absolute top-full left-0 mt-1 z-20 w-56 max-h-64 overflow-y-auto bg-base-100 shadow-xl rounded-xl border border-base-300 p-2 grid grid-cols-2 gap-1">
              {formulas.map(f => (
                <button key={f.label} onClick={() => { insertAtEnd(f.code); setShowMath(false) }}
                  className="btn btn-xs btn-ghost justify-start text-xs font-mono truncate">
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowFormulaHelp(!showFormulaHelp)} className="btn btn-xs btn-ghost gap-0.5" title="Aide">
          <Square size={13} /> <span className="hidden sm:inline text-xs">Aide</span>
        </button>
      </div>

      {/* Zone de saisie */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Rédigez votre message...'}
        className="textarea textarea-bordered w-full resize-y font-mono text-sm leading-relaxed"
        style={{ minHeight }}
      />

      {/* Compteur */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3 text-xs text-base-content/40">
          <span>**gras**</span>
          <span>*italique*</span>
          <span>`code`</span>
          <span>$$formule$$</span>
        </div>
        <span className="text-xs text-base-content/40">{value.length} car.</span>
      </div>

      {/* Aide */}
      {showFormulaHelp && (
        <div className="alert bg-base-200 border border-base-300 text-xs p-3 rounded-xl">
          <div className="space-y-1 w-full">
            <p className="font-semibold text-sm">📝 Formatage disponible :</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
              <p><code className="bg-base-300 px-1 rounded">**gras**</code> → <strong>gras</strong></p>
              <p><code className="bg-base-300 px-1 rounded">*italique*</code> → <em>italique</em></p>
              <p><code className="bg-base-300 px-1 rounded">`code`</code> → <code>code</code></p>
              <p><code className="bg-base-300 px-1 rounded"># Titre</code> → Titre (H1)</p>
              <p><code className="bg-base-300 px-1 rounded">## Titre</code> → Titre (H2)</p>
              <p><code className="bg-base-300 px-1 rounded">- liste</code> → Liste à puces</p>
              <p><code className="bg-base-300 px-1 rounded">1. liste</code> → Liste numérotée</p>
              <p><code className="bg-base-300 px-1 rounded">&gt; citation</code> → Citation</p>
              <p><code className="bg-base-300 px-1 rounded">$$\\frac{a}{b}$$</code> → Fraction</p>
              <p><code className="bg-base-300 px-1 rounded">$$\\sqrt{x}$$</code> → √x</p>
              <p><code className="bg-base-300 px-1 rounded">$$x^{n}$$</code> → xⁿ</p>
              <p><code className="bg-base-300 px-1 rounded">$$\\sum$$</code> → Σ</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScientificEditor
