// src/components/ScientificContent.jsx
import { useEffect, useRef } from 'react'

const ScientificContent = ({ content }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!content || !containerRef.current) return

    let html = content
    
    // Remplacer les formules LaTeX (entre $$)
    html = html.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      return `<div class="math-formula" style="text-align:center; margin:1rem 0; padding:0.75rem; background:rgba(59,130,246,0.1); border-radius:8px; border-left: 4px solid #3b82f6;">
        <code style="font-family: monospace; font-size: 1.1rem;">${formula}</code>
      </div>`
    })
    
    // Remplacer les formules inline (entre $)
    html = html.replace(/\$([^$]+)\$/g, (match, formula) => {
      return `<code style="background:rgba(59,130,246,0.1); padding:0.2rem 0.4rem; border-radius:4px; font-family: monospace;">${formula}</code>`
    })
    
    // Remplacer le texte en gras
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // Remplacer le texte en italique
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // Remplacer le code
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.1); padding:0.2rem 0.4rem; border-radius:4px;">$1</code>')
    
    containerRef.current.innerHTML = html
  }, [content])

  return (
    <div 
      ref={containerRef}
      className="scientific-content prose prose-sm max-w-none"
      style={{ lineHeight: '1.6', fontFamily: 'inherit' }}
    />
  )
}

export default ScientificContent