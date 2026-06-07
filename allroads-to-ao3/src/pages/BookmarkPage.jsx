import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Page, Header, Tape, Doodle, PaperClip, RibbonMark, WaveDivider, Sticker, RatingFlower, RatingPeach } from '../components/JournalShared'
import TagInput from '../components/TagInput'
import { supabase } from '../lib/supabase'
import buttImg from '../assets/butt.png'

const BK_RATINGS = [
  { key: 'no_sex',   title: 'Pas de contenu sexuel', icon: (s) => <RatingFlower size={s} /> },
  { key: 'vanilla',  title: 'Contenu vanilla',        icon: (s) => <RatingPeach  size={s} /> },
  { key: 'explicit', title: 'Contenu explicite',       icon: (s) => <img src={buttImg} alt="explicit" style={{ width: s, height: s, objectFit: 'contain' }} /> },
]

const STORAGE_KEY = 'ao3_bookmarks'

const TAGS = ['to read', 'en cours', 'urgent', 'un jour']
const TAG_COLORS = {
  'to read':  'var(--primrose)',
  'en cours': 'var(--lime)',
  'urgent':   'var(--pinktone)',
  'un jour':  'var(--yucca-d)',
}
const TAG_KINDS = {
  'to read': 'check',
  'en cours': 'grid',
  'urgent': 'dots',
  'un jour': 'clean',
}

function strHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h % 360
}

function loadBookmarks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Livre bookmark ─────────────────────────────────────────────────────────────
function BookCard({ b, onRemove, onCoverChange, onRatingChange }) {
  const h = strHue(b.title || b.url || '')
  const hasCover = Boolean(b.image)
  const [hov, setHov] = useState(false)
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await fileToBase64(file)
    onCoverChange(b.id, b64)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position: 'relative',
          transform: hov ? 'translateY(-8px) rotate(0.5deg)' : 'rotate(-0.5deg)',
          transition: 'transform .2s ease',
        }}
      >
        <Tape kind={TAG_KINDS[b.tag]} color={TAG_COLORS[b.tag]} rot={-6}
          style={{ top: -11, left: 18, fontSize: 9, padding: '3px 9px' }}>
          {b.tag}
        </Tape>

        {/* Livre épais */}
        <Link to={`/bookmarks/${b.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            display: 'flex', position: 'relative',
            filter: hov
              ? 'drop-shadow(6px 10px 20px rgba(60,40,20,.38))'
              : 'drop-shadow(3px 6px 12px rgba(60,40,20,.22))',
            transition: 'filter .2s',
          }}>
            {/* Tranche pages (bas) */}
            <div style={{
              position: 'absolute', bottom: -7, left: 24, right: -5, height: 12,
              background: 'repeating-linear-gradient(90deg,#F9D0CE 0,#F9D0CE 1.5px,#f0b0ac 1.5px,#f0b0ac 3px)',
              borderRadius: '0 0 3px 0',
            }} />
            {/* Tranche pages (droite) */}
            <div style={{
              position: 'absolute', top: 4, right: -6, bottom: 0, width: 8,
              background: 'repeating-linear-gradient(180deg,#F9D0CE 0,#F9D0CE 1.5px,#f0b0ac 1.5px,#f0b0ac 3px)',
              borderRadius: '0 3px 3px 0',
            }} />
            {/* Dos épais */}
            <div style={{
              width: 24, flexShrink: 0, borderRadius: '4px 0 0 4px',
              background: `linear-gradient(90deg, #d4827e 0%, #e8a09c 60%, #dc8e8a 100%)`,
              position: 'relative',
            }}>
              {[25, 50, 75].map(pct => (
                <div key={pct} style={{ position: 'absolute', top: `${pct}%`, left: 4, right: 4, height: 1, background: 'rgba(255,255,255,.12)' }} />
              ))}
            </div>
            {/* Couverture */}
            <div style={{
              width: 128, height: 182,
              background: `linear-gradient(160deg, hsl(${h},50%,70%) 0%, hsl(${(h+60)%360},46%,44%) 100%)`,
              borderRadius: '0 3px 3px 0',
              position: 'relative', overflow: 'hidden',
            }}>
              {hasCover && (
                <img src={b.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              )}
              {!hasCover && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-end', padding: '10px 9px',
                  background: 'linear-gradient(to top, rgba(0,0,0,.62) 0%, transparent 55%)',
                }}>
                  <div className="handwriting" style={{ fontSize: 13, color: '#fff', lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {b.title || '(sans titre)'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Bouton upload cover */}
        <button onClick={() => inputRef.current?.click()} title="changer la couverture"
          style={{
            position: 'absolute', bottom: 10, right: 10,
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(255,250,240,.92)', border: '1.2px solid rgba(29,26,22,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.18)',
            opacity: hov ? 1 : 0, transition: 'opacity .15s',
            fontSize: 13, lineHeight: 1,
          }}>📷</button>

        {/* Bouton supprimer */}
        <button onClick={() => onRemove(b.id)} title="supprimer"
          style={{
            position: 'absolute', top: 6, right: -2,
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,250,240,.88)', border: '1.2px solid rgba(29,26,22,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,.14)',
            opacity: hov ? 1 : 0, transition: 'opacity .15s',
            fontSize: 12, fontFamily: 'var(--f-mono)', color: 'var(--ink-mute)',
          }}>×</button>

        <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      {/* Titre + boutons rating sous le livre */}
      <div style={{ textAlign: 'center', maxWidth: 152 }}>
        <div className="handwriting" style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.2, wordBreak: 'break-word' }}>
          {b.title || '(sans titre)'}
        </div>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 7 }}>
          {BK_RATINGS.map(r => {
            const active = b.content_rating === r.key
            return (
              <button key={r.key} title={r.title}
                onClick={() => onRatingChange?.(b.id, active ? null : r.key)}
                style={{
                  width: 26, height: 26, borderRadius: '50%', padding: 3,
                  border: active ? '2px solid var(--ink)' : '1.5px solid rgba(29,26,22,.18)',
                  background: active ? 'rgba(255,250,240,.98)' : 'rgba(255,250,240,.65)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 2px 6px rgba(0,0,0,.15)' : 'none',
                  opacity: !b.content_rating || active ? 1 : 0.4,
                  transition: 'all .15s',
                }}>
                {r.icon(15)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState(loadBookmarks)
  const [form, setForm] = useState({ title: '', url: '', note: '', tag: 'to read', tags: [], image: '', content_rating: null })
  const [filterRating, setFilterRating] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [session, setSession] = useState(undefined) // undefined = chargement en cours
  const formImgRef = useRef()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  }, [bookmarks])

  async function handleFormImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await fileToBase64(file)
    setForm(f => ({ ...f, image: b64 }))
    e.target.value = ''
  }

  function addBookmark() {
    if (!form.url.trim()) return
    setBookmarks(prev => [{ ...form, id: Date.now(), date: new Date().toLocaleDateString('fr-FR') }, ...prev])
    setForm({ title: '', url: '', note: '', tag: 'to read', tags: [], image: '', content_rating: null })
    setShowForm(false)
  }

  function setBookmarkRating(id, rating) {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, content_rating: rating } : b))
  }

  function remove(id) {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  function changeCover(id, b64) {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, image: b64 } : b))
  }

  const visibleBookmarks = filterRating
    ? bookmarks.filter(b => b.content_rating === filterRating)
    : bookmarks

  return (
    <Page>
      <Header active="bookmarks" />

      <div style={{ padding: '88px 56px 56px' }}>

        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <RibbonMark color="var(--primrose)" h={64} w={24} rot={-4} style={{ marginBottom: 6, flexShrink: 0 }} />
            <div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>SECTION C</div>
              <div className="heading-handwritten" style={{ fontSize: 'clamp(52px, 7vw, 88px)', color: 'var(--ink)', display: 'inline-block', marginTop: 4 }}>
                A lire :
              </div>
            </div>
            <PaperClip size={22} rot={15} style={{ marginBottom: 14, flexShrink: 0 }} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', alignSelf: 'flex-end', marginBottom: 8, flexWrap: 'wrap' }}>
            {/* Filtres rating */}
            {BK_RATINGS.map(r => (
              <button key={r.key} title={r.title}
                onClick={() => setFilterRating(p => p === r.key ? null : r.key)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', padding: 4,
                  border: filterRating === r.key ? '2px solid var(--ink)' : '1.5px solid rgba(29,26,22,.2)',
                  background: filterRating === r.key ? 'rgba(255,250,240,.98)' : 'rgba(255,250,240,.65)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: filterRating === r.key ? '0 2px 8px rgba(0,0,0,.15)' : 'none',
                  opacity: filterRating && filterRating !== r.key ? 0.4 : 1,
                  transition: 'all .15s',
                }}>
                {r.icon(18)}
              </button>
            ))}
            {session === undefined ? null : session ? (
              <button onClick={() => setShowForm(v => !v)} className="btn-stamp" style={{ marginBottom: 0 }}>
                {showForm ? '× annuler' : '+ ajouter'}
              </button>
            ) : (
              <a href="/login" className="btn-stamp btn-stamp--ghost" style={{ fontSize: 12 }}>
                connexion pour ajouter
              </a>
            )}
          </div>
        </div>

        <WaveDivider width={320} style={{ marginBottom: 24, opacity: .7 }} />

        {/* Formulaire */}
        {showForm && (
          <div className="card" style={{ padding: '28px 28px 22px', marginBottom: 40, transform: 'rotate(-0.4deg)', position: 'relative' }}>
            <Tape kind="dots" color="var(--primrose)" rot={-2} style={{ top: -13, left: 44, fontSize: 11, padding: '4px 12px' }}>
              nouveau marque-page
            </Tape>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginTop: 12 }}>
              {[
                { key: 'title', label: 'TITRE', placeholder: 'nom de la fic...', font: 'var(--f-hand)', size: 20 },
                { key: 'url',   label: 'LIEN',  placeholder: 'https://archiveofourown.org/...', font: 'var(--f-mono)', size: 11 },
                { key: 'note',  label: 'NOTE',  placeholder: 'recommande par, pairing, tags...', font: 'var(--f-hand)', size: 18 },
              ].map(({ key, label, placeholder, font, size }) => (
                <div key={key} style={key === 'note' ? { gridColumn: '1 / -1' } : {}}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 5 }}>{label}</div>
                  <input
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1.4px ${key === 'note' ? 'dotted' : 'solid'} var(--ink)`, fontFamily: font, fontSize: size, color: 'var(--ink)', outline: 'none', paddingBottom: 4 }}
                  />
                </div>
              ))}

              <div style={{ gridColumn: '1 / -1' }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 5 }}>TAGS</div>
                <TagInput value={form.tags} onChange={tags => setForm(f => ({ ...f, tags }))} />
              </div>

              {/* Cover + Priorité */}
              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 5 }}>PRIORITE</div>
                <select
                  value={form.tag}
                  onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1.4px solid var(--ink)', fontFamily: 'var(--f-hand)', fontSize: 18, color: 'var(--ink)', outline: 'none', paddingBottom: 4, cursor: 'pointer', width: '100%' }}
                >
                  {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 5 }}>COVER DU LIVRE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {form.image && (
                    <div style={{ width: 36, height: 50, backgroundImage: `url(${form.image})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 2, flexShrink: 0 }} />
                  )}
                  <button type="button" onClick={() => formImgRef.current?.click()}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1.4px solid var(--ink)', fontFamily: 'var(--f-hand)', fontSize: 16, color: 'var(--ink)', outline: 'none', cursor: 'pointer', paddingBottom: 4 }}>
                    {form.image ? '✓ image choisie — changer' : '+ importer une image…'}
                  </button>
                  {form.image && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-mute)', padding: 0 }}>×</button>
                  )}
                </div>
                <input ref={formImgRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleFormImage} style={{ display: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={addBookmark} className="btn-stamp">ajouter ✦</button>
            </div>
          </div>
        )}

        {/* Liste vide */}
        {bookmarks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              <Doodle kind="flower" size={44} color="var(--pinktone)" />
              <Doodle kind="heart" size={32} color="#F297A0" style={{ marginBottom: 8, alignSelf: 'flex-end' }} />
              <Doodle kind="flower" size={36} color="var(--yucca)" />
            </div>
            <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>
              ta liste est vide pour instant...
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.2em', marginTop: 10, color: 'var(--ink-mute)' }}>
              ajoute ta premiere fic a lire ↑
            </div>
          </div>
        )}

        {/* Grille de livres */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '52px 28px', alignItems: 'start' }}>
          {visibleBookmarks.map(b => (
            <BookCard key={b.id} b={b} onRemove={remove} onCoverChange={changeCover} onRatingChange={setBookmarkRating} />
          ))}
        </div>

      </div>

      {/* Decoratifs */}
      <Sticker kind="lotus" size={88}  rot={-10} style={{ position: 'absolute', top: 72, right: 44, opacity: .65 }} />
      <Sticker kind="shrub" size={95}  rot={6}   style={{ position: 'absolute', bottom: 70, left: 40, opacity: .6 }} />
      <div className="floral-corner floral-corner--br" style={{ opacity: .5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 24, right: 60, fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)', pointerEvents: 'none' }}>
        - 03 / 05 -
      </div>
    </Page>
  )
}
