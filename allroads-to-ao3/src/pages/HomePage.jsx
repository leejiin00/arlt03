import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Page, Header, Sticky, ScribbleArrow, Doodle, WaveDivider, Tape, Polaroid, PaperClip, Feather, Sticker } from '../components/JournalShared'
import { supabase } from '../lib/supabase'
import Mascot from '../components/Mascot'
import stickyTrefle from '../assets/stickers/stickyTrefle.png'

const STORAGE_KEY = 'ao3_bookmarks'

// ── Fenêtre citation ───────────────────────────────────────────────────────────
function timeUntilNext() {
  const msIn5m    = 1000 * 60 * 5
  const remaining = msIn5m - (Date.now() % msIn5m)
  const m = Math.floor(remaining / (1000 * 60))
  const s = Math.floor((remaining % (1000 * 60)) / 1000)
  return `${m}m${s.toString().padStart(2, '0')}s`
}

function QuoteWindow({ quote }) {
  const [timer, setTimer] = useState(timeUntilNext())
  useEffect(() => {
    const t = setInterval(() => setTimer(timeUntilNext()), 1_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      width: 218,
      transform: 'rotate(-1.2deg)',
      boxShadow: '0 8px 28px rgba(60,40,20,.20), 0 2px 0 rgba(0,0,0,.06)',
      borderRadius: 4, overflow: 'hidden',
      border: '1.5px solid rgba(29,26,22,.14)',
    }}>
      {/* Barre de titre style mini-fenêtre */}
      <div style={{
        background: 'linear-gradient(90deg, #F9D0CE 0%, #F297A0 100%)',
        padding: '5px 10px',
        display: 'flex', alignItems: 'center', gap: 5,
        userSelect: 'none',
      }}>
        {[['#e07070','close'], ['#e8c060','min'], ['#70c870','max']].map(([c, k]) => (
          <div key={k} style={{ width: 9, height: 9, borderRadius: '50%', background: c, border: '0.8px solid rgba(0,0,0,.18)', flexShrink: 0 }} />
        ))}
        <span className="mono" style={{ fontSize: 7, letterSpacing: '.18em', color: 'rgba(29,26,22,.62)', marginLeft: 5, whiteSpace: 'nowrap' }}>
          CITATION DU MOMENT
        </span>
      </div>
      {/* Contenu */}
      <div style={{ background: '#fffaf0', padding: '14px 15px 12px' }}>
        <div className="handwriting" style={{ fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.55, fontStyle: 'italic' }}>
          «&nbsp;{quote.text}&nbsp;»
        </div>
        {quote.author && (
          <div className="mono" style={{ fontSize: 8, letterSpacing: '.15em', color: 'var(--ink-mute)', marginTop: 9, textAlign: 'right' }}>
            — {quote.author}
          </div>
        )}
        <div style={{ height: 1, background: 'rgba(29,26,22,.08)', margin: '10px 0 7px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11 }}>✿</span>
          <span className="mono" style={{ fontSize: 7, letterSpacing: '.1em', color: 'var(--ink-mute)', opacity: .65 }}>
            ↻ dans {timer}
          </span>
        </div>
      </div>
    </div>
  )
}

function formatWords(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function novelsEquiv(words) {
  const n = Math.round((words || 0) / 90_000)
  return `soit ${n || 0} roman${n !== 1 ? 's' : ''} ✿`
}

function strHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h % 360
}

function readingMilestone(n) {
  if (n === 0)  return null
  if (n >= 100) return { label: '100 fics', color: 'var(--lime)', icon: '🌿' }
  if (n >= 50)  return { label: '50 fics',  color: 'var(--yucca)', icon: '🌸' }
  if (n >= 20)  return { label: '20 fics',  color: 'var(--primrose)', icon: '✨' }
  if (n >= 10)  return { label: '10 fics',  color: 'var(--pinktone)', icon: '🌷' }
  return null
}

export default function HomePage() {
  const [stats, setStats] = useState({
    ficsRead: 0, bookmarked: 0,
    writingsCount: 0, wordsMonth: 0,
    topFandom: '—', runnerFandoms: '',
  })
  const [recentFics, setRecentFics] = useState([])
  const [toReadList, setToReadList] = useState([])
  const [quote,      setQuote]      = useState(undefined)

  useEffect(() => {
    try {
      const bm = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setToReadList(bm.slice(0, 3))
      setStats(s => ({ ...s, bookmarked: bm.length }))
    } catch { /* ignore */ }

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const now        = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        { count: ficsRead },
        { data: fandoms },
        { data: wordsData },
        { data: lastFicData },
        { data: quotesData },
      ] = await Promise.all([
        supabase.from('fanfictions').select('*', { count: 'exact', head: true }),
        supabase.from('fanfictions').select('universe_name'),
        supabase.from('fanfictions').select('word_count').gte('created_at', monthStart),
        supabase.from('fanfictions').select('id,work_name,universe_name,image_url,rank,ship_name').order('created_at', { ascending: false }).limit(3),
        supabase.from('quotes').select('id,text,author').order('id'),
      ])

      if (quotesData && quotesData.length > 0) {
        const windowIdx = Math.floor(Date.now() / (1000 * 60 * 5))
        setQuote(quotesData[windowIdx % quotesData.length])
      } else {
        setQuote(null)
      }

      setRecentFics(lastFicData ?? [])

      const fandomCounts = {}
      ;(fandoms || []).forEach(f => {
        if (f.universe_name) fandomCounts[f.universe_name] = (fandomCounts[f.universe_name] || 0) + 1
      })
      const sorted        = Object.entries(fandomCounts).sort(([, a], [, b]) => b - a)
      const topFandom     = sorted[0]?.[0] ?? '—'
      const runnerFandoms = sorted.slice(1, 3).map(([name]) => name).join(' & ')
      const wordsMonth    = (wordsData || []).reduce((acc, f) => acc + (Number(f.word_count) || 0), 0)

      let writingsCount = 0
      if (session) {
        const { count: wCount } = await supabase.from('writings').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
        writingsCount = wCount ?? 0
      }

      setStats(s => ({ ...s, ficsRead: ficsRead ?? 0, writingsCount, wordsMonth, topFandom, runnerFandoms }))
    }
    load()
  }, [])

  const lastFic   = recentFics[0] ?? null
  const secondFic = recentFics[1] ?? null
  const thirdFic  = recentFics[2] ?? null

  function ficBg(fic) {
    if (!fic) return { background: 'linear-gradient(160deg,#f9d0ce,#c98a90)' }
    if (fic.image_url) return { backgroundImage: `url(${fic.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    return { background: `linear-gradient(160deg, hsl(${strHue(fic.universe_name)},50%,78%), hsl(${(strHue(fic.universe_name) + 40) % 360},46%,56%))` }
  }

  const topHue      = strHue(stats.topFandom)
  const milestone   = readingMilestone(stats.ficsRead)

  return (
  <>
    <div style={{ position: 'relative', width: 'min(1280px, 95vw)', margin: '0 auto' }}>
    <Page>
      <div className="floral-corner" style={{ pointerEvents: 'none' }} />
      <Header active="home" />

      <div style={{ padding: '88px 56px 56px', display: 'grid', gridTemplateColumns: '1fr min(520px, 44vw)', gap: 48, alignItems: 'start' }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)', border: '1.2px solid rgba(29,26,22,.15)', padding: '4px 10px', borderRadius: 2 }}>
              VOL. 04 · ENTRY No.147
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.15em', color: 'var(--ink-mute)' }}>· 2026 ·</div>
            <Doodle kind="flower" size={16} color="var(--pinktone)" />
          </div>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className="heading-handwritten" style={{ fontSize: 'clamp(52px, 7vw, 100px)', color: 'var(--ink)', lineHeight: .9 }}>
              all roads lead<br />
              <span style={{ color: 'var(--primrose)', fontStyle: 'italic', filter: 'brightness(.92)' }}>&nbsp;&nbsp;to ao3</span>
              <span className="sparkle" style={{ marginLeft: 10, verticalAlign: 'super' }} />
            </div>
            <Doodle kind="heart" size={18} color="#F297A0" style={{ position: 'absolute', top: 8, right: -28 }} />
          </div>

          <div style={{ marginTop: 12, fontFamily: 'var(--f-body)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink-soft)', maxWidth: 480 }}>
            ton journal de lecture de fanfictions — chaque fic lue, notee et annotee, ta wishlist, tes propres ecrits.
          </div>

          <WaveDivider width={320} style={{ marginTop: 20, marginBottom: 4 }} />

          <div className="swatch-row" style={{ marginTop: 12, width: 'min(340px, 100%)' }}>
            <div className="row" style={{ ['--rc']: 'var(--pinktone)' }}><span>FICS LUES</span><span>·</span><span className="num">{stats.ficsRead}</span></div>
            <div className="row" style={{ ['--rc']: 'var(--primrose)' }}><span>MARQUE-PAGES</span><span>·</span><span className="num">{stats.bookmarked}</span></div>
            <div className="row" style={{ ['--rc']: 'var(--yucca)' }}><span>ÉCRITS</span><span>·</span><span className="num">{stats.writingsCount}</span></div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Sticky bg="var(--pinktone)" rot={-4} style={{ width: 148, position: 'relative' }}>
              <Doodle kind="cloud" size={14} style={{ position: 'absolute', top: 8, right: 10, opacity: .4 }} />
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>MOTS CE MOIS</div>
              <div className="serif" style={{ fontSize: 34, marginTop: 4 }}>{formatWords(stats.wordsMonth)}</div>
              <div style={{ fontSize: 13 }}>{novelsEquiv(stats.wordsMonth)}</div>
            </Sticky>
            <Sticky bg="#fffaf0" rot={-2} style={{ width: 172, border: '1.5px dashed var(--ink)', position: 'relative' }}>
              <Doodle kind="leaf" size={14} style={{ position: 'absolute', top: 8, right: 10, opacity: .35 }} />
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>TOP FANDOM</div>
              <div className="serif" style={{ fontSize: 20, marginTop: 4 }}>{stats.topFandom}</div>
              <div style={{ fontSize: 13 }}>
                {stats.runnerFandoms ? `suivi de ${stats.runnerFandoms} ✦` : '✦'}
              </div>
            </Sticky>
          </div>

          <WaveDivider width={260} style={{ marginTop: 20, marginBottom: 16, opacity: .7 }} />

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/gallery" className="btn-stamp">explorer la bibliothèque →</Link>
            <Link to="/gallery" className="btn-stamp btn-stamp--ghost">ajouter une fic +</Link>
          </div>
        </div>

        {/* ── Colonne droite — layout collage ── */}
        <div style={{ position: 'relative', paddingTop: 16, overflow: 'visible' }}>

          {/* Polaroids — 3 dernières fics */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 6, paddingTop: 28, paddingRight: 4 }}>
            <Tape kind="grid" color="var(--lime)" rot={-8} style={{ top: 8, left: 0, zIndex: 2, fontSize: 10 }}>
              {lastFic ? 'dernières lues ✦' : 'la bibliothèque t\'attend ✦'}
            </Tape>
            <PaperClip rot={15} style={{ position: 'absolute', top: 2, right: 16, zIndex: 3 }} />

            {/* Troisième fic — tout à gauche, la plus en retrait */}
            {thirdFic && (
              <Link to={`/fic/${thirdFic.id}`} style={{ textDecoration: 'none', marginTop: 20 }}>
                <Polaroid w={130} h={155} rot={-6} caption={thirdFic.work_name ?? '—'} padBot={28}>
                  <div style={{ width: '100%', height: '100%', ...ficBg(thirdFic), display: 'flex', alignItems: 'flex-end', padding: 6 }}>
                    <span className="mono" style={{ fontSize: 6, letterSpacing: '.1em', color: 'rgba(255,250,240,.9)', background: 'rgba(0,0,0,.28)', padding: '2px 4px' }}>
                      {(thirdFic.universe_name ?? '').toUpperCase()}
                    </span>
                  </div>
                </Polaroid>
              </Link>
            )}

            {/* Deuxième fic — au milieu */}
            {secondFic && (
              <Link to={`/fic/${secondFic.id}`} style={{ textDecoration: 'none', marginTop: 8 }}>
                <Polaroid w={140} h={168} rot={-3} caption={secondFic.work_name ?? '—'} padBot={30}>
                  <div style={{ width: '100%', height: '100%', ...ficBg(secondFic), display: 'flex', alignItems: 'flex-end', padding: 7 }}>
                    <span className="mono" style={{ fontSize: 6, letterSpacing: '.1em', color: 'rgba(255,250,240,.9)', background: 'rgba(0,0,0,.28)', padding: '2px 4px' }}>
                      {(secondFic.universe_name ?? '').toUpperCase()}
                    </span>
                  </div>
                </Polaroid>
              </Link>
            )}

            {/* Première fic — devant, légèrement penchée */}
            {lastFic ? (
              <Link to={`/fic/${lastFic.id}`} style={{ textDecoration: 'none' }}>
                <Polaroid w={150} h={180} rot={5} caption={lastFic.work_name ?? '—'} padBot={32}>
                  <div style={{ width: '100%', height: '100%', ...ficBg(lastFic), display: 'flex', alignItems: 'flex-end', padding: 8 }}>
                    <span className="mono" style={{ fontSize: 7, letterSpacing: '.12em', color: 'rgba(255,250,240,.9)', background: 'rgba(0,0,0,.28)', padding: '2px 5px' }}>
                      {(lastFic.universe_name ?? '').toUpperCase()}
                    </span>
                  </div>
                </Polaroid>
              </Link>
            ) : (
              <Polaroid w={150} h={180} rot={5} caption="aucune fic encore…" padBot={32}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#f9d0ce,#e8b4b8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Doodle kind="flower" size={44} color="rgba(255,255,255,.6)" />
                </div>
              </Polaroid>
            )}
          </div>

          {/* A lire — decale a gauche, chevauchement */}
          <div style={{ marginTop: -18, marginLeft: -12, width: '82%', padding: '18px 20px 22px', transform: 'rotate(-2deg)', position: 'relative', zIndex: 2 }}>
            <Tape kind="dots" color="var(--primrose)" rot={-2} style={{ top: -14, left: 22 }}>a lire · next ↓</Tape>
            {toReadList.length === 0 ? (
              <div style={{ marginTop: 14 }}>
                <div className="handwriting" style={{ fontSize: 18, color: 'var(--ink-mute)', fontStyle: 'italic' }}>
                  ajoute des fics a ta liste ✿
                </div>
                <Link to="/bookmarks" className="mono" style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--primrose)', textDecoration: 'none', display: 'block', marginTop: 8 }}>
                  → voir les marque-pages
                </Link>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, fontFamily: 'var(--f-hand)', fontSize: 19, lineHeight: 1.55 }}>
                {toReadList.map((b, i) => (
                  <li key={b.id ?? i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--ink)' }}>
                    <span style={{ width: 14, height: 14, border: '1.5px solid var(--ink)', display: 'inline-flex', flexShrink: 0, marginTop: 5 }} />
                    <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', flex: 1, wordBreak: 'break-word', lineHeight: 1.3 }}>
                      {b.title || '(sans titre)'}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fandom du moment — decale a droite, rotation inverse */}
          {stats.topFandom !== '—' && (
            <div style={{ marginTop: 10, marginLeft: 20, position: 'relative', paddingTop: 18 }}>
              <Tape kind="check" color="var(--yucca)" rot={3} style={{ top: 2, left: 18, fontSize: 9, padding: '2px 10px' }}>obsession du moment</Tape>
              <div style={{
                background: `linear-gradient(135deg,
                  hsl(${topHue},42%,84%) 0%,
                  hsl(${(topHue + 55) % 360},38%,78%) 60%,
                  hsl(${(topHue + 90) % 360},34%,72%) 100%)`,
                padding: '20px 18px 18px',
                transform: 'rotate(1.8deg)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: -20, bottom: -20, width: 80, height: 80, borderRadius: '50%', background: `hsl(${(topHue + 100) % 360},32%,65%)`, opacity: .22 }} />
                <div style={{ position: 'absolute', left: -10, top: -10, width: 45, height: 45, borderRadius: '50%', background: `hsl(${(topHue + 180) % 360},30%,70%)`, opacity: .18 }} />
                <div className="mono" style={{ fontSize: 8, letterSpacing: '.24em', color: 'rgba(29,26,22,.5)', marginBottom: 6 }}>TOP FANDOM</div>
                <div className="heading-handwritten" style={{ fontSize: 'clamp(20px, 2.8vw, 28px)', lineHeight: 1, color: 'rgba(29,26,22,.82)', marginBottom: 8, position: 'relative', zIndex: 1 }}>
                  {stats.topFandom}
                </div>
                {stats.runnerFandoms && (
                  <div className="mono" style={{ fontSize: 8, color: 'rgba(29,26,22,.48)', letterSpacing: '.15em', marginBottom: 8 }}>
                    aussi : {stats.runnerFandoms}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Doodle kind="flower" size={11} color="rgba(29,26,22,.35)" />
                  <span className="serif" style={{ fontSize: 12, color: 'rgba(29,26,22,.6)', fontStyle: 'italic' }}>
                    {stats.ficsRead} {stats.ficsRead === 1 ? 'fic lue' : 'fics lues'} au total
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ship + Plante — cote a cote, ship a gauche, plante a droite */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, marginTop: 16, position: 'relative' }}>
            {lastFic?.ship_name && (
              <div style={{ flex: 1, position: 'relative', transform: 'rotate(-1.5deg)', transformOrigin: 'bottom left' }}>
                <div style={{ background: '#fffaf0', border: '1.5px dashed rgba(242,151,160,.65)', padding: '14px 14px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
                    <Doodle kind="heart" size={12} color="#F297A0" />
                    <Doodle kind="heart" size={8} color="var(--primrose)" style={{ marginTop: 3 }} />
                    <Doodle kind="heart" size={12} color="#F297A0" />
                  </div>
                  <div className="mono" style={{ fontSize: 7, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 5 }}>SHIP DU MOMENT</div>
                  <div className="heading-handwritten" style={{ fontSize: 'clamp(16px, 2vw, 21px)', color: 'var(--ink)', lineHeight: 1.1 }}>
                    {lastFic.ship_name}
                  </div>
                  {lastFic.universe_name && (
                    <div className="mono" style={{ fontSize: 7, color: 'var(--ink-mute)', letterSpacing: '.12em', marginTop: 6 }}>
                      {lastFic.universe_name}
                    </div>
                  )}
                </div>
              </div>
            )}
            <img src={stickyTrefle} alt="" style={{ width: lastFic?.ship_name ? 110 : 130, flexShrink: 0, marginRight: -10 }} />
          </div>

          {/* Milestone badge */}
          {milestone && (
            <div style={{ marginTop: 12, marginLeft: 8 }}>
              <div style={{ background: milestone.color, padding: '9px 14px', transform: 'rotate(0.8deg)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{milestone.icon}</span>
                <div>
                  <div className="mono" style={{ fontSize: 7, letterSpacing: '.2em', color: 'rgba(29,26,22,.55)' }}>MILESTONE</div>
                  <div className="handwriting" style={{ fontSize: 16, color: 'rgba(29,26,22,.8)' }}>{milestone.label} lues !</div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Stickers décoratifs page */}
      <Sticker kind="tulips"       size={90}  rot={-12} style={{ position: 'absolute', bottom: 60, left: 40, opacity: .75 }} />
      <Sticker kind="flowers_small" size={80} rot={8}   style={{ position: 'absolute', top: 80, right: 44, opacity: .7 }} />

      <div style={{ padding: '8px 56px 32px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, pointerEvents: 'none' }}>
        <ScribbleArrow rot={-8} style={{ opacity: .6 }} w={70} h={50} />
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>─ 01 / 05 ─</span>
      </div>
    </Page>

    {/* Citation flottante à droite du carnet */}
    {quote !== undefined && (
      <div style={{ position: 'absolute', top: 110, right: -248, zIndex: 20 }}>
        <QuoteWindow quote={quote ?? { text: "aucune citation pour l'instant… ✿", author: null }} />
      </div>
    )}
    </div>

    <Mascot />
  </>
  )
}
