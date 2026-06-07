import { useState, useEffect, useRef, forwardRef } from 'react'
import { Page, Header, Tape, Doodle, Feather, WaveDivider, Sticker, RibbonMark, PaperClip } from '../components/JournalShared'
import { supabase } from '../lib/supabase'

import fi1   from '../assets/foldericon/1.png'
import fi1f  from '../assets/foldericon/1f.png'
import fi2   from '../assets/foldericon/2.png'
import fi2f  from '../assets/foldericon/2f.png'
import fi3   from '../assets/foldericon/3.png'
import fi3f  from '../assets/foldericon/3f.png'
import fi4   from '../assets/foldericon/4.png'
import fi4f  from '../assets/foldericon/4f.png'
import fi5   from '../assets/foldericon/5.png'
import fi5f  from '../assets/foldericon/5f.png'
import fi7   from '../assets/foldericon/7.png'
import fi8   from '../assets/foldericon/8.png'
import fi9   from '../assets/foldericon/9.png'
import fi10  from '../assets/foldericon/10.png'
import fi11  from '../assets/foldericon/11.png'
import fi13  from '../assets/foldericon/13.png'

const FOLDER_ICONS = [fi1, fi1f, fi2, fi2f, fi3, fi3f, fi4, fi4f, fi5, fi5f, fi7, fi8, fi9, fi10, fi11, fi13]

/* ── utils ──────────────────────────────────────────────────────── */
function countWords(t) {
  const plain = (t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return plain ? plain.split(' ').length : 0
}
function normalizeBody(body = '') {
  if (!body || body.trimStart().startsWith('<')) return body
  return body.split('\n').map(line => line ? `<p>${line}</p>` : '<p><br></p>').join('')
}
function strHue(s = '') { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffff; return h % 360 }
function folderIcon(name) { return FOLDER_ICONS[strHue(name) % FOLDER_ICONS.length] }
const EMPTY_CH = (n = 1) => ({ id: Date.now() + n, title: `Chapitre ${n}`, body: '', summary: '', notes: '' })

const SHP_KEY = 'ao3_sheet_prefs'

function getPrefs() { try { return JSON.parse(localStorage.getItem(SHP_KEY) || '{}') } catch { return {} } }
function savePrefs(p) { localStorage.setItem(SHP_KEY, JSON.stringify(p)) }

/* ── Rich text editor (contentEditable) ───────────────────────── */
const RichEditor = forwardRef(function RichEditor({ initialHtml, onChange, style }, ref) {
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialHtml || ''
  }, []) // seulement au montage — key={activeChId} force le remontage au changement de chapitre

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={e => onChange(e.currentTarget.innerHTML)}
      data-placeholder="Il était une fois…&#10;&#10;Écris ta fanfiction ici, sans limite."
      style={{ outline: 'none', ...style }}
    />
  )
})

/* ── Symboles esthétiques ───────────────────────────────────────── */
const SYMBOLS = [
  { label: 'étoiles',  syms: ['✦','✧','✩','✪','✫','✬','✭','✮','✯','✰','✵','✶','✷','✸','✹','✺','✼','✽','✾','✱','❋','꙳','⁂','⋆','˚','𖥔','⟢','✮'] },
  { label: 'fleurs',   syms: ['✿','❀','❁','❂','❃','❄','❅','❆','❇','❈','❉','❊','⚘','꒰','꒱','ꕀ','ꕤ'] },
  { label: 'cœurs',    syms: ['♡','♥','❤','❥','❣','❦','❧','𓆩♡𓆪','ᥫ᭡'] },
  { label: 'kawaii',   syms: ['ᵔᴗᵔ','ᐢ..ᐢ','ᐢᗜᐢ','˃ᴗ˂','˃̵ᴗ˂̵','˃ᗜ˂','˘ᗜ˘','ᗢ','ᗜ','^..^','◜◡◝','◜ᴗ◝','･ᴗ･','（｀δ´）','ʬʬ','ꜝꜝ','◖◗','ᶻz','ᶻ'] },
  { label: 'musique',  syms: ['♩','♪','♫','♬','♭','♮','♯','ıllı'] },
  { label: 'flèches',  syms: ['→','←','↑','↓','↔','↕','➤','➡','➢','➣','➜','➔','❯','❮','↳','↲','↺','↻','⇝','⇜','⇆','⇅','⇵','⇣⇡','⤸','◂','▹','ꜛ'] },
  { label: 'formes',   syms: ['●','○','◎','◉','◌','◍','◖','◗','◐','◒','◆','◇','◈','△','▲','▷','▸','▽','▿','◜','◝','◞','◟','⬡','⬢','⟡','⌬','⎔','⊹','⊕','⊗','⊙','⊚','⊞','⬙','⬦','♢','⭔','⭓','❍','〇','⧅','◫','⪩','⪨','⪩⪨','≧≦'] },
  { label: 'blocs',    syms: ['░','▒','▓','▥','▤','▦','▧','▨','▩','▣','▢','⬚','▞'] },
  { label: 'cadres',   syms: ['꒰','꒱','「','」','『','』','【','】','〔','〕','《','》','〈','〉','⌜','⌝','⌞','⌟','｢','｣','❝','❞','❛','❜','﹙','﹚','（','）','❰','﹅'] },
  { label: 'spéciaux', syms: ['†','‡','☽','☾','☀','☁','✝','✞','⊱','⊰','⌕','⌗','⌯','⎙','⨳','⫘','☓','✕','×','Ꜣ','ꔠ','ꗃ','Ꮺ','キ','リ','口','イ','罒','〹','⺌','⺡','ㄑ','␥','﹫','੭','𓆸','𓂃','𓁹','𓇼','𓆉','⿸','⿴','⿻','⿶','⌓','⩇','⌖'] },
  { label: 'sépar.',   syms: ['─','━','═','╌','╍','┄','┅','┈','┉','≋','～','〰','﹏','‿','⁀','⌒','∿','∾','┆','┆︎','︴','⌇','﹒','ˎ','﹅','·','•'] },
  { label: 'déco',     syms: ['°','∘','˙','˚','ₓ','ₒ','ₐ','⁺','⁻','₊','ˢ','ᵒ','ᵐ','※','‼','⁉','‽','﹢','％','%','﹪','@','？','！','∇','ᶻz','⟢','ꜛ','ꜝꜝ','𓆩♡𓆪','ᥫ᭡'] },
]

/* ── Format bar ─────────────────────────────────────────────────── */
function FormatBar({ editorRef, fontSize, onFontSize, fontColor, onFontColor,
  showLines, onShowLines }) {
  const savedSel = useRef(null)
  const [showSymbols, setShowSymbols] = useState(false)
  const [symTab, setSymTab] = useState(0)

  function cmd(command) {
    editorRef.current?.focus()
    document.execCommand(command, false, undefined)
  }

  function saveSelection() {
    const sel = window.getSelection()
    if (sel?.rangeCount > 0) savedSel.current = sel.getRangeAt(0).cloneRange()
  }

  function applyColor(color) {
    onFontColor(color)
    if (savedSel.current) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(savedSel.current)
      document.execCommand('foreColor', false, color)
    }
  }

  function insertSymbol(sym) {
    editorRef.current?.focus()
    if (savedSel.current) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(savedSel.current)
    }
    document.execCommand('insertText', false, sym)
    setShowSymbols(false)
  }

  const sep = <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,.1)', flexShrink: 0 }} />

  const fmtBtn = (children, command, title) => (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); cmd(command) }}
      style={{
        width: 28, height: 28, borderRadius: 6,
        border: '1px solid rgba(0,0,0,.12)',
        background: 'rgba(255,250,240,.9)',
        cursor: 'pointer', fontSize: 14, color: 'var(--ink)',
        lineHeight: 1, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'serif',
      }}
    >{children}</button>
  )

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '7px 20px',
      background: 'rgba(255,248,230,.97)',
      borderBottom: '1px dotted rgba(0,0,0,.09)',
      position: 'sticky', top: 52, zIndex: 9,
    }}>
      {fmtBtn(<b>G</b>, 'bold', 'Gras')}
      {fmtBtn(<i>I</i>, 'italic', 'Italique')}
      {fmtBtn(<u>S</u>, 'underline', 'Souligné')}
      {fmtBtn(<s>R</s>, 'strikeThrough', 'Barré')}

      {sep}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="mono" style={{ fontSize: 8, letterSpacing: '.12em', color: 'var(--ink-mute)' }}>TAILLE</span>
        <select value={fontSize} onChange={e => onFontSize(Number(e.target.value))}
          style={{ fontFamily: 'var(--f-hand)', fontSize: 12, background: 'rgba(255,250,240,.9)', border: '1px solid rgba(0,0,0,.12)', borderRadius: 6, padding: '3px 4px', color: 'var(--ink)', cursor: 'pointer' }}>
          {[12, 14, 16, 18, 20, 22, 24, 28, 32].map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="mono" style={{ fontSize: 8, letterSpacing: '.12em', color: 'var(--ink-mute)' }}>ENCRE</span>
        <div style={{ position: 'relative', width: 28, height: 24, borderRadius: 4, border: '1px solid rgba(0,0,0,.15)', background: fontColor, overflow: 'hidden', flexShrink: 0 }}>
          <input type="color" value={fontColor}
            onMouseDown={saveSelection}
            onChange={e => applyColor(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
        </div>
      </div>

      {sep}

      <button onClick={() => onShowLines(!showLines)} title="Lignes réglées" style={{
        width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(0,0,0,.12)',
        background: showLines ? 'var(--primrose)' : 'rgba(255,250,240,.9)',
        cursor: 'pointer', fontSize: 15, color: 'var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>≡</button>

      {sep}

      {/* Symboles */}
      <div style={{ position: 'relative' }}>
        <button
          onMouseDown={e => { e.preventDefault(); saveSelection(); setShowSymbols(v => !v) }}
          title="Insérer un symbole"
          style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(0,0,0,.12)',
            background: showSymbols ? 'var(--primrose)' : 'rgba(255,250,240,.9)',
            cursor: 'pointer', fontSize: 15, color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✦</button>

        {showSymbols && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 30,
            background: '#fffaf0', border: '1.4px solid rgba(29,26,22,.15)',
            borderRadius: 8, boxShadow: '0 10px 28px rgba(0,0,0,.14)',
            width: 360,
          }}>
            {/* Onglets catégories — wrap sur plusieurs lignes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid rgba(29,26,22,.1)', padding: '4px 6px 0', gap: 2 }}>
              {SYMBOLS.map((cat, i) => (
                <button key={i}
                  onMouseDown={e => { e.preventDefault(); setSymTab(i) }}
                  style={{
                    whiteSpace: 'nowrap', padding: '4px 7px', fontSize: 8,
                    fontFamily: 'var(--f-mono)', letterSpacing: '.08em',
                    background: symTab === i ? 'var(--ink)' : 'transparent',
                    color: symTab === i ? 'var(--paper)' : 'var(--ink-mute)',
                    border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer',
                    transition: 'all .1s', marginBottom: 0,
                  }}>
                  {cat.label.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Grille de symboles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: 10 }}>
              {SYMBOLS[symTab].syms.map((sym, i) => (
                <button key={i}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => insertSymbol(sym)}
                  style={{
                    width: 34, height: 34, borderRadius: 5,
                    border: '1px solid rgba(29,26,22,.1)',
                    background: 'rgba(255,250,240,.7)',
                    cursor: 'pointer', fontSize: 16, color: 'var(--ink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .1s, transform .1s',
                    fontFamily: 'serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--primrose)'; e.currentTarget.style.transform = 'scale(1.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,250,240,.7)'; e.currentTarget.style.transform = 'scale(1)' }}
                >{sym}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Folder card ────────────────────────────────────────────────── */
function FolderCard({ name, count, onClick, isNew, onRename }) {
  const [hov, setHov] = useState(false)
  const icon = isNew ? null : folderIcon(name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          cursor: 'pointer',
          transform: hov ? 'translateY(-8px) rotate(.5deg)' : 'rotate(-.4deg)',
          transition: 'transform .2s, filter .2s',
          filter: hov
            ? 'saturate(1.5) brightness(0.9) drop-shadow(0 16px 24px rgba(60,40,20,.45))'
            : 'saturate(1.35) brightness(0.88) drop-shadow(0 4px 10px rgba(60,40,20,.28))',
          width: 110,
        }}
      >
        {isNew ? (
          <div style={{
            width: 110, height: 90,
            border: '2px dashed rgba(0,0,0,.22)',
            borderRadius: 10,
            background: 'rgba(255,250,240,.6)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <div style={{ fontSize: 26, lineHeight: 1 }}>＋</div>
            <div className="handwriting" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>nouveau</div>
          </div>
        ) : (
          <img src={icon} alt={name} style={{ width: '100%', display: 'block' }} />
        )}
      </div>
      {!isNew && (
        <div style={{ textAlign: 'center' }}>
          <div className="handwriting" style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.1, wordBreak: 'break-word', maxWidth: 120 }}>
            {name}
          </div>
          <div className="mono" style={{ fontSize: 8, letterSpacing: '.14em', color: 'var(--ink-mute)', marginTop: 2 }}>
            {count} projet{count !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Project card ───────────────────────────────────────────────── */
function ProjectCard({ w, sheetUrl, onClick, onDelete }) {
  const [hov, setHov] = useState(false)
  const words = w.chapters?.reduce((a, c) => a + countWords(c.body), 0) ?? 0
  const chaps = w.chapters?.length ?? 0
  return (
    <div
      style={{ position: 'relative', width: 152 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div onClick={onClick} style={{
        cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
        boxShadow: hov ? '0 14px 28px rgba(60,40,20,.22)' : '0 3px 10px rgba(60,40,20,.13)',
        transform: hov ? 'translateY(-6px)' : 'none', transition: 'transform .2s, box-shadow .2s',
        background: '#fff',
      }}>
        {/* Preview */}
        <div style={{ height: 108, position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, var(--yucca) 0%, var(--pinktone) 100%)' }}>
          {sheetUrl
            ? <img src={sheetUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left' }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Feather size={28} color="var(--primrose)" />
              </div>
          }
        </div>
        {/* Info */}
        <div style={{ padding: '10px 12px 12px' }}>
          <div className="handwriting" style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 3, wordBreak: 'break-word', minHeight: 17 }}>
            {w.fic_title || 'sans titre…'}
          </div>
          <div className="mono" style={{ fontSize: 8, letterSpacing: '.11em', color: 'var(--ink-mute)' }}>
            {words.toLocaleString('fr-FR')} mots · {chaps} ch.
          </div>
        </div>
      </div>
      {hov && (
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
          position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(255,250,240,.92)', border: '1px solid rgba(0,0,0,.15)',
          cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-mute)',
        }}>×</button>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function WritingPage() {
  const [session,    setSession]    = useState(null)
  const [writings,   setWritings]   = useState([])
  const [activeId,   setActiveId]   = useState(null)
  const [activeChId, setActiveChId] = useState(null)
  const [view,       setView]       = useState('home')   // 'home' | 'projects' | 'editor'
  const [selFolder,  setSelFolder]  = useState(null)
  const [status,     setStatus]     = useState('idle')
  const [prefs,      setPrefs]      = useState(getPrefs)
  const [newFolder,  setNewFolder]  = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const saveTimer = useRef(null)
  const stateRef  = useRef({ writings: [], activeId: null })
  const editorRef = useRef(null)
  useEffect(() => { stateRef.current = { writings, activeId } }, [writings, activeId])

  /* ── Auth + load ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s); if (s) { loadAll(s.user.id) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); if (s) { loadAll(s.user.id) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadAll(userId) {
    const { data } = await supabase.from('writings').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
    if (data?.length) {
      setWritings(data)
      setActiveId(data[0].id)
      setActiveChId(data[0].chapters?.[0]?.id ?? null)
    }
  }

  /* ── Save ── */
  async function save() {
    const { writings, activeId } = stateRef.current
    const w = writings.find(x => x.id === activeId); if (!w) return
    setStatus('saving')
    const { error } = await supabase.from('writings').update({
      fic_title: w.fic_title, chapters: w.chapters,
      folder: w.folder ?? null, updated_at: new Date().toISOString(),
    }).eq('id', activeId)
    setStatus(error ? 'error' : 'saved')
  }

  function triggerSave() {
    clearTimeout(saveTimer.current); setStatus('idle')
    saveTimer.current = setTimeout(save, 1500)
  }
  useEffect(() => () => clearTimeout(saveTimer.current), [])

  function patchActive(patch) {
    setWritings(prev => prev.map(w => w.id === activeId ? { ...w, ...patch } : w))
    triggerSave()
  }

  /* ── Project actions ── */
  async function openProject(id) {
    clearTimeout(saveTimer.current)
    await save()
    const { writings } = stateRef.current
    const w = writings.find(x => x.id === id)
    setActiveId(id)
    setActiveChId(w?.chapters?.[0]?.id ?? null)
    setView('editor')
  }

  async function newProject(folder = null) {
    if (!session) return
    const ch = EMPTY_CH(1)
    const { data } = await supabase.from('writings')
      .insert({ fic_title: '', chapters: [ch], folder, user_id: session.user.id, updated_at: new Date().toISOString() })
      .select('*').single()
    if (data) {
      setWritings(prev => [data, ...prev])
      setActiveId(data.id)
      setActiveChId(ch.id)
      setView('editor')
    }
  }

  async function deleteProject(id) {
    if (!confirm('Supprimer ce projet ?')) return
    await supabase.from('writings').delete().eq('id', id)
    setWritings(prev => {
      const rest = prev.filter(w => w.id !== id)
      if (id === activeId) { setActiveId(rest[0]?.id ?? null); setActiveChId(rest[0]?.chapters?.[0]?.id ?? null) }
      return rest
    })
  }

  /* ── Chapters ── */
  const activeWriting  = writings.find(w => w.id === activeId)
  const chapters       = activeWriting?.chapters ?? []
  const activeChapter  = chapters.find(c => c.id === activeChId) ?? chapters[0] ?? null

  function updateChapter(id, patch) { patchActive({ chapters: chapters.map(c => c.id === id ? { ...c, ...patch } : c) }) }
  function addChapter()  { const ch = EMPTY_CH(chapters.length + 1); patchActive({ chapters: [...chapters, ch] }); setActiveChId(ch.id) }
  function removeChapter(id) {
    if (chapters.length <= 1) return
    const rest = chapters.filter(c => c.id !== id); patchActive({ chapters: rest })
    if (activeChId === id) setActiveChId(rest[0].id)
  }

  /* ── Folders ── */
  const folders        = [...new Set(writings.map(w => w.folder).filter(Boolean))]
  const folderWritings = selFolder ? writings.filter(w => w.folder === selFolder) : writings

  function createFolder() {
    const name = newFolderName.trim(); if (!name) { setNewFolder(false); return }
    setSelFolder(name); setView('projects'); setNewFolder(false); setNewFolderName('')
  }

  /* ── Prefs ── */
  const activePrefs = prefs[activeId] ?? {}
  const showLines   = activePrefs.showLines ?? false
  const fontSize    = activePrefs.fontSize  ?? 18
  const fontColor   = activePrefs.fontColor ?? '#3a2e22'
  const lineHeight  = Math.round(fontSize * 2.2)

  function updatePrefs(patch) {
    const p = { ...prefs, [activeId]: { ...activePrefs, ...patch } }
    setPrefs(p); savePrefs(p)
  }

  /* ── Stats ── */
  const totalWords  = chapters.reduce((a, c) => a + countWords(c.body), 0)
  const activeWords = countWords(activeChapter?.body ?? '')

  const STATUS_LABEL = { idle: '···', saving: '⟳ sauvegarde…', saved: '✓ sauvegardé', error: '✕ erreur' }
  const STATUS_COLOR = { idle: 'var(--ink-mute)', saving: 'var(--ink-mute)', saved: 'var(--lime-d)', error: 'var(--primrose)' }

  /* ── Non connecté ── */
  if (!session) return (
    <Page>
      <Header active="writing" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <Doodle kind="flower" size={52} color="var(--pinktone)" />
        <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>connecte-toi pour accéder à tes écrits</div>
      </div>
    </Page>
  )

  /* ══════════════════════════════════════════════════════════════
     VUE : ACCUEIL — grille de dossiers
  ══════════════════════════════════════════════════════════════ */
  if (view === 'home') return (
    <Page>
      <Header active="writing" />

      <div style={{ padding: '88px 56px 56px' }}>

        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <RibbonMark color="var(--lime)" h={64} w={24} rot={-4} style={{ marginBottom: 6, flexShrink: 0 }} />
            <div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>SECTION D</div>
              <div className="heading-handwritten" style={{ fontSize: 'clamp(52px, 7vw, 88px)', color: 'var(--ink)', lineHeight: .9, marginTop: 4 }}>
                Mes écrits
              </div>
            </div>
            <PaperClip size={22} rot={15} style={{ marginBottom: 14, flexShrink: 0 }} />
          </div>

          <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-end', marginBottom: 10 }}>
            <button onClick={() => { setSelFolder(null); setView('projects') }} className="btn-stamp btn-stamp--ghost" style={{ padding: '10px 18px', fontSize: 13 }}>
              tous · {writings.length}
            </button>
          </div>
        </div>

        <WaveDivider width={320} style={{ marginBottom: 44, opacity: .65 }} />

        {/* Grille de dossiers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '48px 32px', alignItems: 'start' }}>

          {folders.map(f => (
            <FolderCard key={f} name={f}
              count={writings.filter(w => w.folder === f).length}
              onClick={() => { setSelFolder(f); setView('projects') }} />
          ))}

          {/* Nouveau dossier — input ou card */}
          {newFolder ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 12px', background: 'rgba(255,250,240,.8)', borderRadius: 10, border: '1.5px dashed rgba(0,0,0,.2)' }}>
              <input
                autoFocus value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setNewFolder(false); setNewFolderName('') } }}
                placeholder="nom du dossier…"
                style={{ background: 'transparent', border: 'none', borderBottom: '1.4px solid var(--ink)', fontFamily: 'var(--f-hand)', fontSize: 17, color: 'var(--ink)', outline: 'none', padding: '3px 0', width: '100%' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={createFolder} className="btn-stamp" style={{ flex: 1, padding: '6px 0', fontSize: 11 }}>créer</button>
                <button onClick={() => { setNewFolder(false); setNewFolderName('') }} className="btn-stamp btn-stamp--ghost" style={{ flex: 1, padding: '6px 0', fontSize: 11 }}>×</button>
              </div>
            </div>
          ) : (
            <FolderCard isNew name="nouveau" onClick={() => setNewFolder(true)} />
          )}
        </div>

        {folders.length === 0 && !newFolder && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div className="handwriting" style={{ fontSize: 22, color: 'var(--ink-mute)', marginBottom: 8 }}>
              pas encore de dossier…
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--ink-mute)' }}>
              crée un dossier pour organiser tes projets, ou consulte tous les projets
            </div>
          </div>
        )}
      </div>

      <Sticker kind="flower_white" size={85} rot={10}  style={{ position: 'absolute', top: 72, right: 40, opacity: .6 }} />
      <Sticker kind="tulips"       size={78} rot={-8}  style={{ position: 'absolute', bottom: 70, right: 44, opacity: .6 }} />
      <div className="floral-corner" style={{ opacity: .35, pointerEvents: 'none' }} />
    </Page>
  )

  /* ══════════════════════════════════════════════════════════════
     VUE : PROJETS — cartes de projets dans un dossier
  ══════════════════════════════════════════════════════════════ */
  if (view === 'projects') return (
    <Page>
      <Header active="writing" />

      <div style={{ padding: '88px 56px 56px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <button onClick={() => setView('home')} className="btn-stamp btn-stamp--ghost" style={{ padding: '8px 16px', fontSize: 12 }}>
            ← dossiers
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selFolder && <img src={folderIcon(selFolder)} alt="" style={{ width: 36 }} />}
            <div className="handwriting" style={{ fontSize: 36, color: 'var(--ink)', lineHeight: 1 }}>
              {selFolder ?? 'Tous les projets'}
            </div>
          </div>
        </div>

        <WaveDivider width={260} style={{ marginBottom: 36, opacity: .6 }} />

        {/* Grille projets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', gap: '40px 24px', alignItems: 'start' }}>

          {folderWritings.map(w => (
            <ProjectCard key={w.id} w={w}
              sheetUrl={(prefs[w.id] ?? {}).sheetUrl ?? null}
              onClick={() => openProject(w.id)}
              onDelete={() => deleteProject(w.id)} />
          ))}

          {/* Nouveau projet */}
          <div onClick={() => newProject(selFolder)} style={{
            width: 152, height: 152 + 44,
            borderRadius: 8, border: '2px dashed rgba(0,0,0,.2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, cursor: 'pointer', background: 'rgba(255,250,240,.5)', transition: 'background .15s',
          }}>
            <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>✦</div>
            <div className="handwriting" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>nouveau projet</div>
          </div>
        </div>

        {folderWritings.length === 0 && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div className="handwriting" style={{ fontSize: 22, color: 'var(--ink-mute)' }}>aucun projet ici…</div>
          </div>
        )}
      </div>

      <Sticker kind="shrub" size={88} rot={6} style={{ position: 'absolute', bottom: 70, left: 40, opacity: .55 }} />
    </Page>
  )

  /* ══════════════════════════════════════════════════════════════
     VUE : ÉDITEUR — zone d'écriture
  ══════════════════════════════════════════════════════════════ */
  return (
    <Page w="min(1400px, 98vw)">

      {/* ─ Barre d'outils supérieure ─ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px',
        background: 'rgba(255,250,240,.94)', borderBottom: '1px dotted rgba(0,0,0,.1)',
        backdropFilter: 'blur(6px)', flexWrap: 'wrap',
      }}>
        {/* Retour */}
        <button onClick={() => { save(); setView('projects') }} className="btn-stamp btn-stamp--ghost" style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }}>
          ← projets
        </button>

        {/* Titre */}
        <input
          value={activeWriting?.fic_title ?? ''}
          onChange={e => patchActive({ fic_title: e.target.value })}
          placeholder="titre du projet…"
          style={{
            flex: 1, minWidth: 100, background: 'transparent', border: 'none',
            borderBottom: '1.2px solid rgba(0,0,0,.18)', fontFamily: 'var(--f-hand)',
            fontSize: 20, color: 'var(--ink)', outline: 'none', padding: '2px 4px',
          }} />

        {/* Chapitres */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0 }}>
          {chapters.map(c => (
            <button key={c.id} onClick={() => setActiveChId(c.id)} style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: c.id === activeChId ? 'var(--primrose)' : 'rgba(0,0,0,.06)',
              fontFamily: 'var(--f-hand)', fontSize: 13, color: 'var(--ink)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>{c.title}</span>
              {chapters.length > 1 && (
                <span onClick={e => { e.stopPropagation(); removeChapter(c.id) }} style={{ opacity: .4, fontSize: 12 }}>×</span>
              )}
            </button>
          ))}
          <button onClick={addChapter} style={{
            padding: '5px 10px', borderRadius: 20,
            border: '1.2px dashed rgba(0,0,0,.22)', background: 'none',
            cursor: 'pointer', fontFamily: 'var(--f-hand)', fontSize: 13, color: 'var(--ink-mute)',
          }}>+ ch.</button>
        </div>

        {/* Stats + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--lime-d)' }}>
            {activeWords.toLocaleString('fr-FR')} mots
          </div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.15em', color: STATUS_COLOR[status] }}>
            {STATUS_LABEL[status]}
          </div>
        </div>
      </div>

      {/* ─ Zone d'écriture ─ */}
      {activeChapter && (
        <div style={{
          minHeight: '80vh',
          background: 'rgba(220,213,200,.25)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>

          {/* Barre de formatage */}
          <FormatBar
            editorRef={editorRef}
            fontSize={fontSize}   onFontSize={v => updatePrefs({ fontSize: v })}
            fontColor={fontColor} onFontColor={v => updatePrefs({ fontColor: v })}
            showLines={showLines} onShowLines={v => updatePrefs({ showLines: v })}
          />

          {/* Zone de page centrée */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '40px 24px 0' }}>
            <div style={{ width: '100%', maxWidth: 860, position: 'relative' }}>

              {/* Layout AO3 */}
              <div style={{
                padding: '36px 48px 80px',
                position: 'relative',
                maxWidth: 860, margin: '0 auto', boxSizing: 'border-box', width: '100%',
                background: 'rgba(255, 228, 232, 0.6)',
                borderRadius: 4,
                boxShadow: 'inset 0 0 0 1px rgba(220, 160, 175, 0.15)',
              }}>

                {/* Titre du chapitre */}
                <input
                  value={activeChapter.title}
                  onChange={e => updateChapter(activeChId, { title: e.target.value })}
                  placeholder="Titre du chapitre…"
                  style={{
                    background: 'transparent', border: 'none',
                    fontFamily: 'var(--f-display)', fontSize: 28, color: 'var(--ink)',
                    outline: 'none', width: '100%', marginBottom: 28,
                    letterSpacing: '-.01em',
                  }} />

                {/* Zone résumé */}
                {(activeChapter.summary !== undefined) && (
                  <textarea
                    value={activeChapter.summary ?? ''}
                    onChange={e => updateChapter(activeChId, { summary: e.target.value })}
                    placeholder="Résumé du chapitre (optionnel)…"
                    rows={3}
                    style={{
                      width: '100%', background: 'transparent',
                      border: 'none', outline: 'none', resize: 'none',
                      fontFamily: 'var(--f-body)', fontSize: 15, fontStyle: 'italic',
                      color: 'var(--ink-soft)', lineHeight: 1.7,
                      marginBottom: 20, display: 'block',
                    }}
                  />
                )}

                {/* Séparateur Notes */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--f-body)', fontSize: 15, fontWeight: 700, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Notes:</span>
                  </div>
                  <div style={{ height: 1, background: 'rgba(29,26,22,.15)', marginTop: 8, marginBottom: 12 }} />
                  <textarea
                    value={activeChapter.notes ?? ''}
                    onChange={e => updateChapter(activeChId, { notes: e.target.value })}
                    placeholder="Notes de chapitre (optionnel)…"
                    rows={2}
                    style={{
                      width: '100%', background: 'transparent',
                      border: 'none', outline: 'none', resize: 'none',
                      fontFamily: 'var(--f-body)', fontSize: 14,
                      color: 'var(--ink-soft)', lineHeight: 1.65,
                      display: 'block',
                    }}
                  />
                </div>

                {/* Séparateur corps */}
                <div style={{ height: 1, background: 'rgba(29,26,22,.15)', marginBottom: 32 }} />

                {/* Corps principal */}
                <RichEditor
                  key={activeChId}
                  ref={editorRef}
                  initialHtml={normalizeBody(activeChapter.body)}
                  onChange={body => updateChapter(activeChId, { body })}
                  style={{
                    width: '100%', minHeight: 500,
                    fontFamily: 'var(--f-body)',
                    fontSize: fontSize,
                    lineHeight: `${lineHeight}px`,
                    color: fontColor,
                    boxSizing: 'border-box',
                    wordBreak: 'break-word',
                    ...(showLines ? (() => {
                      const lp = Math.round(lineHeight * 0.82)
                      return {
                        backgroundImage: `linear-gradient(transparent ${lp}px, rgba(29,26,22,.35) ${lp}px, rgba(29,26,22,.35) ${lp + 1}px, transparent ${lp + 1}px)`,
                        backgroundSize: `100% ${lineHeight}px`,
                        backgroundRepeat: 'repeat',
                      }
                    })() : {}),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stats bas */}
          <div style={{
            position: 'sticky', bottom: 0, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20,
            padding: '8px 40px', marginTop: 'auto',
            background: 'rgba(255,250,240,.82)', backdropFilter: 'blur(4px)',
            borderTop: '1px dotted rgba(0,0,0,.08)',
          }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--ink-mute)' }}>
              total : {totalWords.toLocaleString('fr-FR')} mots · {chapters.length} ch.
            </div>
          </div>
        </div>
      )}

      <div className="floral-corner" style={{ opacity: .2, pointerEvents: 'none' }} />
    </Page>
  )
}
