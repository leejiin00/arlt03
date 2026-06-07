import { useState } from 'react'

export default function TagInput({ value = [], onChange, placeholder = 'slow burn, angst / mutual pining…' }) {
  const [input, setInput] = useState('')

  function commit(raw) {
    const incoming = raw.split(/[,/\n\t]+/).map(t => t.trim()).filter(Boolean)
    if (!incoming.length) return
    onChange([...new Set([...value, ...incoming])])
    setInput('')
  }

  function handleChange(e) {
    const v = e.target.value
    if (/[,/\n\t]/.test(v)) commit(v)
    else setInput(v)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commit(input) }
    if (e.key === 'Backspace' && input === '' && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  function handlePaste(e) {
    e.preventDefault()

    // Lire le HTML du presse-papier pour extraire les <li> individuellement
    // (AO3 génère les virgules via CSS ::after, elles ne sont pas dans le texte)
    const html = e.clipboardData.getData('text/html')
    if (html) {
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const lis = Array.from(doc.querySelectorAll('li'))
          .map(el => el.textContent.trim()).filter(Boolean)
        if (lis.length > 0) {
          onChange([...new Set([...value, ...lis])])
          setInput('')
          return
        }
      } catch { /* ignore, fallback ci-dessous */ }
    }

    // Fallback : texte brut avec séparateurs classiques
    const text = e.clipboardData.getData('text')
    if (/[,/\n\t]/.test(text)) {
      commit(text)
    } else {
      setInput((input + text).trim())
    }
  }

  function remove(tag) {
    onChange(value.filter(t => t !== tag))
  }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      borderBottom: '1.4px dotted var(--ink)', paddingBottom: 6, minHeight: 36,
    }}>
      {value.map(tag => (
        <span key={tag} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'var(--pinktone)', borderRadius: 2,
          padding: '2px 8px', fontFamily: 'var(--f-hand)', fontSize: 15, color: 'var(--ink)',
        }}>
          {tag}
          <button onClick={() => remove(tag)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, lineHeight: 1, fontSize: 14, opacity: .55, color: 'var(--ink)',
          }}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => input.trim() && commit(input)}
        placeholder={value.length ? '' : placeholder}
        style={{
          flex: 1, minWidth: 120, background: 'transparent', border: 'none',
          fontFamily: 'var(--f-hand)', fontSize: 17, color: 'var(--ink)',
          outline: 'none',
        }}
      />
    </div>
  )
}
