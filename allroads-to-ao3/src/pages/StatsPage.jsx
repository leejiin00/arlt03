import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Page, Header, Tape, Sticky, Sticker } from '../components/JournalShared'
import { supabase } from '../lib/supabase'

const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

// ── Helpers ────────────────────────────────────────────────────────────────────

function filterByPeriod(fics, period) {
  const now = new Date()
  return fics.filter(f => {
    if (!f.created_at) return false
    const d = new Date(f.created_at)
    if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    return d.getFullYear() === now.getFullYear()
  })
}

function topTags(fics, n = 3) {
  const counts = {}
  fics.forEach(f => (f.tags ?? []).forEach(t => { counts[t] = (counts[t] ?? 0) + 1 }))
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function topBy(fics, key, n = 3) {
  return [...fics].filter(f => f[key] != null).sort((a, b) => b[key] - a[key]).slice(0, n)
}

function topUniverses(fics, n = 3) {
  const counts = {}
  fics.forEach(f => { const u = f.universe_name || '—'; counts[u] = (counts[u] ?? 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function topAuthors(fics, n = 3) {
  const counts = {}
  fics.forEach(f => { if (f.author_name) counts[f.author_name] = (counts[f.author_name] ?? 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function topShips(fics, n = 1) {
  const counts = {}
  fics.forEach(f => { if (f.ship_name) counts[f.ship_name] = (counts[f.ship_name] ?? 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function avg(fics, key) {
  const valid = fics.filter(f => f[key] != null)
  if (!valid.length) return null
  return valid.reduce((s, f) => s + f[key], 0) / valid.length
}

function sum(fics, key) {
  return fics.reduce((s, f) => s + (f[key] ?? 0), 0)
}

function endingDistrib(fics) {
  let happy = 0, bad = 0, open = 0
  fics.forEach(f => {
    if (f.good_ending && !f.bad_ending) happy++
    else if (f.bad_ending && !f.good_ending) bad++
    else open++
  })
  return { happy, bad, open, total: fics.length }
}

function contentDistrib(fics) {
  const counts = { no_sex: 0, vanilla: 0, explicit: 0, none: 0 }
  fics.forEach(f => {
    const k = f.content_rating || 'none'
    counts[k] = (counts[k] ?? 0) + 1
  })
  return counts
}

// ── Composants UI ──────────────────────────────────────────────────────────────

function StatCard({ title, children, color = '#fffaf0', rot = 0, tape, tapeColor = 'var(--primrose)', style }) {
  return (
    <div className="card" style={{
      padding: '22px 24px 20px',
      background: color,
      transform: `rotate(${rot}deg)`,
      position: 'relative',
      ...style,
    }}>
      {tape && (
        <Tape kind="dots" color={tapeColor} rot={-2} style={{ top: -12, left: 36, fontSize: 9, padding: '3px 10px' }}>
          {tape}
        </Tape>
      )}
      <div className="mono" style={{ fontSize: 8, letterSpacing: '.22em', color: 'var(--ink-mute)', marginBottom: 10, marginTop: tape ? 6 : 0 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function BigNumber({ value, label, color = 'var(--ink)' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div className="serif" style={{ fontSize: 52, lineHeight: 1, color, fontWeight: 400 }}>
        {value ?? '—'}
      </div>
      {label && (
        <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)' }}>{label}</div>
      )}
    </div>
  )
}

function TopList({ items, renderLabel, renderSub, emptyMsg = 'pas encore de données…' }) {
  if (!items.length) return (
    <div className="handwriting" style={{ fontSize: 16, color: 'var(--ink-mute)', padding: '8px 0' }}>{emptyMsg}</div>
  )
  const medals = ['①', '②', '③']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="serif" style={{ fontSize: 18, color: 'var(--primrose)', minWidth: 20, flexShrink: 0 }}>{medals[i]}</span>
          <div style={{ minWidth: 0 }}>
            <div className="handwriting" style={{ fontSize: 18, lineHeight: 1.15, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {renderLabel(item)}
            </div>
            {renderSub && (
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '.12em' }}>
                {renderSub(item)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function BarChart({ data, total }) {
  if (!total) return <div className="handwriting" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>pas encore de données…</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(({ label, value, color, icon }) => {
        const pct = total ? Math.round((value / total) * 100) : 0
        return (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
              <span className="handwriting" style={{ fontSize: 15, color: 'var(--ink)' }}>{label}</span>
              <span className="mono" style={{ fontSize: 8, color: 'var(--ink-mute)', marginLeft: 'auto', letterSpacing: '.1em' }}>{value} · {pct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(29,26,22,.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .6s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [fics,    setFics]    = useState([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('month') // 'month' | 'year'

  useEffect(() => {
    supabase.from('fanfictions').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setFics(data ?? []); setLoading(false) })
  }, [])

  const now = new Date()
  const periodFics = filterByPeriod(fics, period)
  const periodLabel = period === 'month'
    ? MOIS_FR[now.getMonth()] + ' ' + now.getFullYear()
    : String(now.getFullYear())

  // ── Stats période ──
  const ficCount   = periodFics.length
  const wordTotal  = sum(periodFics, 'word_count')
  const avgRating  = avg(periodFics, 'rating')
  const tags3      = topTags(periodFics, 3)
  const topFics    = topBy(periodFics, 'rating', 3)
  const topUnis    = topUniverses(periodFics, 3)
  const topAuth    = topAuthors(periodFics, 3)
  const topShip    = topShips(periodFics, 1)
  const ending     = endingDistrib(periodFics)
  const content    = contentDistrib(periodFics)

  // ── Stats globales ──
  const longestFic  = topBy(fics, 'word_count', 1)[0]
  const mostReread  = topBy(fics, 'read_count',  1)[0]
  const bestRated   = topBy(fics, 'rating',       1)[0]
  const rankOne     = fics.find(f => f.rank === 1)
  const globalAvg   = avg(fics, 'rating')
  const totalWords  = sum(fics, 'word_count')
  const totalFics   = fics.length
  const readingHrs  = Math.round(wordTotal / 250)       // ~250 mots/min
  const readingHrsTotal = Math.round(totalWords / 250)
  const happyPct    = fics.length ? Math.round((fics.filter(f => f.good_ending && !f.bad_ending).length / fics.length) * 100) : 0

  const endingBarData = [
    { label: 'happy end ✿', value: ending.happy, color: 'var(--lime)',      icon: '✿' },
    { label: 'bad end',      value: ending.bad,   color: 'var(--primrose)',  icon: '✕' },
    { label: 'open end',     value: ending.open,  color: 'var(--yucca-d)',  icon: '○' },
  ]

  const contentBarData = [
    { label: 'No Sex',       value: content.no_sex   ?? 0, color: 'var(--pinktone)' },
    { label: 'Sex Vanilla',  value: content.vanilla  ?? 0, color: 'var(--primrose)' },
    { label: 'Sex Hardcore', value: content.explicit ?? 0, color: '#c0392b44' },
  ]

  return (
    <Page>
      <Header active="stats" />

      <div style={{ padding: '88px 56px 56px' }}>

        {/* ── En-tête ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--ink-mute)' }}>SECTION D</div>
            <div className="heading-handwritten" style={{ fontSize: 'clamp(48px, 6vw, 80px)', color: 'var(--ink)', lineHeight: .95, marginTop: 4 }}>
              mes statistiques
            </div>
          </div>

          {/* Toggle période */}
          <div style={{ display: 'flex', gap: 6, paddingBottom: 8 }}>
            {[['month', 'ce mois'], ['year', 'cette année']].map(([val, lbl]) => (
              <button key={val} onClick={() => setPeriod(val)}
                style={{
                  padding: '8px 16px', fontFamily: 'var(--f-hand)', fontSize: 15,
                  background: period === val ? 'var(--ink)' : 'rgba(255,250,240,.8)',
                  color: period === val ? 'var(--paper)' : 'var(--ink)',
                  border: '1.4px solid rgba(29,26,22,.2)', borderRadius: 3, cursor: 'pointer',
                  transition: 'all .15s',
                }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="handwriting" style={{ fontSize: 28, color: 'var(--ink-mute)' }}>chargement des stats…</div>
          </div>
        ) : (
          <>
            {/* ── Période label ── */}
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.3em', color: 'var(--ink-mute)', marginBottom: 28, textTransform: 'uppercase' }}>
              · · · {periodLabel} · · ·
            </div>

            {/* ── Ligne 1 : grands compteurs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginBottom: 28 }}>
              <StatCard tape="fics lues" tapeColor="var(--lime)" rot={-0.5} color="#f5fde8">
                <BigNumber value={ficCount} color="var(--lime-d)" />
                <div className="handwriting" style={{ fontSize: 13, color: 'var(--ink-mute)', textAlign: 'center', marginTop: 4 }}>
                  {ficCount === 0 ? 'aucune fic ce mois' : ficCount === 1 ? 'fic lue' : 'fics lues'}
                </div>
              </StatCard>

              <StatCard tape="mots lus" tapeColor="var(--pinktone)" rot={0.4} color="#fff0f5">
                <BigNumber value={wordTotal > 0 ? wordTotal.toLocaleString('fr-FR') : '—'} color="var(--ink)" />
                {wordTotal > 0 && (
                  <div className="handwriting" style={{ fontSize: 12, color: 'var(--ink-mute)', textAlign: 'center', marginTop: 4 }}>
                    ≈ {readingHrs}h de lecture
                  </div>
                )}
              </StatCard>

              <StatCard tape="note moyenne" tapeColor="var(--primrose)" rot={-0.3} color="#fffaf0">
                <BigNumber value={avgRating != null ? avgRating.toFixed(1) : '—'} color="var(--primrose)" />
                {avgRating != null && (
                  <div className="handwriting" style={{ fontSize: 12, color: 'var(--ink-mute)', textAlign: 'center', marginTop: 4 }}>/10</div>
                )}
              </StatCard>

              {topShip.length > 0 && (
                <StatCard tape="ship du moment" tapeColor="var(--yucca)" rot={0.6} color="#f8fff0">
                  <div className="handwriting" style={{ fontSize: 22, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>
                    {topShip[0][0]}
                  </div>
                  <div className="mono" style={{ fontSize: 8, color: 'var(--ink-mute)', textAlign: 'center', marginTop: 6, letterSpacing: '.15em' }}>
                    {topShip[0][1]} fic{topShip[0][1] > 1 ? 's' : ''}
                  </div>
                </StatCard>
              )}
            </div>

            {/* ── Ligne 2 : tops ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>

              <StatCard title="TOP 3 TAGS" tape="étiquettes" tapeColor="var(--pinktone)" rot={-0.5}>
                <TopList
                  items={tags3}
                  renderLabel={([tag]) => tag}
                  renderSub={([, count]) => `${count} fic${count > 1 ? 's' : ''}`}
                  emptyMsg="aucun tag ce mois…"
                />
              </StatCard>

              <StatCard title="TOP 3 FICS" tape="meilleures notes" tapeColor="var(--primrose)" rot={0.4}>
                <TopList
                  items={topFics}
                  renderLabel={f => f.work_name ?? '—'}
                  renderSub={f => f.rating != null ? `${f.rating}/10${f.author_name ? ' · ' + f.author_name : ''}` : f.author_name ?? ''}
                  emptyMsg="aucune fic notée ce mois…"
                />
              </StatCard>

              <StatCard title="TOP 3 UNIVERS" tape="fandoms" tapeColor="var(--yucca)" rot={-0.3}>
                <TopList
                  items={topUnis}
                  renderLabel={([u]) => u}
                  renderSub={([, count]) => `${count} fic${count > 1 ? 's' : ''}`}
                  emptyMsg="aucun univers ce mois…"
                />
              </StatCard>

              <StatCard title="TOP AUTEUR·RICES" tape="plumes fétiches" tapeColor="var(--lime)" rot={0.5}>
                <TopList
                  items={topAuth}
                  renderLabel={([author]) => author}
                  renderSub={([, count]) => `${count} fic${count > 1 ? 's' : ''}`}
                  emptyMsg="aucun auteur ce mois…"
                />
              </StatCard>
            </div>

            {/* ── Ligne 3 : distributions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>

              <StatCard title="DISTRIBUTION ENDINGS" tape="fins" tapeColor="var(--primrose)" rot={-0.4}>
                <BarChart data={endingBarData} total={ending.total} />
                {ending.total > 0 && (
                  <div className="mono" style={{ fontSize: 8, color: 'var(--ink-mute)', marginTop: 12, letterSpacing: '.1em' }}>
                    {happyPct}% de happy end sur toute la bibliothèque
                  </div>
                )}
              </StatCard>

              <StatCard title="CLASSIFICATION CONTENU" tape="type de contenu" tapeColor="var(--pinktone)" rot={0.3}>
                <BarChart data={contentBarData} total={ficCount} />
              </StatCard>

              {/* Fun stat : temps total */}
              <StatCard tape="fun fact" tapeColor="var(--yucca)" rot={-0.6} color="#fff8e8">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 3 }}>TEMPS DE LECTURE ({period === 'month' ? 'ce mois' : 'cette année'})</div>
                    <div className="serif" style={{ fontSize: 28, color: 'var(--ink)' }}>
                      {readingHrs > 0 ? `${readingHrs}h` : '—'}
                    </div>
                    <div className="handwriting" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>à 250 mots/min</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 3 }}>TOTAL BIBLIOTHÈQUE</div>
                    <div className="serif" style={{ fontSize: 22, color: 'var(--ink)' }}>
                      {readingHrsTotal > 0 ? `${readingHrsTotal}h` : '—'}
                    </div>
                    <div className="handwriting" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{totalWords > 0 ? `${totalWords.toLocaleString('fr-FR')} mots` : ''}</div>
                  </div>
                </div>
              </StatCard>
            </div>

            {/* ── Ligne 4 : records globaux ── */}
            <div className="mono" style={{ fontSize: 9, letterSpacing: '.3em', color: 'var(--ink-mute)', marginBottom: 20 }}>· · · records de la bibliothèque · · ·</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>

              {longestFic && (
                <StatCard title="FIC LA PLUS LONGUE" tape="roman fleuve" tapeColor="var(--lime)" rot={0.4} color="#f5fde8">
                  <div className="handwriting" style={{ fontSize: 19, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 4 }}>{longestFic.work_name}</div>
                  <div className="serif" style={{ fontSize: 24, color: 'var(--lime-d)' }}>{longestFic.word_count?.toLocaleString('fr-FR')} <span className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>mots</span></div>
                </StatCard>
              )}

              {mostReread && (mostReread.read_count ?? 0) > 1 && (
                <StatCard title="FIC LA PLUS RELUE" tape="obsession" tapeColor="var(--primrose)" rot={-0.5}>
                  <div className="handwriting" style={{ fontSize: 19, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 4 }}>{mostReread.work_name}</div>
                  <div className="serif" style={{ fontSize: 24, color: 'var(--primrose)' }}>{mostReread.read_count}×</div>
                </StatCard>
              )}

              {rankOne && (
                <StatCard title="LA FIQUE DE TA VIE" tape="rank #1 ✦" tapeColor="var(--primrose)" rot={0.3} color="#fff8e0">
                  <div className="serif" style={{ fontSize: 20, color: 'var(--primrose)', marginBottom: 6 }}>#1</div>
                  <div className="handwriting" style={{ fontSize: 20, color: 'var(--ink)', lineHeight: 1.2 }}>{rankOne.work_name}</div>
                  {rankOne.author_name && (
                    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', marginTop: 4, letterSpacing: '.12em' }}>by {rankOne.author_name}</div>
                  )}
                </StatCard>
              )}

              {bestRated && (
                <StatCard title="MEILLEURE NOTE" tape="coup de cœur" tapeColor="var(--pinktone)" rot={-0.4} color="#fff0f8">
                  <div className="handwriting" style={{ fontSize: 19, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 4 }}>{bestRated.work_name}</div>
                  <div className="serif" style={{ fontSize: 26, color: 'var(--ink)' }}>{bestRated.rating}<span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>/10</span></div>
                </StatCard>
              )}

              <Sticky bg="var(--pinktone)" rot={-2} style={{ padding: '20px 22px' }}>
                <div className="mono" style={{ fontSize: 8, letterSpacing: '.2em', color: 'var(--ink-mute)', marginBottom: 6 }}>LA BIBLIOTHÈQUE EN CHIFFRES</div>
                {[
                  [`${totalFics}`, 'fics au total'],
                  [`${totalWords > 0 ? (totalWords / 1000).toFixed(0) + 'k' : '—'}`, 'mots lus en tout'],
                  [`${globalAvg != null ? globalAvg.toFixed(1) + '/10' : '—'}`, 'note moyenne globale'],
                  [`${happyPct}%`, 'de happy endings'],
                ].map(([val, lbl]) => (
                  <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <span className="serif" style={{ fontSize: 20, lineHeight: 1 }}>{val}</span>
                    <span className="handwriting" style={{ fontSize: 14, color: 'var(--ink-soft)', textAlign: 'right' }}>{lbl}</span>
                  </div>
                ))}
              </Sticky>
            </div>

            {/* Message si vide */}
            {ficCount === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0 40px' }}>
                <div className="handwriting" style={{ fontSize: 22, color: 'var(--ink-mute)' }}>
                  aucune fic enregistrée {period === 'month' ? 'ce mois-ci' : 'cette année'}… encore !
                </div>
              </div>
            )}
          </>
        )}

        <Sticker kind="plant_leafy" size={80} rot={12}  style={{ position: 'fixed', bottom: 40, right: 28, opacity: .45, pointerEvents: 'none' }} />
        <Sticker kind="flower_white" size={64} rot={-8} style={{ position: 'fixed', bottom: 100, right: 100, opacity: .4, pointerEvents: 'none' }} />
      </div>
    </Page>
  )
}
