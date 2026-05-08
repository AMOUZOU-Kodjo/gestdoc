// src/components/ScientificEditor.jsx
import { useState } from 'react'
import { Sigma, Bold, Italic, Code, Square } from 'lucide-react'

const ScientificEditor = ({ value, onChange, placeholder }) => {
  const [showFormulaHelp, setShowFormulaHelp] = useState(false)

  const insertAtCursor = (text) => {
    const newValue = value + text
    onChange(newValue)
  }

  const formulas = [
    { label: 'Fraction', code: ' $$\\frac{a}{b}$$ ' },
    { label: 'Racine carrée', code: ' $$\\sqrt{x}$$ ' },
    { label: 'Puissance', code: ' $$x^{n}$$ ' },
    { label: 'Somme', code: ' $$\\sum_{i=1}^{n} x_i$$ ' },
    { label: 'Intégrale', code: ' $$\\int_{a}^{b} f(x) dx$$ ' },
    { label: 'Limite', code: ' $$\\lim_{x \\to \\infty} f(x)$$ ' },
  ]

  return (
    <div className="space-y-2">
      {/* Barre d'outils */}
      <div className="flex flex-wrap gap-1 bg-base-200 rounded-lg p-2">
        <button 
          onClick={() => insertAtCursor(' **gras** ')}
          className="btn btn-xs btn-ghost"
          title="Gras"
        >
          <Bold size={14} />
        </button>
        <button 
          onClick={() => insertAtCursor(' *italique* ')}
          className="btn btn-xs btn-ghost"
          title="Italique"
        >
          <Italic size={14} />
        </button>
        <button 
          onClick={() => insertAtCursor(' `code` ')}
          className="btn btn-xs btn-ghost"
          title="Code"
        >
          <Code size={14} />
        </button>
        
        <div className="divider divider-horizontal h-6 mx-1"></div>
        
        {/* Menu des formules */}
        <div className="dropdown dropdown-hover">
          <label tabIndex={0} className="btn btn-xs btn-ghost gap-1">
            <Sigma size={14} /> Formules
          </label>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
            {formulas.map(f => (
              <li key={f.label}>
                <button onClick={() => insertAtCursor(f.code)} className="text-xs">
                  {f.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button 
          onClick={() => setShowFormulaHelp(!showFormulaHelp)}
          className="btn btn-xs btn-ghost"
          title="Aide"
        >
          <Square size={14} /> Aide
        </button>
      </div>

      {/* Zone de saisie */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Rédigez votre message... Utilisez $$formule$$ pour les mathématiques"}
        className="textarea textarea-bordered w-full min-h-[150px] resize-y font-mono text-sm"
        style={{ fontFamily: 'monospace' }}
      />

      {/* Aide */}
      {showFormulaHelp && (
        <div className="alert alert-info text-xs p-2">
          <div className="space-y-1">
            <p className="font-semibold">📐 Exemples de formules :</p>
            <p>• Fraction: <code className="bg-base-300 px-1 rounded">$$\\frac{a}{b}$$</code> → a/b</p>
            <p>• Racine carrée: <code className="bg-base-300 px-1 rounded">$$\\sqrt{x}$$</code> → √x</p>
            <p>• Puissance: <code className="bg-base-300 px-1 rounded">$$x^{n}$$</code> → xⁿ</p>
            <p>• Somme: <code className="bg-base-300 px-1 rounded">$$\\sum_{i=1}^{n} x_i$$</code> → Σ</p>
            <p>• Texte en gras: <code className="bg-base-300 px-1 rounded">**texte**</code></p>
            <p>• Texte en italique: <code className="bg-base-300 px-1 rounded">*texte*</code></p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScientificEditor