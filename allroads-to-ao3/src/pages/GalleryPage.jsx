import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Page, Header, Tape, BloodDrop, StarMark, FloralCluster, Doodle, Sticker, RatingIcon, RatingFlower, RatingPeach } from '../components/JournalShared'
import { supabase } from '../lib/supabase'
import TagInput from '../components/TagInput'
import ImageUpload from '../components/ImageUpload'
import { IconicPoseOverlay } from '../components/SpriteAnimation'
import HigurumaMascot from '../components/HigurumaMascot'
import iconicPose from '../assets/HigurumaIconicPose.png'
import buttImg from '../assets/butt.png'

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

function folderIcon(name) {
  return FOLDER_ICONS[strHue(name) % FOLDER_ICONS.length]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const TAPE_KINDS = ['check', 'dots', 'clean', 'grid']
const ROTS = [-3, 2, -2, 3, -1, 1]

function strHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h % 360
}

function cardGradient(name) {
  const h = strHue(name)
  return `linear-gradient(160deg, hsl(${h},52%,80%), hsl(${(h + 45) % 360},48%,55%))`
}

const ENDING_LABEL = { happy: 'happy end ✿', bad: 'bad end', open: 'open end' }

function ficEnding(fic) {
  if (fic.good_ending && !fic.bad_ending) return 'happy'
  if (fic.bad_ending && !fic.good_ending) return 'bad'
  return 'open'
}

// ── Dossier univers ────────────────────────────────────────────────────────────
function UniverseFolder({ name, count, onClick }) {
  const [hov, setHov] = useState(false)
  const icon = folderIcon(name)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8, width: '100%',
        transform: hov ? 'translateY(-6px) scale(1.04)' : 'none',
        transition: 'transform .18s ease',
      }}>
      <img
        src={icon}
        alt={name}
        style={{
          width: 110, height: 'auto',
          filter: hov ? 'drop-shadow(0 8px 16px rgba(60,40,20,.30))' : 'drop-shadow(0 3px 6px rgba(60,40,20,.15))',
          transition: 'filter .18s',
          pointerEvents: 'none',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <div className="handwriting" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1.2, wordBreak: 'break-word' }}>
          {name}
        </div>
        <div className="mono" style={{ fontSize: 8, letterSpacing: '.22em', color: 'var(--ink-mute)', marginTop: 2 }}>
          {count} fic{count !== 1 ? 's' : ''}
        </div>
      </div>
    </button>
  )
}

// ── Couverture de livre ────────────────────────────────────────────────────────
const RATINGS = [
  { key: 'no_sex',   title: 'Pas de contenu sexuel', icon: (s) => <RatingFlower size={s} /> },
  { key: 'vanilla',  title: 'Contenu vanilla',       icon: (s) => <RatingPeach  size={s} /> },
  { key: 'explicit', title: 'Contenu explicite',      icon: (s) => <img src={buttImg} alt="explicit" style={{ width: s, height: s, objectFit: 'contain' }} /> },
]

function BookCover({ fic, onCoverChange, onRatingChange, canEdit }) {
  const h = strHue(fic.work_name || '')
  const hasCover = Boolean(fic.image_url)
  const coverBg = hasCover
    ? { backgroundImage: `url(${fic.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(180deg, hsl(${h},52%,72%) 0%, hsl(${(h + 60) % 360},48%,42%) 100%)` }
  const [hov, setHov] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState(null)
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadErr(null)
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${fic.id}-cover.${ext}`
    const { error: upErr } = await supabase.storage.from('fanfiction-covers').upload(path, file, { upsert: true })
    if (upErr) {
      setUploadErr(upErr.message)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('fanfiction-covers').getPublicUrl(path)
      const { error: dbErr } = await supabase.from('fanfictions').update({ image_url: publicUrl }).eq('id', fic.id)
      if (dbErr) setUploadErr(dbErr.message)
      else onCoverChange?.(fic.id, publicUrl)
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ position: 'relative', transform: hov ? 'translateY(-6px) rotate(0.5deg)' : 'rotate(-0.3deg)', transition: 'transform .18s ease' }}>

        <Link to={`/fic/${fic.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ display: 'flex', borderRadius: '2px 4px 4px 2px', overflow: 'hidden',
            boxShadow: hov
              ? '6px 6px 20px rgba(60,40,20,.32), inset -5px 0 10px rgba(0,0,0,.18)'
              : '3px 4px 12px rgba(60,40,20,.2), inset -5px 0 10px rgba(0,0,0,.12)',
            transition: 'box-shadow .18s',
          }}>
            <div style={{ width: 11, background: `hsl(${h},55%,38%)`, flexShrink: 0 }} />
            <div style={{ width: 132, height: 188, ...coverBg, position: 'relative', overflow: 'hidden' }}>
              {!hasCover && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-end', padding: '12px 10px',
                  background: 'linear-gradient(to top, rgba(0,0,0,.58) 0%, transparent 55%)',
                }}>
                  <div className="handwriting" style={{ fontSize: 15, color: '#fff', lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {fic.work_name}
                  </div>
                  {fic.author_name && (
                    <div className="mono" style={{ fontSize: 8, letterSpacing: '.1em', color: 'rgba(255,255,255,.78)', marginTop: 4 }}>
                      {fic.author_name}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Bouton upload cover */}
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            position: 'absolute', bottom: 6, right: 6,
            width: 26, height: 26, borderRadius: '50%',
            background: uploading ? 'var(--lime)' : 'rgba(255,250,240,.92)',
            border: '1.2px solid rgba(29,26,22,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.18)',
            opacity: hov || uploading ? 1 : 0,
            transition: 'opacity .15s',
            fontSize: 13, lineHeight: 1,
          }}
          title="changer la couverture"
        >
          {uploading ? '…' : '📷'}
        </button>
        <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      <div style={{ marginTop: 7, paddingLeft: 11, maxWidth: 143 }}>
        <div className="handwriting" style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {fic.work_name}
        </div>

        {/* Boutons content rating */}
        <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
          {RATINGS.map(r => {
            const active = fic.content_rating === r.key
            return (
              <button
                key={r.key}
                title={r.title}
                onClick={() => canEdit && onRatingChange?.(fic.id, active ? null : r.key)}
                style={{
                  width: 26, height: 26, borderRadius: '50%', padding: 3,
                  border: active ? '2px solid var(--ink)' : '1.5px solid rgba(29,26,22,.18)',
                  background: active ? 'rgba(255,250,240,.95)' : 'rgba(255,250,240,.6)',
                  cursor: canEdit ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 2px 6px rgba(0,0,0,.15)' : 'none',
                  transition: 'border .15s, box-shadow .15s',
                  opacity: !fic.content_rating || active ? 1 : 0.45,
                }}
              >
                {r.icon(16)}
              </button>
            )
          })}
        </div>

        {uploadErr && (
          <div className="mono" style={{ fontSize: 8, color: 'var(--primrose)', letterSpacing: '.08em', marginTop: 4, wordBreak: 'break-all' }}>
            ✕ {uploadErr}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Carte polaroid (vue intérieure univers) ────────────────────────────────────
function FicCard({ fic, i, onRatingChange, canEdit }) {
  const tapeKind = TAPE_KINDS[i % TAPE_KINDS.length]
  const rot = ROTS[i % ROTS.length]
  const tags = fic.tags ?? []
  const shown = tags.slice(0, 2)
  const extra = tags.length - shown.length
  const bg = fic.image_url
    ? { backgroundImage: `url(${fic.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: cardGradient(fic.universe_name) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Link to={`/fic/${fic.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ position: 'relative', height: 320, display: 'flex', justifyContent: 'center' }}>
          <Tape kind={tapeKind} color={i % 2 === 0 ? 'var(--primrose)' : 'var(--lime)'} rot={i % 2 === 0 ? -8 : 6}
            style={{ top: -10, left: 30, fontSize: 11, padding: '4px 12px' }}>
            {shown[0] ?? '—'}{extra > 0 ? ` +${extra}` : shown[1] ? ` · ${shown[1]}` : ''}
          </Tape>
          <div style={{ transform: `rotate(${rot}deg)`, background: '#fffaf0', padding: '10px 10px 14px', width: 230, boxShadow: '0 12px 24px rgba(60,40,20,.18), 0 2px 0 rgba(0,0,0,.04)' }}>
            <div style={{ width: '100%', height: 170, ...bg, position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 10 }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'rgba(255,250,240,.92)', background: 'rgba(0,0,0,.28)', padding: '3px 6px' }}>
                {(fic.universe_name ?? '—').toUpperCase()}
              </span>
            </div>
            <div style={{ marginTop: 12, padding: '0 4px' }}>
              <div className="handwriting" style={{ fontSize: 22, lineHeight: 1.05, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fic.work_name ?? '—'}
              </div>
              {fic.author_name && (
                <div className="mono" style={{ fontSize: 8, letterSpacing: '.15em', color: 'var(--ink-mute)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {fic.author_name}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--primrose)', letterSpacing: 1 }}>
                  {fic.rank != null ? `#${fic.rank}` : ''}
                </span>
                <span className="mono" style={{ fontSize: 8, letterSpacing: '.15em', color: 'var(--ink-mute)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  {ficEnding(fic) === 'bad' ? <BloodDrop size={9} /> : ficEnding(fic) === 'open' ? <StarMark size={9} /> : null}
                  {ENDING_LABEL[ficEnding(fic)]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Boutons content rating */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {RATINGS.map(r => {
          const active = fic.content_rating === r.key
          return (
            <button
              key={r.key}
              title={r.title}
              onClick={() => canEdit && onRatingChange?.(fic.id, active ? null : r.key)}
              style={{
                width: 30, height: 30, borderRadius: '50%', padding: 4,
                border: active ? '2px solid var(--ink)' : '1.5px solid rgba(29,26,22,.18)',
                background: active ? 'rgba(255,250,240,.98)' : 'rgba(255,250,240,.65)',
                cursor: canEdit ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,.18)' : 'none',
                transition: 'border .15s, box-shadow .15s, opacity .15s',
                opacity: !fic.content_rating || active ? 1 : 0.4,
              }}
            >
              {r.icon(18)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

const EMPTY_FIC = {
  work_name: '', author_name: '', universe_name: '', ships: [], link: '', image_url: '',
  summary: '', my_review: '', tags: [],
  rank: '', rating: '', word_count: '', chapter_count: '', read_count: '',
  good_ending: false, bad_ending: false, content_rating: '',
}

function buildPayload(fic) {
  return {
    work_name:     fic.work_name.trim()     || null,
    author_name:   fic.author_name.trim()   || null,
    universe_name: fic.universe_name.trim() || null,
    ship_name:     fic.ships?.length ? fic.ships.join(' & ') : null,
    link:          fic.link.trim()          || null,
    image_url:     fic.image_url.trim()     || null,
    summary:       fic.summary.trim()       || null,
    my_review:     fic.my_review.trim()     || null,
    tags:          fic.tags.length ? fic.tags : null,
    rank:          parseInt(fic.rank)       || null,
    rating:        parseFloat(fic.rating)   || null,
    word_count:    parseInt(fic.word_count) || null,
    chapter_count: parseInt(fic.chapter_count) || null,
    read_count:    parseInt(fic.read_count) || null,
    good_ending:   fic.good_ending,
    bad_ending:    fic.bad_ending,
    content_rating: fic.content_rating || null,
  }
}

function field(state, setState, key, label, opts = {}) {
  return (
    <div key={key} style={opts.full ? { gridColumn: '1 / -1' } : {}}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 5 }}>{label}</div>
      {opts.textarea ? (
        <textarea
          value={state[key]} rows={3}
          onChange={e => setState(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts.placeholder ?? ''}
          style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1.4px dotted var(--ink)', fontFamily: 'var(--f-hand)', fontSize: 17, color: 'var(--ink)', outline: 'none', resize: 'none', paddingBottom: 4 }}
        />
      ) : (
        <input
          type={opts.type ?? 'text'}
          value={state[key]}
          onChange={e => setState(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts.placeholder ?? ''}
          style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1.4px ${opts.dotted ? 'dotted' : 'solid'} var(--ink)`, fontFamily: opts.mono ? 'var(--f-mono)' : 'var(--f-hand)', fontSize: opts.mono ? 12 : 19, color: 'var(--ink)', outline: 'none', paddingBottom: 4 }}
        />
      )}
    </div>
  )
}

function FicForm({ state, setState, onSubmit, status, submitLabel, tapeLabel, tapeColor = 'var(--primrose)', onCancel }) {
  return (
    <div className="card" style={{ padding: '28px 28px 22px', position: 'relative', transform: 'rotate(-0.2deg)', marginBottom: 28 }}>
      <Tape kind="dots" color={tapeColor} rot={-2} style={{ top: -12, left: 44, fontSize: 10, padding: '3px 12px' }}>{tapeLabel}</Tape>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px', marginTop: 12 }}>
        {field(state, setState, 'work_name',     'TITRE',          { placeholder: 'nom de la fic…' })}
        {field(state, setState, 'author_name',   'AUTEUR·RICE',    { placeholder: 'nom sur AO3…' })}
        {field(state, setState, 'universe_name', 'UNIVERS',        { placeholder: 'JJK, ATLA, HP…' })}
        <div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 5 }}>SHIP(S)</div>
          <TagInput value={state.ships} onChange={ships => setState(f => ({ ...f, ships }))} placeholder="A/B, C/D…" />
        </div>
        {field(state, setState, 'link', 'LIEN AO3', { placeholder: 'https://archiveofourown.org/…', mono: true })}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 5 }}>IMAGE DE COUVERTURE</div>
          <ImageUpload value={state.image_url} onChange={url => setState(f => ({ ...f, image_url: url }))} bucket="fanfiction-covers" />
        </div>
        {field(state, setState, 'rank',          'RANK (1–500)',   { type: 'number', placeholder: '42' })}
        {field(state, setState, 'rating',        'NOTE',           { type: 'number', placeholder: '8.5' })}
        {field(state, setState, 'word_count',    'NOMBRE DE MOTS', { type: 'number', placeholder: '94300' })}
        {field(state, setState, 'chapter_count', 'CHAPITRES',      { type: 'number', placeholder: '22' })}
        {field(state, setState, 'read_count',    'FOIS LU',        { type: 'number', placeholder: '1' })}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 5 }}>TAGS</div>
          <TagInput value={state.tags} onChange={tags => setState(f => ({ ...f, tags }))} />
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>ENDING</div>
          {[
            { val: 'happy', label: 'happy end ✿', icon: null },
            { val: 'bad',   label: 'bad end',      icon: <BloodDrop size={13} style={{ marginRight: 2 }} /> },
            { val: 'open',  label: 'open end',     icon: <StarMark  size={13} style={{ marginRight: 2 }} /> },
          ].map(({ val, label, icon }) => {
            const current = state.good_ending && !state.bad_ending ? 'happy' : state.bad_ending && !state.good_ending ? 'bad' : 'open'
            const active = current === val
            return (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'var(--f-hand)', fontSize: 18 }}>
                <input type="radio" name="ending" checked={active}
                  onChange={() => setState(f => ({ ...f, good_ending: val === 'happy', bad_ending: val === 'bad' }))}
                  style={{ width: 15, height: 15, accentColor: 'var(--primrose)', cursor: 'pointer' }} />
                {icon}{label}
              </label>
            )
          })}
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>CONTENU</div>
          {[
            { val: 'no_sex',   label: 'No Sex',        icon: <RatingIcon kind="no_sex"   size={20} style={{ marginRight: 4 }} /> },
            { val: 'vanilla',  label: 'Sex Vanilla',   icon: <RatingIcon kind="vanilla"  size={20} style={{ marginRight: 4 }} /> },
            { val: 'explicit', label: 'Sex Hardcore',  icon: <RatingIcon kind="explicit" size={20} style={{ marginRight: 4 }} /> },
          ].map(({ val, label, icon }) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'var(--f-hand)', fontSize: 17 }}>
              <input type="radio" name="content_rating" checked={state.content_rating === val}
                onChange={() => setState(f => ({ ...f, content_rating: val }))}
                style={{ width: 15, height: 15, accentColor: 'var(--primrose)', cursor: 'pointer' }} />
              {icon}{label}
            </label>
          ))}
          {state.content_rating && (
            <button type="button" onClick={() => setState(f => ({ ...f, content_rating: '' }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-mute)', padding: 0, marginLeft: 4 }}>
              × effacer
            </button>
          )}
        </div>
        {field(state, setState, 'summary',   'RÉSUMÉ',    { full: true, textarea: true, placeholder: 'résumé de la fic…' })}
        {field(state, setState, 'my_review', 'MA REVIEW', { full: true, textarea: true, placeholder: 'mes impressions…', dotted: true })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
        <span className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: status === 'saved' ? 'var(--lime-d)' : status === 'error' ? 'var(--primrose)' : 'transparent', transition: 'color .3s' }}>
          {status === 'saved' ? '✓ sauvegardé' : status === 'error' ? '✕ erreur' : '·'}
        </span>
        {onCancel && (
          <button onClick={onCancel} className="btn-stamp btn-stamp--ghost" style={{ padding: '10px 16px', fontSize: 13 }}>× annuler</button>
        )}
        <button onClick={onSubmit} className="btn-stamp" style={{ padding: '10px 22px', fontSize: 13 }}>
          {status === 'saving' ? '⟳ …' : submitLabel}
        </button>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const location = useLocation()
  const [showHiguruma,      setShowHiguruma]      = useState(false)
  const [fics,              setFics]              = useState([])
  const [loading,           setLoading]           = useState(true)
  const [error,             setError]             = useState(null)
  const [selectedUniverse,  setSelectedUniverse]  = useState(null)
  const [search,            setSearch]            = useState('')
  const [sortRank,          setSortRank]          = useState(null)
  const [sortRating,        setSortRating]        = useState(null)
  const [filterRating,      setFilterRating]      = useState(null)
  const [filterNoteMin,     setFilterNoteMin]     = useState(null)
  const [filterNoteMax,     setFilterNoteMax]     = useState(null)
  const [filterRankMin,     setFilterRankMin]     = useState(null)
  const [filterRankMax,     setFilterRankMax]     = useState(null)
  const [openFilter,        setOpenFilter]        = useState(null)
  const [page,              setPage]              = useState(1)
  const [session,           setSession]           = useState(undefined)
  const [showAddForm,       setShowAddForm]       = useState(false)
  const [newFic,            setNewFic]            = useState(EMPTY_FIC)
  const [addStatus,         setAddStatus]         = useState('idle')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    supabase.from('fanfictions').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else {
          setFics(data || [])
          const target = location.state?.openUniverse
          if (target) setSelectedUniverse(target)
        }
        setLoading(false)
      })
  }, [])

  async function addFic() {
    if (!newFic.work_name.trim()) return
    setAddStatus('saving')
    const payload = { ...buildPayload(newFic), user_id: session.user.id }
    const { data, error } = await supabase.from('fanfictions').insert(payload).select().single()
    if (error) { setAddStatus('error'); console.error(error); return }
    setFics(prev => [data, ...prev])
    setAddStatus('saved')
    setTimeout(() => {
      setNewFic(EMPTY_FIC)
      setShowAddForm(false)
      setAddStatus('idle')
    }, 1200)
  }

  // Regroupement par univers
  const universeMap = fics.reduce((acc, fic) => {
    const u = fic.universe_name || '—'
    if (!acc[u]) acc[u] = []
    acc[u].push(fic)
    return acc
  }, {})
  const universes = Object.keys(universeMap).sort()

  // Fics de l'univers sélectionné, filtrées + triées
  const universeFics = selectedUniverse ? (universeMap[selectedUniverse] || []) : []
  const filtered = universeFics.filter(fic => {
    if (filterRating && fic.content_rating !== filterRating) return false
    if (filterNoteMin !== null && (fic.rating ?? -Infinity) < filterNoteMin) return false
    if (filterNoteMax !== null && (fic.rating ?? Infinity) > filterNoteMax) return false
    if (filterRankMin !== null && (fic.rank ?? Infinity) < filterRankMin) return false
    if (filterRankMax !== null && (fic.rank ?? Infinity) > filterRankMax) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      fic.work_name?.toLowerCase().includes(q) ||
      fic.author_name?.toLowerCase().includes(q) ||
      fic.ship_name?.toLowerCase().includes(q) ||
      (fic.tags ?? []).some(t => t.toLowerCase().includes(q))
    )
  })
  const sorted = [...filtered].sort((a, b) => {
    if (sortRank) {
      const ar = a.rank ?? Infinity, br = b.rank ?? Infinity
      if (ar !== br) return sortRank === 'asc' ? ar - br : br - ar
    }
    if (sortRating) {
      const ar = a.rating ?? -Infinity, br = b.rating ?? -Infinity
      if (ar !== br) return sortRating === 'asc' ? ar - br : br - ar
    }
    return 0
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Fics bookmarkées

  function openUniverse(name) {
    setSelectedUniverse(name)
    setSearch('')
    setSortRank(null)
    setSortRating(null)
    setFilterRating(null)
    setFilterNoteMin(null)
    setFilterNoteMax(null)
    setFilterRankMin(null)
    setFilterRankMax(null)
    setOpenFilter(null)
    setPage(1)
  }

  function handleCoverChange(ficId, url) {
    setFics(prev => prev.map(f => f.id === ficId ? { ...f, image_url: url } : f))
  }

  async function handleRatingChange(ficId, rating) {
    const prev = fics.find(f => f.id === ficId)?.content_rating ?? null
    setFics(fs => fs.map(f => f.id === ficId ? { ...f, content_rating: rating } : f))
    const { error, data } = await supabase.from('fanfictions').update({ content_rating: rating }).eq('id', ficId).select('content_rating').single()
    if (error) {
      console.error('Erreur sauvegarde rating:', error.code, error.message, error.details)
      alert(`Erreur rating: ${error.message}`)
      setFics(fs => fs.map(f => f.id === ficId ? { ...f, content_rating: prev } : f))
    }
  }

  function backToFolders() {
    setSelectedUniverse(null)
    setSearch('')
    setSortRank(null)
    setSortRating(null)
    setFilterRating(null)
    setFilterNoteMin(null)
    setFilterNoteMax(null)
    setFilterRankMin(null)
    setFilterRankMax(null)
    setOpenFilter(null)
    setPage(1)
  }

  return (
    <>
      <Page>
        <Header active="gallery" />

        <div style={{ padding: '88px 56px 56px' }}>

          {/* ── En-tête ── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div style={{ position: 'relative' }}>
              {selectedUniverse ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <button onClick={backToFolders} className="btn-stamp btn-stamp--ghost" style={{ padding: '6px 12px', fontSize: 11 }}>
                      ← dossiers
                    </button>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>
                      / {selectedUniverse.toUpperCase()}
                    </span>
                  </div>
                  <div className="heading-handwritten" style={{ fontSize: 'clamp(40px, 6vw, 72px)', color: 'var(--ink)', lineHeight: .95 }}>
                    {selectedUniverse}
                  </div>
                </>
              ) : (
                <>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>SECTION B</div>
                  <div className="heading-handwritten" style={{ fontSize: 'clamp(52px, 7vw, 88px)', color: 'var(--ink)', display: 'inline-block', marginTop: 4 }}>
                    la bibliothèque
                  </div>
                  <FloralCluster size={90} variant={1} style={{ position: 'absolute', top: -10, right: -100, opacity: .55, pointerEvents: 'none' }} />
                </>
              )}
            </div>

            {/* Bouton ajouter */}
            {!selectedUniverse && session && (
              <div style={{ paddingBottom: 8 }}>
                <button
                  onClick={() => setShowAddForm(v => !v)}
                  className="btn-stamp"
                  style={{ padding: '10px 18px', fontSize: 13, background: 'var(--pinktone)', boxShadow: '4px 4px 0 rgba(0,0,0,.08)' }}>
                  {showAddForm ? '× annuler' : '+ ajouter'}
                </button>
              </div>
            )}

            {/* Compteur + tri + filtre rating (vue intérieure) */}
            {selectedUniverse && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 8, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>
                  {sorted.length} fic{sorted.length !== 1 ? 's' : ''}
                </span>
                {[
                  {
                    key: 'rank', label: 'rank',
                    sort: sortRank, setSort: setSortRank,
                    min: filterRankMin, setMin: setFilterRankMin,
                    max: filterRankMax, setMax: setFilterRankMax,
                    minBound: 1, maxBound: 9999, step: 1,
                  },
                  {
                    key: 'note', label: 'note',
                    sort: sortRating, setSort: setSortRating,
                    min: filterNoteMin, setMin: setFilterNoteMin,
                    max: filterNoteMax, setMax: setFilterNoteMax,
                    minBound: 0, maxBound: 10, step: 0.5,
                  },
                ].map(({ key, label, sort, setSort, min, setMin, max, setMax, minBound, maxBound, step }) => {
                  const hasFilter = min !== null || max !== null
                  const active = sort || hasFilter
                  return (
                    <div key={key} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOpenFilter(p => p === key ? null : key)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 11px',
                          fontFamily: 'var(--f-hand)', fontSize: 14,
                          background: active ? 'var(--ink)' : 'var(--pinktone)',
                          color: active ? 'var(--paper)' : 'var(--ink)',
                          border: 'none', borderRadius: 2, cursor: 'pointer',
                          opacity: active ? 1 : .78, transition: 'all .15s',
                        }}>
                        {label} {sort === 'asc' ? '↑' : sort === 'desc' ? '↓' : hasFilter ? '⊙' : '↕'}
                      </button>

                      {openFilter === key && (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20,
                          background: '#fffaf0', border: '1.4px solid rgba(29,26,22,.18)',
                          borderRadius: 6, padding: '12px 14px', minWidth: 190,
                          boxShadow: '0 8px 24px rgba(0,0,0,.13)',
                          display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                          <div className="mono" style={{ fontSize: 8, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>
                            TRI
                          </div>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {[['asc', '↑ croissant'], ['desc', '↓ décroissant']].map(([val, lbl]) => (
                              <button key={val}
                                onClick={() => { setSort(p => p === val ? null : val); setPage(1) }}
                                style={{
                                  flex: 1, padding: '5px 8px',
                                  fontFamily: 'var(--f-hand)', fontSize: 13,
                                  background: sort === val ? 'var(--ink)' : 'transparent',
                                  color: sort === val ? 'var(--paper)' : 'var(--ink)',
                                  border: '1.2px solid rgba(29,26,22,.25)', borderRadius: 3, cursor: 'pointer',
                                  transition: 'all .12s',
                                }}>{lbl}</button>
                            ))}
                          </div>

                          <div>
                            <div className="mono" style={{ fontSize: 8, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 6 }}>
                              INTERVALLE
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="number" min={minBound} max={maxBound} step={step}
                                value={min ?? ''}
                                placeholder={String(minBound)}
                                onChange={e => { setMin(e.target.value === '' ? null : Number(e.target.value)); setPage(1) }}
                                style={{ width: 58, background: 'transparent', border: 'none', borderBottom: '1.2px solid var(--ink)', fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink)', outline: 'none', textAlign: 'center', padding: '2px 0' }} />
                              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>—</span>
                              <input type="number" min={minBound} max={maxBound} step={step}
                                value={max ?? ''}
                                placeholder={String(maxBound)}
                                onChange={e => { setMax(e.target.value === '' ? null : Number(e.target.value)); setPage(1) }}
                                style={{ width: 58, background: 'transparent', border: 'none', borderBottom: '1.2px solid var(--ink)', fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink)', outline: 'none', textAlign: 'center', padding: '2px 0' }} />
                            </div>
                          </div>

                          {active && (
                            <button
                              onClick={() => { setSort(null); setMin(null); setMax(null); setPage(1) }}
                              style={{ fontFamily: 'var(--f-hand)', fontSize: 12, color: 'var(--ink-mute)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                              ✕ effacer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Filtres content rating */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginLeft: 4 }}>
                  {RATINGS.map(r => (
                    <button key={r.key} title={r.title}
                      onClick={() => { setFilterRating(p => p === r.key ? null : r.key); setPage(1) }}
                      style={{
                        width: 30, height: 30, borderRadius: '50%', padding: 4,
                        border: filterRating === r.key ? '2px solid var(--ink)' : '1.5px solid rgba(29,26,22,.2)',
                        background: filterRating === r.key ? 'rgba(255,250,240,.98)' : 'rgba(255,250,240,.6)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: filterRating === r.key ? '0 2px 8px rgba(0,0,0,.18)' : 'none',
                        opacity: filterRating && filterRating !== r.key ? 0.4 : 1,
                        transition: 'all .15s',
                      }}>
                      {r.icon(16)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Formulaire ajout fic ── */}
          {showAddForm && session && (
            <FicForm
              state={newFic} setState={setNewFic}
              onSubmit={addFic} status={addStatus}
              submitLabel="ajouter ✦"
              tapeLabel="nouvelle entrée"
              onCancel={() => { setShowAddForm(false); setNewFic(EMPTY_FIC) }}
            />
          )}

          {/* ── Loading / erreur ── */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>chargement…</div>
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--primrose)', letterSpacing: '.15em' }}>erreur : {error}</div>
            </div>
          )}

          {/* ── VUE DOSSIERS ── */}
          {!loading && !error && !selectedUniverse && (
            universes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Doodle kind="flower" size={48} color="var(--pinktone)" style={{ margin: '0 auto 16px', display: 'block' }} />
                <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>
                  la bibliothèque est vide pour l&apos;instant…
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '28px 20px' }}>
                {universes.map(u => (
                  <UniverseFolder key={u} name={u} count={universeMap[u].length} onClick={() => openUniverse(u)} />
                ))}
              </div>
            )
          )}

          {/* ── VUE INTÉRIEURE UNIVERS ── */}
          {!loading && !error && selectedUniverse && (
            <>
              {/* Barre de recherche */}
              <div style={{ marginBottom: 36 }}>
                <div className="card" style={{ padding: '12px 18px', transform: 'rotate(-0.5deg)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--ink-mute)', flexShrink: 0 }}>RECHERCHE</span>
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    placeholder="titre, auteur, ship…"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--f-hand)', fontSize: 22, color: 'var(--ink)' }}
                  />
                  {search && (
                    <button onClick={() => { setSearch(''); setPage(1) }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--f-mono)', fontSize: 14, color: 'var(--ink-mute)', padding: 0 }}>
                      ×
                    </button>
                  )}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div className="handwriting" style={{ fontSize: 24, color: 'var(--ink-mute)' }}>aucune fic trouvée…</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '48px 30px' }}>
                  {paginated.map((fic, i) => <FicCard key={fic.id} fic={fic} i={i} canEdit={!!session} onRatingChange={handleRatingChange} />)}
                </div>
              )}

              {totalPages > 1 && (
                <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '.22em', color: 'var(--ink)' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    style={{ background: 'none', border: 'none', cursor: safePage === 1 ? 'default' : 'pointer', opacity: safePage === 1 ? .3 : 1, fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '.22em', color: 'var(--ink)', padding: 0 }}>
                    ← prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: n === safePage ? 'var(--ink)' : 'transparent', color: n === safePage ? 'var(--paper)' : 'var(--ink)', border: n === safePage ? 'none' : '1.4px solid var(--ink)', cursor: 'pointer', fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '.1em' }}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    style={{ background: 'none', border: 'none', cursor: safePage === totalPages ? 'default' : 'pointer', opacity: safePage === totalPages ? .3 : 1, fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '.22em', color: 'var(--ink)', padding: 0 }}>
                    next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── VUE À LIRE ── */}

        </div>

        {/* Décoratifs */}
        <Sticker kind="branch"        size={100} rot={15} style={{ position: 'absolute', top: 72, right: 40, opacity: .65 }} />
        <Sticker kind="butterfly_grn" size={70}  rot={-8} style={{ position: 'absolute', bottom: 80, left: 44, opacity: .6 }} />
        <div className="floral-corner floral-corner--br" style={{ opacity: .5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 24, right: 60, fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)', pointerEvents: 'none' }}>
          ─ 02 / 05 ─
        </div>
      </Page>

      <HigurumaMascot />

      {showHiguruma && (
        <IconicPoseOverlay src={iconicPose} totalWidth={1430} frameHeight={255} frames={10} fps={8} scale={1.4} onClose={() => setShowHiguruma(false)} />
      )}
    </>
  )
}
