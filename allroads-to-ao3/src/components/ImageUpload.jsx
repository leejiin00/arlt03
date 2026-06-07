import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function ImageUpload({ value, onChange, bucket = 'covers' }) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const ext  = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (upErr) {
      setError(upErr.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  function handleRemove() {
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {value ? (
        /* Prévisualisation */
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={value}
            alt="cover"
            style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 2, display: 'block' }}
          />
          <button
            onClick={handleRemove}
            title="supprimer"
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(29,26,22,.7)', color: '#fffaf0',
              border: 'none', borderRadius: '50%',
              width: 24, height: 24, cursor: 'pointer',
              fontFamily: 'var(--f-mono)', fontSize: 14, lineHeight: 1,
            }}
          >×</button>
        </div>
      ) : (
        /* Zone de dépôt / clic */
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: '1.5px dashed rgba(0,0,0,.25)',
            borderRadius: 4,
            padding: '24px 16px',
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'background .15s',
            background: 'rgba(255,255,255,.2)',
          }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = 'rgba(242,151,160,.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)' }}
        >
          <div style={{ fontFamily: 'var(--f-hand)', fontSize: 20, color: 'var(--ink-mute)' }}>
            {uploading ? '⟳ envoi en cours…' : 'cliquer pour importer une image'}
          </div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.15em', color: 'var(--ink-mute)', marginTop: 6 }}>
            JPG · PNG · WEBP
          </div>
        </div>
      )}

      {error && (
        <div className="mono" style={{ fontSize: 9, color: 'var(--primrose)', letterSpacing: '.1em', marginTop: 6 }}>
          ✕ {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  )
}
