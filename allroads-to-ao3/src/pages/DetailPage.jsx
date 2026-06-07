import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Page, Header, Tape, Sticky, BloodDrop, StarMark, Chip, Sticker, RatingFlower, RatingPeach } from '../components/JournalShared'
import { supabase } from '../lib/supabase'
import buttImg from '../assets/butt.png'

function RatingBadge({ kind }) {
  if (!kind) return null
  const icon = kind === 'no_sex'   ? <RatingFlower size={16} />
             : kind === 'vanilla'  ? <RatingPeach  size={16} />
             : <img src={buttImg} alt="explicit" style={{ width: 16, height: 16, objectFit: 'contain' }} />
  const label = kind === 'no_sex' ? 'No Sex' : kind === 'vanilla' ? 'Sex Vanilla' : 'Sex Hardcore'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(29,26,22,.06)', borderRadius: 20, padding: '3px 10px' }}>
      {icon}
      <span className="mono" style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--ink-mute)' }}>{label}</span>
    </span>
  )
}

const ENDING_LABEL = { happy: 'happy end ✿', bad: 'bad end', open: 'open end' }
const ENDING_COLOR = { happy: 'var(--lime)', bad: 'var(--primrose)', open: 'var(--yucca-d)' }

function ficEnding(fic) {
  if (fic.good_ending && !fic.bad_ending) return 'happy'
  if (fic.bad_ending  && !fic.good_ending) return 'bad'
  return 'open'
}

function strHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h % 360
}

export default function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [fic,     setFic]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('fanfictions').select('*').eq('id', id).single()
      .then(({ data }) => { setFic(data); setLoading(false) })
  }, [id])

  const bg = fic?.image_url
    ? { backgroundImage: `url(${fic.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : fic
      ? { background: `linear-gradient(160deg, hsl(${strHue(fic.universe_name)},52%,80%), hsl(${(strHue(fic.universe_name) + 45) % 360},48%,55%))` }
      : {}

  const ending = fic ? ficEnding(fic) : 'open'

  return (
    <Page>
      <Header active="gallery" />

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>chargement…</div>
        </div>
      )}

      {!loading && !fic && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
          <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>fic introuvable…</div>
          <Link to="/gallery" className="btn-stamp">← retour à la bibliothèque</Link>
        </div>
      )}

      {!loading && fic && (
        <div style={{ padding: '88px 56px 56px' }}>

          {/* Retour */}
          <button
            onClick={() => navigate('/gallery', { state: { openUniverse: fic.universe_name } })}
            className="btn-stamp btn-stamp--ghost"
            style={{ padding: '7px 16px', fontSize: 12, marginBottom: 28 }}>
            ← {fic.universe_name ?? 'bibliothèque'}
          </button>

          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap', marginBottom: 40 }}>
            {/* Couverture polaroid */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Tape kind="dots" color="var(--primrose)" rot={-6} style={{ top: -10, left: 20, fontSize: 10, padding: '3px 12px' }}>
                {fic.universe_name ?? '—'}
              </Tape>
              <div style={{ transform: 'rotate(-1.5deg)', background: '#fffaf0', padding: '10px 10px 36px', width: 200, boxShadow: '0 12px 28px rgba(60,40,20,.2)' }}>
                <div style={{ width: '100%', height: 200, ...bg }} />
                <div className="handwriting" style={{ fontSize: 13, marginTop: 10, textAlign: 'center', color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fic.work_name}
                </div>
              </div>
            </div>

            {/* Titre + méta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 8 }}>JOURNAL DE LECTURE</div>
              <div className="heading-handwritten" style={{ fontSize: 'clamp(36px, 5vw, 64px)', color: 'var(--ink)', lineHeight: .95, marginBottom: 16 }}>
                {fic.work_name}
              </div>
              {fic.author_name && (
                <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-mute)', marginBottom: 8 }}>
                  by {fic.author_name}
                </div>
              )}
              {fic.ship_name && (
                <div className="handwriting" style={{ fontSize: 20, color: 'var(--ink-soft)', marginBottom: 12 }}>
                  {fic.ship_name}
                </div>
              )}

              {/* Stats ligne */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                {fic.word_count && (
                  <div>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>MOTS</div>
                    <div className="serif" style={{ fontSize: 20 }}>{Number(fic.word_count).toLocaleString('fr-FR')}</div>
                  </div>
                )}
                {fic.chapter_count && (
                  <div>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>CHAPITRES</div>
                    <div className="serif" style={{ fontSize: 20 }}>{fic.chapter_count}</div>
                  </div>
                )}
                {fic.read_count && (
                  <div>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>FOIS LU</div>
                    <div className="serif" style={{ fontSize: 20 }}>{fic.read_count}×</div>
                  </div>
                )}
                {fic.rank != null && (
                  <div>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>RANK</div>
                    <div className="serif" style={{ fontSize: 26, color: 'var(--primrose)', marginTop: 2 }}>#{fic.rank}</div>
                  </div>
                )}
                {fic.rating != null && (
                  <div>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>NOTE</div>
                    <div className="serif" style={{ fontSize: 20 }}>{fic.rating}/10</div>
                  </div>
                )}
              </div>

              {/* Ending + contenu + tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 9, letterSpacing: '.15em', color: ENDING_COLOR[ending], display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {ending === 'bad' ? <BloodDrop size={11} /> : ending === 'open' ? <StarMark size={11} /> : null}
                  {ENDING_LABEL[ending]}
                </span>
                <RatingBadge kind={fic.content_rating} />
                {(fic.tags ?? []).map(t => (
                  <Chip key={t} kind="soft" style={{ fontSize: 11 }}>{t}</Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Corps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr min(320px, 30vw)', gap: 32, alignItems: 'start' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Résumé */}
              {fic.summary && (
                <div className="card" style={{ padding: '24px 28px', position: 'relative', transform: 'rotate(-0.2deg)' }}>
                  <Tape kind="clean" color="var(--yucca)" rot={-1} style={{ top: -12, left: 44, fontSize: 10, padding: '3px 12px' }}>résumé</Tape>
                  <div style={{ fontFamily: 'var(--f-body)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.7, marginTop: 8 }}>
                    {fic.summary}
                  </div>
                </div>
              )}

              {/* Ma review */}
              {fic.my_review && (
                <div className="card" style={{ padding: '24px 28px', position: 'relative', transform: 'rotate(0.3deg)' }}>
                  <Tape kind="dots" color="var(--primrose)" rot={2} style={{ top: -12, left: 44, fontSize: 10, padding: '3px 12px' }}>ma review</Tape>
                  <div style={{ fontFamily: 'var(--f-hand)', fontSize: 18, color: 'var(--ink)', lineHeight: 1.6, marginTop: 8 }}>
                    "{fic.my_review}"
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Lien AO3 */}
              {fic.link && (
                <a href={fic.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button className="btn-stamp" style={{ width: '100%', padding: '14px 20px', fontSize: 14 }}>
                    lire sur AO3 ↗
                  </button>
                </a>
              )}

              {/* Infos fandom */}
              <Sticky bg="var(--pinktone)" rot={2} style={{ position: 'relative' }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 4 }}>FANDOM</div>
                <div className="serif" style={{ fontSize: 22 }}>{fic.universe_name ?? '—'}</div>
                {fic.ship_name && (
                  <>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)', marginTop: 10, marginBottom: 2 }}>SHIP</div>
                    <div className="handwriting" style={{ fontSize: 18 }}>{fic.ship_name}</div>
                  </>
                )}
              </Sticky>
            </div>
          </div>

          <Sticker kind="plant_leafy" size={90} rot={8}  style={{ position: 'absolute', bottom: 100, right: 32, opacity: .6 }} />
          <Sticker kind="mushrooms"   size={72} rot={-6} style={{ position: 'absolute', bottom: 110, right: 140, opacity: .55 }} />
          {/* Nav bas */}
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/gallery" className="btn-stamp btn-stamp--ghost">← retour à la bibliothèque</Link>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>─ 03 / 05 ─</span>
          </div>

        </div>
      )}
    </Page>
  )
}
