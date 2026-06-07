import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page, Header, Tape, Doodle, Sticker } from '../components/JournalShared'

const STORAGE_KEY = 'ao3_bookmarks'
const TAG_COLORS = {
  'to read':  'var(--primrose)',
  'en cours': 'var(--lime)',
  'urgent':   'var(--pinktone)',
  'un jour':  'var(--yucca-d)',
}

function strHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h % 360
}

function loadBookmark(id) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return all.find(b => String(b.id) === String(id)) ?? null
  } catch { return null }
}

export default function BookmarkDetailPage() {
  const { id } = useParams()
  const [b] = useState(() => loadBookmark(id))

  if (!b) return (
    <Page>
      <Header active="bookmarks" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>marque-page introuvable…</div>
        <Link to="/bookmarks" className="btn-stamp">← retour à la liste</Link>
      </div>
    </Page>
  )

  const h = strHue(b.title || b.url || '')
  const tagColor = TAG_COLORS[b.tag] ?? 'var(--primrose)'

  return (
    <Page>
      <Header active="bookmarks" />

      <div style={{ padding: '88px 56px 56px' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap', marginBottom: 48 }}>

          {/* Livre épais */}
          <div style={{ position: 'relative', flexShrink: 0, transform: 'rotate(-2deg)' }}>
            <Tape kind="dots" color={tagColor} rot={-5} style={{ top: -12, left: 18, fontSize: 9, padding: '3px 10px' }}>
              {b.tag}
            </Tape>
            <div style={{ display: 'flex', filter: 'drop-shadow(0 14px 28px rgba(60,40,20,.28))' }}>
              {/* Pages bas (tranche) */}
              <div style={{ position: 'absolute', bottom: -6, left: 22, right: -4, height: 10,
                background: `repeating-linear-gradient(90deg, #F9D0CE 0px, #F9D0CE 1px, #f0b0ac 1px, #f0b0ac 2px)`,
                borderRadius: '0 0 3px 0',
              }} />
              {/* Dos épais */}
              <div style={{ width: 26, background: `linear-gradient(180deg, #d4827e 0%, #dc8e8a 100%)`, flexShrink: 0, position: 'relative', borderRadius: '3px 0 0 3px' }}>
                {/* Lignes du dos */}
                {[20, 50, 80].map(pct => (
                  <div key={pct} style={{ position: 'absolute', top: `${pct}%`, left: 4, right: 4, height: 1, background: 'rgba(255,255,255,.15)' }} />
                ))}
              </div>
              {/* Couverture */}
              <div style={{
                width: 200, height: 280,
                background: `linear-gradient(160deg, hsl(${h},50%,70%) 0%, hsl(${(h+60)%360},46%,44%) 100%)`,
                position: 'relative', overflow: 'hidden',
                borderRadius: '0 4px 4px 0',
              }}>
                {b.image && (
                  <img src={b.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                )}
                {!b.image && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-end', padding: '16px 14px',
                    background: 'linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 55%)',
                  }}>
                    <div className="handwriting" style={{ fontSize: 20, color: '#fff', lineHeight: 1.2, wordBreak: 'break-word' }}>
                      {b.title || '(sans titre)'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 8 }}>
              À LIRE
            </div>
            <div className="heading-handwritten" style={{ fontSize: 'clamp(32px, 5vw, 60px)', color: 'var(--ink)', lineHeight: .95, marginBottom: 20 }}>
              {b.title || '(sans titre)'}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
              <span style={{
                fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '.15em',
                color: 'var(--ink)', background: tagColor,
                borderRadius: 20, padding: '3px 12px',
              }}>{b.tag}</span>
              {b.date && (
                <span className="mono" style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--ink-mute)' }}>
                  · ajouté le {b.date}
                </span>
              )}
            </div>

            {b.note && (
              <div className="card" style={{ padding: '18px 22px', marginBottom: 20, position: 'relative', transform: 'rotate(0.3deg)' }}>
                <Tape kind="clean" color="var(--yucca)" rot={-1} style={{ top: -11, left: 32, fontSize: 9, padding: '2px 10px' }}>note</Tape>
                <div className="handwriting" style={{ fontSize: 17, color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: 1.6, marginTop: 6 }}>
                  {b.note}
                </div>
              </div>
            )}

            {b.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {b.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: 'var(--f-hand)', fontSize: 14,
                    background: 'var(--pinktone)', borderRadius: 20,
                    padding: '3px 12px', color: 'var(--ink)',
                  }}>{t}</span>
                ))}
              </div>
            )}

            {b.url && (
              <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn-stamp" style={{ padding: '14px 24px', fontSize: 14 }}>
                  lire sur AO3 ↗
                </button>
              </a>
            )}
          </div>
        </div>

        {/* Nav bas */}
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/bookmarks" className="btn-stamp btn-stamp--ghost">← retour à la liste</Link>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>─ à lire ─</span>
        </div>
      </div>

      <Sticker kind="tulips"      size={80} rot={12}  style={{ position: 'absolute', bottom: 80, right: 32, opacity: .55 }} />
      <Sticker kind="flowers_small" size={72} rot={-8} style={{ position: 'absolute', bottom: 90, right: 140, opacity: .5 }} />
      <div className="floral-corner" style={{ opacity: .5, pointerEvents: 'none' }} />
    </Page>
  )
}
