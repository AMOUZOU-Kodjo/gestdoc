import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const ScientificContent = ({ content }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!content || !containerRef.current) return

    const mathFragments = []
    let placeholderIdx = 0

    let html = content

    // 1. Rendu des formules LaTeX block ($$...$$) avec KaTeX
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
      const key = `¢MATH${placeholderIdx++}¢`
      try {
        mathFragments[key] = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
        })
      } catch {
        mathFragments[key] = `<div class="math-block">${formula.trim()}</div>`
      }
      return key
    })

    // 2. Rendu des formules LaTeX inline ($...$) avec KaTeX
    html = html.replace(/\$([^$\n]+?)\$/g, (_, formula) => {
      const key = `¢MATH${placeholderIdx++}¢`
      try {
        mathFragments[key] = katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
        })
      } catch {
        mathFragments[key] = `<span class="math-inline">${formula.trim()}</span>`
      }
      return key
    })

    // 3. Échapper le HTML dans le reste du contenu
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // 4. Traitement Markdown
    html = html
      // Titres
      .replace(/^### (.+)$/gm, '<h3 class="forum-h3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="forum-h2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="forum-h1">$1</h1>')
      // Citations
      .replace(/^&gt; (.+)$/gm, '<blockquote class="forum-quote">$1</blockquote>')
      // Listes ordonnées
      .replace(/^\d+\. (.+)$/gm, '<li class="forum-li">$1</li>')
      .replace(/(<li class="forum-li">.*<\/li>\n?)+/g, '<ol class="forum-ol">$&</ol>')
      // Listes non ordonnées
      .replace(/^- (.+)$/gm, '<li class="forum-li">$1</li>')
      .replace(/(<li class="forum-li">.*<\/li>\n?)+/g, (match) => {
        if (match.includes('<ol')) return match
        return '<ul class="forum-ul">' + match + '</ul>'
      })
      // Gras et italique
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Code inline
      .replace(/`([^`]+)`/g, '<code class="forum-code">$1</code>')
      // Sauts de ligne
      .replace(/\n\n/g, '</p><p class="forum-p">')
      .replace(/\n/g, '<br>')

    // 5. Restaurer les formules rendues par KaTeX
    html = html.replace(/¢MATH(\d+)¢/g, (_, n) => mathFragments[`¢MATH${n}¢`] || '')

    containerRef.current.innerHTML = '<p class="forum-p">' + html + '</p>'

    // Nettoyage
    const clean = () => {
      const el = containerRef.current
      if (!el) return
      el.querySelectorAll('p:empty').forEach(p => p.remove())
      el.querySelectorAll('p').forEach(p => {
        const child = p.firstElementChild
        if (child && /^(UL|OL|H[1-3]|BLOCKQUOTE)$/i.test(child.tagName)) {
          p.replaceWith(child)
        }
      })
    }
    clean()
  }, [content])

  return (
    <div
      ref={containerRef}
      className="forum-content"
    />
  )
}

export default ScientificContent
