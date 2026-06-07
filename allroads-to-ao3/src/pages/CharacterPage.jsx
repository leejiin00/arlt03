import { useState, useEffect, useRef } from 'react'
import { Page, Header, Tape, Doodle, Sticker, WaveDivider, RibbonMark } from '../components/JournalShared'
import { supabase } from '../lib/supabase'

const BUCKET = 'character-portraits'

/* ── Utils ── */
function strHue(s = '') { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffff; return h }

const FICHE_TYPES = [
  { key: 'personnage', label: 'Personnages',    emoji: '✩',   col: '#f9c5d5' },
  { key: 'cadre',      label: 'Cadres',         emoji: '⛾',  col: '#b8d4f0' },
  { key: 'plot',       label: 'Plot',           emoji: '☆彡', col: '#f0d8a8' },
  { key: 'structure',  label: 'Structure',      emoji: '∴',   col: '#c8e8c4' },
  { key: 'idees',      label: 'Idées diverses', emoji: '꙳',   col: '#f0e4a8' },
]

function parseNotes(notes) {
  if (!notes) return { type: 'personnage', sections: [] }
  try {
    const p = JSON.parse(notes)
    if (Array.isArray(p)) return { type: 'personnage', sections: p }   // rétrocompat
    return { type: p.t ?? 'personnage', sections: Array.isArray(p.s) ? p.s : [] }
  } catch {}
  return { type: 'personnage', sections: [] }
}

function serializeNotes(type, sections) {
  if (type === 'personnage') return JSON.stringify(sections)  // rétrocompat
  return JSON.stringify({ t: type, s: sections })
}

function getType(char) { return parseNotes(char?.notes ?? '').type }

const FANDOM_PALETTE = [
  { bg: '#fde8ee', tab: '#e07898' },
  { bg: '#eaf5e8', tab: '#6aaa5a' },
  { bg: '#e8f0fd', tab: '#5588d4' },
  { bg: '#fdf7e0', tab: '#d4a840' },
  { bg: '#f2e8fd', tab: '#8858d0' },
  { bg: '#e0f5f8', tab: '#4ab4c8' },
  { bg: '#fdeae8', tab: '#d46858' },
  { bg: '#e8fdef', tab: '#4aaa80' },
]

const SECTION_COLORS = ['#f9c5d5', '#fde5b0', '#c5e8c8', '#c5d8f9', '#e8c5f9', '#fde0b0']

function fPal(name) { return FANDOM_PALETTE[strHue(name) % FANDOM_PALETTE.length] }
function sCol(idx)  { return SECTION_COLORS[idx % SECTION_COLORS.length] }

/* ── Portrait upload — polaroid ── */
function PortraitUpload({ value, onChange, size = 110 }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600' })
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  const h = Math.round(size * 1.35)
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ background: '#fffef8', padding: '6px 6px 26px', boxShadow: '0 6px 18px rgba(60,40,20,.2)', transform: 'rotate(-1.5deg)', cursor: 'pointer' }}
        onClick={() => !uploading && ref.current?.click()}>
        <div style={{
          width: size, height: h, overflow: 'hidden',
          background: value ? `url(${value}) center/cover` : 'rgba(29,26,22,.06)',
          border: value ? 'none' : '1.5px dashed rgba(29,26,22,.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!value && !uploading && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, color: 'rgba(29,26,22,.22)' }}>☽◯☾</div>
              <div className="mono" style={{ fontSize: 7, letterSpacing: '.14em', color: 'var(--ink-mute)', marginTop: 4 }}>+ portrait</div>
            </div>
          )}
          {uploading && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>⟳</div>}
        </div>
      </div>
      {value && (
        <button onClick={() => onChange('')} style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(29,26,22,.62)', color: '#fff',
          border: 'none', borderRadius: '50%', width: 18, height: 18,
          cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}

/* ── Field row (label + textarea) ── */
function FieldRow({ field, onChange, onDelete }) {
  const taRef = useRef()
  useEffect(() => {
    if (!taRef.current) return
    taRef.current.style.height = 'auto'
    taRef.current.style.height = taRef.current.scrollHeight + 'px'
  }, [field.value])

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
      <input
        value={field.label}
        onChange={e => onChange({ ...field, label: e.target.value })}
        style={{
          width: 88, flexShrink: 0, marginTop: 3,
          fontFamily: 'var(--f-mono)', fontSize: 7.5, letterSpacing: '.2em', textTransform: 'uppercase',
          color: 'var(--ink-mute)', background: 'transparent', border: 'none', outline: 'none',
          borderBottom: '1px dotted rgba(29,26,22,.2)', paddingBottom: 2,
        }}
      />
      <textarea
        ref={taRef} rows={1} value={field.value}
        onChange={e => onChange({ ...field, value: e.target.value })}
        style={{
          flex: 1, fontFamily: 'var(--f-hand)', fontSize: 15, color: 'var(--ink)',
          background: 'transparent', border: 'none', outline: 'none',
          borderBottom: '1.2px solid rgba(29,26,22,.18)',
          resize: 'none', overflow: 'hidden', lineHeight: 1.55, paddingBottom: 2,
        }}
      />
      <button onClick={onDelete} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(29,26,22,.28)', fontSize: 15, lineHeight: 1, padding: '2px 4px', flexShrink: 0,
      }}>×</button>
    </div>
  )
}

/* ── Section block ── */
function SectionBlock({ section, onChange, onDelete, idx }) {
  const col = sCol(idx)

  function addField() {
    onChange({ ...section, fields: [...section.fields, { id: Date.now(), label: 'champ', value: '' }] })
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ background: col, borderRadius: 20, padding: '4px 14px', display: 'inline-flex', alignItems: 'center' }}>
          <input
            value={section.title}
            onChange={e => onChange({ ...section, title: e.target.value })}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--ink)',
              minWidth: 40, width: `${Math.max(40, section.title.length * 7.5 + 10)}px`,
            }}
          />
        </div>
        <button onClick={onDelete} title="Supprimer la section" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(29,26,22,.28)', fontSize: 15, lineHeight: 1, padding: '2px 6px',
        }}>×</button>
      </div>

      {section.fields.map(f => (
        <FieldRow key={f.id} field={f}
          onChange={u => onChange({ ...section, fields: section.fields.map(x => x.id === u.id ? u : x) })}
          onDelete={() => onChange({ ...section, fields: section.fields.filter(x => x.id !== f.id) })}
        />
      ))}

      <button onClick={addField} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--f-hand)', fontSize: 13, color: 'rgba(29,26,22,.38)',
        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
      }}>＋ ajouter un champ</button>
    </div>
  )
}

/* ── Fandom mini-page icon ── */
function FandomCard({ fandom, count, onClick }) {
  const [hov, setHov] = useState(false)
  const col = fPal(fandom)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          width: 108, height: 148, position: 'relative', cursor: 'pointer',
          borderRadius: 4, background: col.bg, border: `1.5px solid ${col.tab}66`, overflow: 'hidden',
          boxShadow: hov
            ? `0 14px 28px rgba(60,40,20,.22), 4px 4px 0 ${col.tab}44`
            : `0 4px 12px rgba(60,40,20,.13), 2px 2px 0 ${col.tab}33`,
          transform: hov ? 'translateY(-8px) rotate(.5deg)' : 'rotate(-.4deg)',
          transition: 'transform .2s, box-shadow .2s',
        }}
      >
        <div style={{ height: 7, background: col.tab, opacity: .75 }} />
        <div style={{ padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ height: 1, background: `${col.tab}30` }} />)}
        </div>
        <div style={{ textAlign: 'center', fontSize: 22, lineHeight: 1, marginTop: 8, letterSpacing: 2 }}>⋆⁺₊✧</div>
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%',
          background: col.tab, opacity: .72,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="mono" style={{ fontSize: 9, color: '#fff', fontWeight: 'bold' }}>{count}</span>
        </div>
      </div>
      <div className="handwriting" style={{ fontSize: 13, color: 'var(--ink)', textAlign: 'center', maxWidth: 116, wordBreak: 'break-word', lineHeight: 1.2 }}>
        {fandom}
      </div>
    </div>
  )
}

/* ── Character / fiche card ── */
function CharCard({ char, ficheType, onClick, onDelete }) {
  const [hov, setHov] = useState(false)
  const ft  = ficheType ?? FICHE_TYPES[0]
  const isPerso = ft.key === 'personnage'
  const { sections } = parseNotes(char.notes ?? '')
  const firstField = sections[0]?.fields[0]

  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div onClick={onClick} style={{
        width: 130, cursor: 'pointer',
        transform: hov ? 'translateY(-6px)' : 'none', transition: 'transform .2s',
        filter: hov ? 'drop-shadow(0 12px 20px rgba(60,40,20,.26))' : 'drop-shadow(0 3px 8px rgba(60,40,20,.14))',
      }}>
        <div style={{
          background: '#fffef8', padding: '6px 6px 0',
          boxShadow: '0 4px 14px rgba(60,40,20,.18)', borderRadius: 2,
        }}>
          <div style={{
            width: 118, height: 158, overflow: 'hidden',
            background: isPerso && char.portrait_front
              ? `url(${char.portrait_front}) center/cover`
              : `linear-gradient(160deg, ${ft.col}55, ${ft.col}cc)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {!(isPerso && char.portrait_front) && (
              <>
                <div style={{ fontSize: 34 }}>{ft.emoji}</div>
                {!isPerso && <div className="mono" style={{ fontSize: 7, letterSpacing: '.14em', color: 'rgba(29,26,22,.5)', textAlign: 'center', padding: '0 6px' }}>{ft.label.toUpperCase()}</div>}
              </>
            )}
          </div>
          <div style={{ padding: '8px 6px 10px' }}>
            <div className="handwriting" style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.2, wordBreak: 'break-word' }}>
              {char.name || '(sans titre)'}
            </div>
            {firstField?.value && (
              <div className="mono" style={{ fontSize: 7.5, letterSpacing: '.1em', color: 'var(--ink-mute)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {firstField.label} · {firstField.value}
              </div>
            )}
          </div>
        </div>
      </div>
      {hov && (
        <button onClick={e => { e.stopPropagation(); onDelete(char.id) }} style={{
          position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(255,250,240,.92)', border: '1px solid rgba(0,0,0,.15)',
          cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-mute)',
        }}>×</button>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function CharacterPage() {
  const [session,   setSession]   = useState(undefined)
  const [chars,     setChars]     = useState([])
  const [view,      setView]      = useState('home')   // 'home' | 'fandom' | 'sheet'
  const [selFandom, setSelFandom] = useState(null)
  const [activeId,  setActiveId]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saved,     setSaved]     = useState(true)

  const [activeType, setActiveType] = useState('personnage')

  const active      = chars.find(c => c.id === activeId) ?? null
  const { type: charType, sections } = parseNotes(active?.notes ?? '')
  const fandoms     = [...new Set(chars.map(c => c.fandom).filter(Boolean))]
  const fandomChars = selFandom ? chars.filter(c => c.fandom === selFandom) : chars
  const typedChars  = fandomChars.filter(c => getType(c) === activeType)

  /* ── Auth + load ── */
  useEffect(() => {
    async function load() {
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)
      if (!s) { setLoading(false); return }
      const { data } = await supabase.from('characters').select('*').order('created_at')
      setChars(data ?? [])
      setLoading(false)
    }
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  /* ── Autosave ── */
  useEffect(() => {
    if (saved || !activeId) return
    const current = chars.find(c => c.id === activeId)
    const t = setTimeout(async () => {
      if (!current) return
      const { id, created_at, user_id, ...fields } = current
      await supabase.from('characters').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
      setSaved(true)
    }, 1200)
    return () => clearTimeout(t)
  }, [chars, saved, activeId])

  /* ── Field helpers ── */
  function setField(key, value) {
    setChars(prev => prev.map(c => c.id === activeId ? { ...c, [key]: value } : c))
    setSaved(false)
  }

  function setSections(newSecs) { setField('notes', serializeNotes(charType, newSecs)) }
  function updateSection(id, updated) { setSections(sections.map(s => s.id === id ? updated : s)) }
  function addSection()  { setSections([...sections, { id: Date.now(), title: 'SECTION', fields: [] }]) }
  function delSection(id){ setSections(sections.filter(s => s.id !== id)) }

  /* ── CRUD ── */
  async function newChar(fandom = '', type = activeType) {
    if (!session) return
    const notes = serializeNotes(type, [])
    const { data, error } = await supabase.from('characters')
      .insert({ user_id: session.user.id, name: '', fandom, notes, updated_at: new Date().toISOString() })
      .select().single()
    if (error || !data) return
    setChars(prev => [...prev, data])
    setActiveId(data.id)
    setView('sheet')
    setSaved(true)
  }

  async function deleteChar(id) {
    await supabase.from('characters').delete().eq('id', id)
    const rest = chars.filter(c => c.id !== id)
    setChars(rest)
    if (id === activeId) {
      setActiveId(null)
      setView(selFandom ? 'fandom' : 'home')
    }
  }

  /* ── Loading / not connected ── */
  if (session === undefined || loading) return (
    <Page><Header active="characters" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>chargement…</div>
      </div>
    </Page>
  )

  if (!session) return (
    <Page><Header active="characters" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <Doodle kind="flower" size={52} color="var(--pinktone)" />
        <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>connecte-toi pour accéder à tes fiches ✿</div>
        <a href="/login" className="btn-stamp" style={{ padding: '10px 24px', fontSize: 13 }}>→ connexion</a>
      </div>
    </Page>
  )

  /* ══════════════════════════════════════════════════════
     VUE HOME — grille de fandoms
  ══════════════════════════════════════════════════════ */
  if (view === 'home') return (
    <Page>
      <Header active="characters" />
      <div style={{ padding: '88px 56px 56px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <RibbonMark color="var(--pinktone)" h={64} w={24} rot={-4} style={{ marginBottom: 6, flexShrink: 0 }} />
            <div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>SECTION E</div>
              <div className="heading-handwritten" style={{ fontSize: 'clamp(52px, 7vw, 88px)', color: 'var(--ink)', lineHeight: .9, marginTop: 4 }}>
                Mes persos
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-end', marginBottom: 10 }}>
            <button onClick={() => { setSelFandom(null); setView('fandom') }} className="btn-stamp btn-stamp--ghost" style={{ padding: '10px 18px', fontSize: 13 }}>
              tous · {chars.length}
            </button>
            <button onClick={() => newChar()} className="btn-stamp" style={{ padding: '10px 18px', fontSize: 13 }}>
              + nouveau
            </button>
          </div>
        </div>

        <WaveDivider width={320} style={{ marginBottom: 44, opacity: .65 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '52px 32px', alignItems: 'start' }}>
          {fandoms.map(f => (
            <FandomCard key={f} fandom={f}
              count={chars.filter(c => c.fandom === f).length}
              onClick={() => { setSelFandom(f); setView('fandom') }} />
          ))}
        </div>

        {fandoms.length === 0 && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div className="handwriting" style={{ fontSize: 22, color: 'var(--ink-mute)', marginBottom: 8 }}>aucun fandom pour l'instant…</div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--ink-mute)' }}>
              crée un personnage et assigne-lui un fandom
            </div>
          </div>
        )}
      </div>
      <Sticker kind="flower_white" size={85} rot={10} style={{ position: 'absolute', top: 72, right: 40, opacity: .6 }} />
      <Sticker kind="tulips"       size={78} rot={-8} style={{ position: 'absolute', bottom: 70, right: 44, opacity: .6 }} />
      <div className="floral-corner" style={{ opacity: .35, pointerEvents: 'none' }} />
    </Page>
  )

  /* ══════════════════════════════════════════════════════
     VUE FANDOM — onglets par type de fiche
  ══════════════════════════════════════════════════════ */
  if (view === 'fandom') {
    const ft = FICHE_TYPES.find(t => t.key === activeType) ?? FICHE_TYPES[0]
    return (
    <Page>
      <Header active="characters" />
      <div style={{ padding: '88px 56px 56px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <button onClick={() => setView('home')} className="btn-stamp btn-stamp--ghost" style={{ padding: '8px 16px', fontSize: 12 }}>
            ← fandoms
          </button>
          <div className="handwriting" style={{ fontSize: 36, color: 'var(--ink)', lineHeight: 1 }}>
            {selFandom ?? 'Tous les projets'}
          </div>
          <button onClick={() => newChar(selFandom ?? '', activeType)} className="btn-stamp" style={{ padding: '8px 16px', fontSize: 12, marginLeft: 'auto' }}>
            + nouveau
          </button>
        </div>

        {/* Onglets types */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {FICHE_TYPES.map(t => {
            const cnt = fandomChars.filter(c => getType(c) === t.key).length
            const isActive = activeType === t.key
            return (
              <button key={t.key} onClick={() => setActiveType(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: isActive ? t.col : 'rgba(29,26,22,.07)',
                fontFamily: 'var(--f-hand)', fontSize: 14, color: 'var(--ink)',
                boxShadow: isActive ? '0 2px 8px rgba(60,40,20,.12)' : 'none',
                transition: 'background .15s, box-shadow .15s',
              }}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                <span className="mono" style={{ fontSize: 9, opacity: .6 }}>{cnt}</span>
              </button>
            )
          })}
        </div>

        <WaveDivider width={260} style={{ marginBottom: 36, opacity: .6 }} />

        {/* Grille fiches du type actif */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '40px 24px', alignItems: 'start' }}>
          {typedChars.map(c => (
            <CharCard key={c.id} char={c} ficheType={ft}
              onClick={() => { setActiveId(c.id); setView('detail') }}
              onDelete={deleteChar} />
          ))}
        </div>

        {typedChars.length === 0 && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{ft.emoji}</div>
            <div className="handwriting" style={{ fontSize: 22, color: 'var(--ink-mute)' }}>
              aucune fiche « {ft.label} » ici…
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.16em', color: 'var(--ink-mute)', marginTop: 8 }}>
              clique sur + nouveau pour en créer une
            </div>
          </div>
        )}
      </div>
      <Sticker kind="shrub" size={88} rot={6} style={{ position: 'absolute', bottom: 70, left: 40, opacity: .55 }} />
    </Page>
  )}

  /* ══════════════════════════════════════════════════════
     VUE DETAIL — profil lecture seule
  ══════════════════════════════════════════════════════ */
  if (view === 'detail' && active) {
    const { type: detailType, sections: detailSections } = parseNotes(active.notes ?? '')
    const detailFt = FICHE_TYPES.find(t => t.key === detailType) ?? FICHE_TYPES[0]
    const isPersoDetail = detailType === 'personnage'

    return (
      <Page>
        <Header active="characters" />
        <div style={{ padding: '88px 56px 56px' }}>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
            <button onClick={() => setView(selFandom ? 'fandom' : 'home')} className="btn-stamp btn-stamp--ghost" style={{ padding: '8px 16px', fontSize: 12 }}>
              ← {selFandom ?? 'fandoms'}
            </button>
            <button onClick={() => setView('sheet')} className="btn-stamp" style={{ padding: '8px 16px', fontSize: 12, marginLeft: 'auto' }}>
              ✎ éditer
            </button>
          </div>

          {/* En-tête */}
          <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start', marginBottom: 44, flexWrap: 'wrap' }}>
            {isPersoDetail && (
              <div style={{
                background: '#fffef8', padding: '8px 8px 32px', flexShrink: 0,
                boxShadow: '0 12px 28px rgba(60,40,20,.2)', transform: 'rotate(-1.5deg)',
              }}>
                <div style={{
                  width: 160, height: 216, overflow: 'hidden',
                  background: active.portrait_front
                    ? `url(${active.portrait_front}) center/cover`
                    : `linear-gradient(160deg, ${detailFt.col}55, ${detailFt.col}cc)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!active.portrait_front && <div style={{ fontSize: 48 }}>{detailFt.emoji}</div>}
                </div>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: detailFt.col, borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
                <span>{detailFt.emoji}</span>
                <span className="mono" style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--ink)' }}>{detailFt.label.toUpperCase()}</span>
              </div>
              <div className="heading-handwritten" style={{ fontSize: 'clamp(40px, 6vw, 72px)', color: 'var(--ink)', lineHeight: .92, marginBottom: 10 }}>
                {active.name || '(sans titre)'}
              </div>
              {active.fandom && (
                <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>
                  {active.fandom.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Séparateur */}
          <div style={{ height: 1, background: 'rgba(29,26,22,.1)', marginBottom: 36 }} />

          {/* Sections en lecture seule */}
          {detailSections.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
              {detailSections.map((s, i) => (
                <div key={s.id} style={{
                  background: '#fffaf0', borderRadius: 3, padding: '20px 24px',
                  boxShadow: '0 4px 14px rgba(60,40,20,.1)',
                }}>
                  <div style={{ background: sCol(i), borderRadius: 20, padding: '4px 14px', display: 'inline-flex', marginBottom: 16 }}>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink)' }}>{s.title}</span>
                  </div>
                  {s.fields.map(f => (
                    <div key={f.id} style={{ marginBottom: 12 }}>
                      <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 3 }}>{f.label.toUpperCase()}</div>
                      <div className="handwriting" style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {f.value || <span style={{ opacity: .3 }}>—</span>}
                      </div>
                    </div>
                  ))}
                  {s.fields.length === 0 && (
                    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', opacity: .5 }}>aucun champ</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div className="handwriting" style={{ fontSize: 22, color: 'var(--ink-mute)', marginBottom: 16 }}>
                aucune section pour l'instant…
              </div>
              <button onClick={() => setView('sheet')} className="btn-stamp" style={{ padding: '10px 24px', fontSize: 13 }}>
                ✎ éditer la fiche
              </button>
            </div>
          )}

        </div>
        <Sticker kind="flower_white" size={80} rot={10} style={{ position: 'absolute', bottom: 80, right: 44, opacity: .5, pointerEvents: 'none' }} />
        <div className="floral-corner" style={{ opacity: .2, pointerEvents: 'none' }} />
      </Page>
    )
  }

  /* ══════════════════════════════════════════════════════
     VUE SHEET — fiche portrait A4
  ══════════════════════════════════════════════════════ */
  return (
    <Page>
      <Header active="characters" />

      {/* Pousse la barre sous le Header (position:absolute top:28 + ~40px hauteur) */}
      <div style={{ height: 68 }} />

      {/* Barre supérieure sticky */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
        background: 'rgba(255,250,240,.94)', borderBottom: '1px dotted rgba(0,0,0,.1)',
        backdropFilter: 'blur(6px)',
      }}>
        <button onClick={() => setView(activeId ? 'detail' : selFandom ? 'fandom' : 'home')} className="btn-stamp btn-stamp--ghost" style={{ padding: '6px 14px', fontSize: 12 }}>
          ← {active?.name || (selFandom ?? 'fandoms')}
        </button>
        <span className="mono" style={{ fontSize: 9, letterSpacing: '.18em', color: saved ? 'var(--ink-mute)' : 'var(--primrose)', transition: 'color .3s', marginLeft: 'auto' }}>
          {saved ? '✓ sauvegardé' : '● en cours…'}
        </span>
        <button onClick={() => active && deleteChar(active.id)} title="Supprimer ce personnage" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(29,26,22,.3)', fontSize: 14, padding: '4px 8px',
        }}>✕</button>
      </div>

      {/* Page A4 portrait centrée */}
      {active && (
        <div style={{ padding: '44px 24px 80px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 620, maxWidth: '100%',
            background: '#fffaf0',
            boxShadow: '0 12px 44px rgba(30,20,10,.18), 0 2px 6px rgba(30,20,10,.1)',
            borderRadius: 3,
            padding: '48px 52px 64px',
            position: 'relative',
          }}>

            {/* Déco tapes */}
            <Tape kind="dots" color="var(--primrose)" rot={-4}
              style={{ top: -12, left: 60, fontSize: 10, padding: '3px 14px' }}>
              fiche de personnage
            </Tape>
            {active.fandom && (
              <Tape kind="grid" color="var(--lime)" rot={3}
                style={{ top: -12, right: 60, fontSize: 10, padding: '3px 14px' }}>
                {active.fandom}
              </Tape>
            )}

            {/* Badge type */}
            {(() => {
              const ft = FICHE_TYPES.find(t => t.key === charType) ?? FICHE_TYPES[0]
              return (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: ft.col, borderRadius: 20, padding: '4px 14px', marginBottom: 20 }}>
                  <span>{ft.emoji}</span>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--ink)' }}>{ft.label.toUpperCase()}</span>
                </div>
              )
            })()}

            {/* En-tête : portrait (personnages) ou titre seul */}
            {charType === 'personnage' ? (
              <div style={{ display: 'flex', gap: 28, marginBottom: 36, alignItems: 'flex-start' }}>
                <PortraitUpload value={active.portrait_front ?? ''} onChange={v => setField('portrait_front', v)} size={110} />
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <input value={active.name ?? ''} onChange={e => setField('name', e.target.value)} placeholder="Nom du personnage…"
                    style={{ display: 'block', width: '100%', marginBottom: 14, fontFamily: 'var(--f-hand)', fontSize: 32, color: 'var(--ink)', background: 'transparent', border: 'none', outline: 'none', borderBottom: '1.5px solid rgba(29,26,22,.22)', paddingBottom: 4 }} />
                  <div className="mono" style={{ fontSize: 7.5, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 4 }}>FANDOM / UNIVERS</div>
                  <input value={active.fandom ?? ''} onChange={e => setField('fandom', e.target.value)} placeholder="—"
                    style={{ fontFamily: 'var(--f-hand)', fontSize: 16, color: 'var(--ink)', background: 'transparent', border: 'none', outline: 'none', borderBottom: '1.2px solid rgba(29,26,22,.18)', width: '100%', paddingBottom: 2 }} />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 36 }}>
                <input value={active.name ?? ''} onChange={e => setField('name', e.target.value)} placeholder="Titre…"
                  style={{ display: 'block', width: '100%', marginBottom: 14, fontFamily: 'var(--f-hand)', fontSize: 32, color: 'var(--ink)', background: 'transparent', border: 'none', outline: 'none', borderBottom: '1.5px solid rgba(29,26,22,.22)', paddingBottom: 4 }} />
                <div className="mono" style={{ fontSize: 7.5, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 4 }}>FANDOM / UNIVERS</div>
                <input value={active.fandom ?? ''} onChange={e => setField('fandom', e.target.value)} placeholder="—"
                  style={{ fontFamily: 'var(--f-hand)', fontSize: 16, color: 'var(--ink)', background: 'transparent', border: 'none', outline: 'none', borderBottom: '1.2px solid rgba(29,26,22,.18)', width: '100%', paddingBottom: 2 }} />
              </div>
            )}

            {/* Séparateur */}
            <div style={{ height: 1, background: 'rgba(29,26,22,.1)', marginBottom: 32 }} />

            {/* Sections personnalisées */}
            {sections.map((s, i) => (
              <SectionBlock key={s.id} section={s} idx={i}
                onChange={u => updateSection(s.id, u)}
                onDelete={() => delSection(s.id)} />
            ))}

            {/* Bouton ajouter section */}
            <button onClick={addSection} style={{
              marginTop: sections.length ? 8 : 0,
              background: 'none', border: '1.5px dashed rgba(29,26,22,.2)',
              borderRadius: 20, cursor: 'pointer', padding: '8px 24px',
              fontFamily: 'var(--f-hand)', fontSize: 14, color: 'rgba(29,26,22,.38)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>＋</span> ajouter une section
            </button>

            {/* Pied de page */}
            <div style={{ marginTop: 44, textAlign: 'right' }}>
              <span className="mono" style={{ fontSize: 7.5, letterSpacing: '.28em', color: 'var(--ink-mute)' }}>
                ─ FICHE DE PERSONNAGE ─ {(active.fandom || '—').toUpperCase()} ─
              </span>
            </div>

            <Sticker kind="tulips" size={76} rot={14} style={{ position: 'absolute', bottom: 56, right: 22, opacity: .45, pointerEvents: 'none' }} />
          </div>
        </div>
      )}

      <div className="floral-corner" style={{ opacity: .18, pointerEvents: 'none' }} />
    </Page>
  )
}
