import { useState, useEffect } from 'react'
import { Page, Header, Sticky, Tape } from '../components/JournalShared'
import { supabase } from '../lib/supabase'
import TagInput from '../components/TagInput'
import ImageUpload from '../components/ImageUpload'
import { BloodDrop, StarMark, RatingIcon } from '../components/JournalShared'

const EMPTY_FIC = {
  work_name: '', author_name: '', universe_name: '', ships: [], link: '', image_url: '',
  summary: '', my_review: '', tags: [],
  rank: '', rating: '', word_count: '', chapter_count: '', read_count: '',
  good_ending: false, bad_ending: false,
  content_rating: '',
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
    good_ending:     fic.good_ending,
    bad_ending:      fic.bad_ending,
    content_rating:  fic.content_rating || null,
  }
}

const ENDING_LABEL = { happy: 'happy end ✿', bad: 'bad end', open: 'open end' }
const ENDING_COLOR = { happy: 'var(--lime-d)', bad: 'var(--primrose)', open: 'var(--ink-mute)' }
function ficEnding(f) {
  if (f.good_ending && !f.bad_ending) return 'happy'
  if (f.bad_ending  && !f.good_ending) return 'bad'
  return 'open'
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

function FicForm({ state, setState, onSubmit, status, submitLabel, tapeLabel, tapeColor = 'var(--primrose)' }) {
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
        {field(state, setState, 'link',          'LIEN AO3',       { placeholder: 'https://archiveofourown.org/…', mono: true })}
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
            { val: 'happy', label: 'happy end ✿',  icon: null },
            { val: 'bad',   label: 'bad end',       icon: <BloodDrop size={13} style={{ marginRight: 2 }} /> },
            { val: 'open',  label: 'open end',      icon: <StarMark  size={13} style={{ marginRight: 2 }} /> },
          ].map(({ val, label, icon }) => {
            const current = state.good_ending && !state.bad_ending ? 'happy' : state.bad_ending && !state.good_ending ? 'bad' : 'open'
            const active = current === val
            return (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'var(--f-hand)', fontSize: 18 }}>
                <input type="radio" name="ending" checked={active}
                  onChange={() => setState(f => ({
                    ...f,
                    good_ending: val === 'happy',
                    bad_ending:  val === 'bad',
                  }))}
                  style={{ width: 15, height: 15, accentColor: 'var(--primrose)', cursor: 'pointer' }} />
                {icon}{label}
              </label>
            )
          })}
        </div>
        {/* Classement de contenu */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>CONTENU</div>
          {[
            { val: 'no_sex',   label: 'No Sex',  icon: <RatingIcon kind="no_sex"   size={20} style={{ marginRight: 4 }} /> },
            { val: 'vanilla',  label: 'Sex Vanilla',  icon: <RatingIcon kind="vanilla"  size={20} style={{ marginRight: 4 }} /> },
            { val: 'explicit', label: 'Sex Hardcore',       icon: <RatingIcon kind="explicit" size={20} style={{ marginRight: 4 }} /> },
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
        {field(state, setState, 'summary',   'RESUME',     { full: true, textarea: true, placeholder: 'resume de la fic…' })}
        {field(state, setState, 'my_review', 'MA REVIEW',  { full: true, textarea: true, placeholder: 'mes impressions…', dotted: true })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
        <span className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: status === 'saved' ? 'var(--lime-d)' : status === 'error' ? 'var(--primrose)' : 'transparent', transition: 'color .3s' }}>
          {status === 'saved' ? '✓ sauvegardé' : status === 'error' ? '✕ erreur' : '·'}
        </span>
        <button onClick={onSubmit} className="btn-stamp" style={{ padding: '10px 22px', fontSize: 13 }}>
          {status === 'saving' ? '⟳ …' : submitLabel}
        </button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [ficsTotal,    setFicsTotal]    = useState('…')
  const [userId,       setUserId]       = useState(null)
  const [fics,         setFics]         = useState([])

  // Citations
  const [quotes,       setQuotes]       = useState([])
  const [newQuote,     setNewQuote]     = useState({ text: '', author: '' })
  const [quoteStatus,  setQuoteStatus]  = useState('idle')

  // Edition
  const [editId,     setEditId]     = useState(null)
  const [editFic,    setEditFic]    = useState(EMPTY_FIC)
  const [editStatus, setEditStatus] = useState('idle')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const [{ count }, { data: ficsData }] = await Promise.all([
        supabase.from('fanfictions').select('*', { count: 'exact', head: true }),
        supabase.from('fanfictions').select('id,work_name,author_name,universe_name,ship_name,rank,rating,word_count,chapter_count,read_count,good_ending,bad_ending,link,image_url,summary,my_review,tags,content_rating').order('rank', { ascending: true, nullsFirst: false }),
      ])

      setFicsTotal(count ?? 0)
      setFics(ficsData ?? [])

      const { data: quotesData } = await supabase.from('quotes').select('*').order('id')
      setQuotes(quotesData ?? [])
    }
    load()
  }, [])

  async function refreshFics() {
    const [{ count }, { data: ficsData }] = await Promise.all([
      supabase.from('fanfictions').select('*', { count: 'exact', head: true }),
      supabase.from('fanfictions').select('id,work_name,author_name,universe_name,ship_name,rank,rating,word_count,chapter_count,read_count,good_ending,bad_ending,link,image_url,summary,my_review,tags,content_rating').order('rank', { ascending: true, nullsFirst: false }),
    ])
    setFicsTotal(count ?? 0)
    setFics(ficsData ?? [])
  }

  // ── Edition de fic ──
  function startEdit(f) {
    setEditId(f.id)
    setEditFic({
      work_name:     f.work_name     ?? '',
      author_name:   f.author_name   ?? '',
      universe_name: f.universe_name ?? '',
      ships:         f.ship_name ? f.ship_name.split(' & ') : [],
      link:          f.link          ?? '',
      image_url:     f.image_url     ?? '',
      summary:       f.summary       ?? '',
      my_review:     f.my_review     ?? '',
      tags:          f.tags          ?? [],
      rank:          f.rank != null  ? String(f.rank)   : '',
      rating:        f.rating != null ? String(f.rating) : '',
      word_count:    f.word_count    != null ? String(f.word_count)    : '',
      chapter_count: f.chapter_count != null ? String(f.chapter_count) : '',
      read_count:    f.read_count    != null ? String(f.read_count)    : '',
      good_ending:    f.good_ending    ?? false,
      bad_ending:     f.bad_ending     ?? false,
      content_rating: f.content_rating ?? '',
    })
    setShowFicForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveEdit() {
    setEditStatus('saving')
    const { error } = await supabase.from('fanfictions').update(buildPayload(editFic)).eq('id', editId)
    if (!error) {
      setEditId(null)
      await refreshFics()
    }
    setEditStatus(error ? 'error' : 'saved')
    setTimeout(() => setEditStatus('idle'), 2500)
  }

  // ── Citations ──
  async function addQuote() {
    if (!newQuote.text.trim()) return
    setQuoteStatus('saving')
    const { data, error } = await supabase.from('quotes').insert({
      text: newQuote.text.trim(),
      author: newQuote.author.trim() || null,
    }).select().single()
    if (!error) {
      setQuotes(prev => [...prev, data])
      setNewQuote({ text: '', author: '' })
    }
    setQuoteStatus(error ? 'error' : 'saved')
    setTimeout(() => setQuoteStatus('idle'), 2500)
  }

  async function deleteQuote(id, preview) {
    if (!confirm(`Supprimer "${preview}" ?`)) return
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (!error) setQuotes(prev => prev.filter(q => q.id !== id))
  }

  // ── Suppression fic ──
  async function deleteFic(id, name) {
    if (!confirm(`Supprimer "${name || 'cette fic'}" ?`)) return
    const { error } = await supabase.from('fanfictions').delete().eq('id', id)
    if (error) { alert(`Erreur suppression : ${error.message}`); return }
    setFics(prev => prev.filter(f => f.id !== id))
    setFicsTotal(v => Number(v) - 1)
    if (editId === id) setEditId(null)
  }

  return (
    <Page>
      <Header active="admin" />

      <div style={{ padding: '88px 56px 56px' }}>

        {/* En-tete */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>ADMIN · index / tableau de bord</div>
            <div className="heading-handwritten" style={{ fontSize: 48, marginTop: 8, color: 'var(--ink)' }}>journal log</div>
          </div>
          <Sticky bg="var(--lime)" rot={2} style={{ width: 180, color: '#fff', position: 'relative' }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', opacity: .85 }}>FICS TOTAL</div>
            <div className="serif" style={{ fontSize: 36, marginTop: 4 }}>{ficsTotal}</div>
          </Sticky>
        </div>

        {/* Formulaire edition */}
        {editId && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>MODIFIER LA FIC</div>
              <button onClick={() => setEditId(null)} className="btn-stamp" style={{ padding: '6px 14px', fontSize: 11, background: 'var(--ink)', color: 'var(--paper)' }}>× annuler</button>
            </div>
            <FicForm
              state={editFic} setState={setEditFic}
              onSubmit={saveEdit} status={editStatus}
              submitLabel="sauvegarder ✦"
              tapeLabel="modifier l'entree"
              tapeColor="var(--yucca)"
            />
          </div>
        )}



        {/* Liste des fics */}
        <div style={{ marginBottom: 40 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 16 }}>
            MES FICS · {fics.length} entrees
          </div>

          {fics.length === 0 ? (
            <div className="handwriting" style={{ fontSize: 20, color: 'var(--ink-mute)', padding: '24px 0' }}>aucune fic enregistree…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* En-tete colonne */}
              <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 140px 100px 60px 60px 80px', gap: '0 12px', padding: '6px 12px', borderBottom: '1.5px solid rgba(29,26,22,.12)' }}>
                {['RANK', 'TITRE / AUTEUR', 'FANDOM', 'SHIP', 'MOTS', 'NOTE', ''].map(h => (
                  <div key={h} className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>{h}</div>
                ))}
              </div>

              {fics.map((f, i) => {
                const ending = ficEnding(f)
                return (
                  <div
                    key={f.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 140px 100px 60px 60px 80px',
                      gap: '0 12px',
                      padding: '10px 12px',
                      background: editId === f.id ? 'rgba(182,187,121,.15)' : i % 2 === 0 ? 'transparent' : 'rgba(29,26,22,.025)',
                      borderBottom: '1px dotted rgba(29,26,22,.08)',
                      alignItems: 'center',
                      transition: 'background .15s',
                    }}
                  >
                    {/* Rank */}
                    <div className="serif" style={{ fontSize: 15, color: 'var(--primrose)' }}>
                      {f.rank != null ? `#${f.rank}` : '—'}
                    </div>

                    {/* Titre + auteur */}
                    <div style={{ minWidth: 0 }}>
                      <div className="handwriting" style={{ fontSize: 17, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.work_name || '(sans titre)'}
                      </div>
                      {f.author_name && (
                        <div className="mono" style={{ fontSize: 8, color: 'var(--ink-mute)', letterSpacing: '.12em', marginTop: 1 }}>
                          {f.author_name}
                        </div>
                      )}
                      <div className="mono" style={{ fontSize: 8, marginTop: 2, color: ENDING_COLOR[ending], display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {ending === 'bad' ? <BloodDrop size={9} /> : ending === 'open' ? <StarMark size={9} /> : null}
                        {ENDING_LABEL[ending]}
                      </div>
                    </div>

                    {/* Fandom */}
                    <div className="serif" style={{ fontSize: 13, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.universe_name || '—'}
                    </div>

                    {/* Ship */}
                    <div className="handwriting" style={{ fontSize: 14, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.ship_name || '—'}
                    </div>

                    {/* Mots */}
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                      {f.word_count ? Number(f.word_count).toLocaleString('fr-FR') : '—'}
                    </div>

                    {/* Note */}
                    <div className="serif" style={{ fontSize: 14, color: 'var(--ink)' }}>
                      {f.rating != null ? `${f.rating}/10` : '—'}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => startEdit(f)}
                        title="modifier"
                        style={{ background: 'none', border: '1px solid rgba(29,26,22,.2)', borderRadius: 3, cursor: 'pointer', padding: '3px 8px', fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-mute)', transition: 'all .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--yucca)'; e.currentTarget.style.borderColor = 'var(--yucca)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(29,26,22,.2)' }}
                      >edit</button>
                      <button
                        onClick={() => deleteFic(f.id, f.work_name)}
                        title="supprimer"
                        style={{ background: 'none', border: '1px solid rgba(29,26,22,.2)', borderRadius: 3, cursor: 'pointer', padding: '3px 8px', fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-mute)', transition: 'all .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primrose)'; e.currentTarget.style.borderColor = 'var(--primrose)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(29,26,22,.2)' }}
                      >del</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Citations ── */}
        <div style={{ marginBottom: 40 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 20 }}>
            CITATIONS · {quotes.length} entrée{quotes.length !== 1 ? 's' : ''}
          </div>

          {/* Formulaire ajout */}
          <div className="card" style={{ padding: '24px 28px', position: 'relative', transform: 'rotate(-0.2deg)', marginBottom: 20 }}>
            <Tape kind="dots" color="var(--lime)" rot={-2} style={{ top: -12, left: 44, fontSize: 10, padding: '3px 12px' }}>nouvelle citation</Tape>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 10 }}>
              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 5 }}>TEXTE</div>
                <textarea
                  value={newQuote.text}
                  onChange={e => setNewQuote(q => ({ ...q, text: e.target.value }))}
                  placeholder="La citation…"
                  rows={3}
                  style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1.4px solid var(--ink)', fontFamily: 'var(--f-hand)', fontSize: 18, color: 'var(--ink)', outline: 'none', resize: 'none', paddingBottom: 4 }}
                />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 5 }}>AUTEUR (optionnel)</div>
                <input
                  value={newQuote.author}
                  onChange={e => setNewQuote(q => ({ ...q, author: e.target.value }))}
                  placeholder="nom de l'auteur·rice…"
                  style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1.4px dotted var(--ink)', fontFamily: 'var(--f-hand)', fontSize: 18, color: 'var(--ink)', outline: 'none', paddingBottom: 4 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 20 }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: quoteStatus === 'saved' ? 'var(--lime-d)' : quoteStatus === 'error' ? 'var(--primrose)' : 'transparent', transition: 'color .3s' }}>
                {quoteStatus === 'saved' ? '✓ ajoutée' : quoteStatus === 'error' ? '✕ erreur' : '·'}
              </span>
              <button onClick={addQuote} className="btn-stamp" style={{ padding: '10px 22px', fontSize: 13 }}>
                {quoteStatus === 'saving' ? '⟳ …' : 'ajouter ✦'}
              </button>
            </div>
          </div>

          {/* Liste des citations */}
          {quotes.length === 0 ? (
            <div className="handwriting" style={{ fontSize: 18, color: 'var(--ink-mute)', padding: '16px 0' }}>aucune citation pour l'instant…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 60px', gap: '0 12px', padding: '6px 12px', borderBottom: '1.5px solid rgba(29,26,22,.12)' }}>
                {['TEXTE', 'AUTEUR', ''].map(h => (
                  <div key={h} className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>{h}</div>
                ))}
              </div>
              {quotes.map((q, i) => (
                <div key={q.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 60px', gap: '0 12px',
                  padding: '10px 12px', alignItems: 'center',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(29,26,22,.025)',
                  borderBottom: '1px dotted rgba(29,26,22,.08)',
                }}>
                  <div className="handwriting" style={{ fontSize: 16, color: 'var(--ink)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    «&nbsp;{q.text}&nbsp;»
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.author || '—'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => deleteQuote(q.id, q.text.slice(0, 30))}
                      style={{ background: 'none', border: '1px solid rgba(29,26,22,.2)', borderRadius: 3, cursor: 'pointer', padding: '3px 8px', fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-mute)', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--primrose)'; e.currentTarget.style.borderColor = 'var(--primrose)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(29,26,22,.2)' }}
                    >del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>─ 05 / 05 ─</span>
        </div>

      </div>
    </Page>
  )
}
