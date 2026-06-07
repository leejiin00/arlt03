import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toyIcon       from '../assets/butt.png'

import _sBonbon      from '../assets/stickers/stickyBonbon.png'
import _sFleur       from '../assets/stickers/StickyFleur.png'
import _sPasteque    from '../assets/stickers/StickyPasteque.png'
import _sCake        from '../assets/stickers/StickyCake.png'
import _sEtoile      from '../assets/stickers/StickyEtoile.png'
import _sHawai       from '../assets/stickers/StickyHawaiFlower.png'
import _sBubbleTea   from '../assets/stickers/StickyBubbleTea.png'
import _sTrefle      from '../assets/stickers/stickyTrefle.png'
import _sBarrette    from '../assets/stickers/StickyBarrette.png'
import _sCamera      from '../assets/stickers/StickyCarmera.png'
import _sDisc        from '../assets/stickers/StickyDisc.png'
import _sDog         from '../assets/stickers/StickyDog.png'
import _sFlower      from '../assets/stickers/StickyFlower.png'
import _sFraise      from '../assets/stickers/StickyFraise.png'
import _sHar         from '../assets/stickers/StickyHar.png'
import _sKitKat      from '../assets/stickers/StickyKitKat.png'
import _sNaruto      from '../assets/stickers/StickyNaruto.png'
import _sOreo        from '../assets/stickers/StickyOreo.png'
import _sPancake     from '../assets/stickers/StickyPancake.png'
import _sRadio       from '../assets/stickers/StickyRadio.png'
import _sSandwich    from '../assets/stickers/StickySandwich.png'
import _sVenus       from '../assets/stickers/StickyVenus.png'

const _STICKER_POOL = [
  _sBonbon, _sFleur, _sPasteque, _sCake, _sEtoile, _sHawai, _sBubbleTea, _sTrefle,
  _sBarrette, _sCamera, _sDisc, _sDog, _sFlower, _sFraise, _sHar, _sKitKat,
  _sNaruto, _sOreo, _sPancake, _sRadio, _sSandwich, _sVenus,
]

// 8 zones [topMin%, topMax%, leftMin%, leftMax%] réparties sur toute la page
const _ZONES = [
  [2,  14, 2,  18],   // coin haut-gauche
  [2,  14, 78, 92],   // coin haut-droite
  [74, 86, 2,  18],   // coin bas-gauche
  [74, 86, 76, 90],   // coin bas-droite
  [2,  14, 42, 58],   // haut-centre
  [38, 60, 2,  12],   // milieu-gauche
  [38, 60, 84, 92],   // milieu-droite
  [74, 86, 42, 58],   // bas-centre
]

function _rnd(a, b) { return a + Math.random() * (b - a) }

function _makeStickers() {
  const pool = [..._STICKER_POOL].sort(() => Math.random() - .5)
  return _ZONES.map((z, i) => ({
    img:     pool[i % pool.length],
    top:     _rnd(z[0], z[1]),
    left:    _rnd(z[2], z[3]),
    rot:     _rnd(-40, 40),
    size:    Math.floor(_rnd(54, 90)),
    opacity: _rnd(.48, .82),
  }))
}

export const Tape = ({ children, style, kind = '', color, rot = -3 }) => (
  <span
    className={`tape ${kind ? 'tape--' + kind : ''}`}
    style={{ ['--tape-color']: color, ['--rot']: rot + 'deg', ...style }}>
    {children}
  </span>
)

export const Sticky = ({ children, style, bg = '#fff6b0', rot = -2 }) => (
  <div className="sticky" style={{ ['--note-bg']: bg, transform: `rotate(${rot}deg)`, ...style }}>
    {children}
  </div>
)

export const Stars = ({ value = 4, max = 5, size = 18 }) => (
  <span className="stars">
    {Array.from({ length: max }).map((_, i) => (
      <span
        key={i}
        className={'star' + (i >= value ? ' star--empty' : '')}
        style={{ width: size, height: size }}
      />
    ))}
  </span>
)

export const Polaroid = ({ caption, w = 180, h = 220, photo, rot = -3, style, children, padBot = 38 }) => (
  <div className="polaroid" style={{ transform: `rotate(${rot}deg)`, padding: `10px 10px ${padBot}px`, ...style }}>
    <div className="photo" style={{ width: w, height: h, ...(photo || {}) }}>
      {children || ''}
    </div>
    {caption && <div className="cap">{caption}</div>}
  </div>
)

export const Chip = ({ children, kind = '', style }) => (
  <span className={`chip ${kind ? 'chip--' + kind : ''}`} style={style}>{children}</span>
)

export const PaperClip = ({ size = 28, color = '#b8b8c0', rot = 12, style }) => (
  <svg width={size} height={size * 1.5} viewBox="0 0 24 36" style={{ transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.18))', ...style }}>
    <path d="M6 4 v22 a6 6 0 0 0 12 0 v-18 a3 3 0 0 0 -6 0 v18 a1.5 1.5 0 0 0 3 0 v-16"
      stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
)

export const ScribbleArrow = ({ rot = 0, style, w = 80, h = 60 }) => (
  <svg width={w} height={h} viewBox="0 0 80 60" style={{ transform: `rotate(${rot}deg)`, ...style }}>
    <path d="M4 50 Q 30 8, 70 28 M 62 22 L 70 28 L 62 36" stroke="#1d1a16" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </svg>
)

export const Doodle = ({ kind = 'heart', size = 22, color = '#F297A0', style }) => {
  const d = {
    heart: 'M12 21 C 5 16, 1 11, 4 6 C 7 2, 11 5, 12 8 C 13 5, 17 2, 20 6 C 23 11, 19 16, 12 21 Z',
    flower: 'M12 4 a3 3 0 1 1 0 6 a3 3 0 1 1 0 -6 M4 12 a3 3 0 1 1 6 0 a3 3 0 1 1 -6 0 M14 12 a3 3 0 1 1 6 0 a3 3 0 1 1 -6 0 M12 14 a3 3 0 1 1 0 6 a3 3 0 1 1 0 -6',
    leaf: 'M4 20 C 4 8, 14 4, 22 4 C 22 14, 16 20, 4 20 M 6 18 Q 12 12, 20 8',
    cloud: 'M5 16 a4 4 0 0 1 0 -8 a5 5 0 0 1 10 -2 a4 4 0 0 1 4 10 z',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <path d={d[kind]} fill={kind === 'heart' || kind === 'flower' ? color : 'none'} stroke="#1d1a16" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

export const StarMark = ({ size = 12, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path d="M12 2 L14.9 9.1 L22.6 9.5 L17 14.3 L18.8 21.8 L12 17.8 L5.2 21.8 L7 14.3 L1.4 9.5 L9.1 9.1 Z" fill="var(--ink)" />
  </svg>
)

export const BloodDrop = ({ size = 14, style }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 8 10" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path d="M4 0 C4 0,0.5 3.5,0.5 6.2 A3.5 3.5 0 0 0 7.5 6.2 C7.5 3.5,4 0,4 0 Z" fill="#7a1010" />
    <path d="M2.5 5.5 C2.2 6.5,2.8 7.5,3.8 7.8" stroke="rgba(255,255,255,.25)" strokeWidth=".6" fill="none" strokeLinecap="round"/>
  </svg>
)

export const WaveDivider = ({ width = 300, style }) => {
  const w = width
  const pts = Array.from({ length: Math.floor(w / 18) }, (_, i) =>
    `Q${i * 18 + 9} ${i % 2 === 0 ? 3 : 13},${(i + 1) * 18} 8`
  ).join(' ')
  return (
    <svg width={w} height={16} viewBox={`0 0 ${w} 16`} style={{ display: 'block', ...style }}>
      <path d={`M0 8 ${pts}`} stroke="rgba(29,26,22,.15)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export const Feather = ({ size = 28, color = '#F297A0', style }) => (
  <svg width={size} height={size * 1.5} viewBox="0 0 20 30" style={{ display: 'inline-block', ...style }}>
    <path d="M10 28 C10 28,6 20,6 13 C6 6,11 2,17 1 C17 1,15 7,13 11 C11 15,10 28,10 28Z" fill={color} opacity=".75" />
    <path d="M10 28 C10 22,13 17,17 11" stroke="rgba(29,26,22,.3)" strokeWidth=".8" fill="none" strokeLinecap="round" />
    <path d="M10 28 L10 13" stroke="rgba(29,26,22,.35)" strokeWidth=".7" fill="none" strokeLinecap="round" />
    <path d="M8 21 C10 19,13 18,15 16" stroke="rgba(29,26,22,.2)" strokeWidth=".7" fill="none" strokeLinecap="round" />
    <path d="M7 24 C9 22,12 21,14 19" stroke="rgba(29,26,22,.2)" strokeWidth=".7" fill="none" strokeLinecap="round" />
  </svg>
)

export const RibbonMark = ({ color = '#F297A0', h = 56, w = 22, rot = 0, style }) => (
  <svg width={w} height={h} viewBox="0 0 22 56" style={{ transform: `rotate(${rot}deg)`, display: 'inline-block', ...style }}>
    <path d="M1 0 L21 0 L21 48 L11 40 L1 48 Z" fill={color} opacity=".82" />
    <path d="M6 8 L16 8 M6 13 L16 13" stroke="rgba(255,255,255,.4)" strokeWidth="1" strokeLinecap="round" />
  </svg>
)

const _KIND_TO_PNG = {
  flower_white:  _sFleur,
  tulips:        _sTrefle,
  flowers_small: _sBonbon,
  lotus:         _sPasteque,
  shrub:         _sHawai,
  cake:          _sCake,
  etoile:        _sEtoile,
  bubbletea:     _sBubbleTea,
}

export const Sticker = ({ kind = 'flower_white', size = 60, rot = 0, filter: filterOverride, style }) => {
  const src = _KIND_TO_PNG[kind] ?? _sFleur
  return (
    <img src={src} alt="" style={{
      width: size,
      flexShrink: 0,
      transform: `rotate(${rot}deg)`,
      filter: filterOverride,
      pointerEvents: 'none',
      userSelect: 'none',
      display: 'block',
      ...style,
    }} />
  )
}

export const PlantPot = ({ size = 100, style }) => (
  <svg width={size} height={size * 1.35} viewBox="0 0 100 135" style={{ display: 'block', ...style }}>
    {/* Pot */}
    <path d="M30 85 L70 85 L63 115 L37 115 Z" fill="#c98b72" />
    <rect x="25" y="78" width="50" height="9" rx="3" fill="#da9a80" />
    <path d="M28 82 L72 82" stroke="rgba(255,255,255,.28)" strokeWidth="1.8" strokeLinecap="round" />
    {/* Soil */}
    <ellipse cx="50" cy="82" rx="23" ry="5" fill="#4a2e12" opacity=".55" />
    {/* Tiges */}
    <path d="M50 82 C48 68,40 55,32 42" stroke="#4e7228" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M50 82 C52 65,62 50,66 34" stroke="#4e7228" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M50 82 C53 70,58 60,55 48" stroke="#4e7228" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M50 82 C47 72,42 66,36 62" stroke="#4e7228" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* Feuille gauche - grande */}
    <path d="M32 42 C16 34,6 18,18 6 C30 -6,40 16,32 42 Z" fill="#8bbf46" opacity=".92" />
    <path d="M32 42 C24 28,18 14,22 8" stroke="#5a7a28" strokeWidth=".9" fill="none" strokeLinecap="round" />
    {/* Feuille droite - grande */}
    <path d="M66 34 C80 24,94 10,82 0 C70 -10,60 14,66 34 Z" fill="#79b03a" opacity=".88" />
    <path d="M66 34 C76 20,82 8,78 2" stroke="#527a22" strokeWidth=".9" fill="none" strokeLinecap="round" />
    {/* Feuille centre */}
    <path d="M55 48 C64 40,72 30,64 22 C56 14,48 30,55 48 Z" fill="#9bcf52" opacity=".78" />
    <path d="M55 48 C62 38,66 26,62 22" stroke="#5a7a28" strokeWidth=".8" fill="none" strokeLinecap="round" />
    {/* Feuille basse gauche */}
    <path d="M36 62 C26 58,18 50,24 44 C30 38,38 50,36 62 Z" fill="#7aaf40" opacity=".72" />
    {/* Petits details pot */}
    <circle cx="43" cy="100" r="2" fill="rgba(255,255,255,.14)" />
    <circle cx="57" cy="97" r="1.8" fill="rgba(255,255,255,.12)" />
    <circle cx="50" cy="104" r="1.5" fill="rgba(255,255,255,.1)" />
  </svg>
)

export const FloralCluster = ({ size = 200, style, variant = 0 }) => {
  const colors = ['#F297A0', '#F9D0CE', '#B6BB79']
  const v = [
    [[30,34,18,0,.55],[62,22,14,1,.85],[86,52,20,0,.7],[38,70,12,1,1],[110,30,10,0,.5],[148,34,8,1,1],[178,52,12,0,.6]],
    [[40,40,22,0,.6],[80,30,16,1,.85],[110,60,14,2,.55],[36,80,10,1,1],[150,30,8,0,.5]],
  ][variant % 2]
  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 230 200" style={style}>
      {v.map(([cx, cy, r, ci, op], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={colors[ci]} opacity={op} />
      ))}
      <ellipse cx="62" cy="90" rx="18" ry="9" fill="#B6BB79" opacity=".6" transform="rotate(28 62 90)" />
      <ellipse cx="160" cy="90" rx="14" ry="8" fill="#B6BB79" opacity=".55" transform="rotate(40 160 90)" />
    </svg>
  )
}

export const Page = ({ children, w = 'min(1280px, 95vw)', style }) => {
  const [stickers] = useState(_makeStickers)
  return (
    <div className="paper" style={{ width: w, minHeight: 'min(880px, 95vh)', position: 'relative', margin: '0 auto', ...style }}>
      {stickers.map((s, i) => (
        <img key={i} src={s.img} alt="" style={{
          position: 'absolute',
          top: `${s.top}%`,
          left: `${s.left}%`,
          width: s.size,
          transform: `rotate(${s.rot}deg)`,
          opacity: s.opacity,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

export const NavBar = ({ active = 'home', session }) => {
  const items = [
    ['home', 'accueil', '/'],
    ['gallery', 'bibliothèque', '/gallery'],
    ['bookmarks', 'à lire', '/bookmarks'],
    ['writing', 'écrire', '/writing'],
    ['characters', 'fiches', '/characters'],
    ['stats', 'stats', '/stats'],
  ]
  if (session) items.push(['admin', 'index', '/admin'])

  return (
    <div style={{ display:'flex', alignItems:'center', gap: 28, fontFamily:'var(--f-mono)', fontSize: 11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--ink)' }}>
      {items.map(([k, label, path]) => (
        <Link key={k} to={path} style={{ textDecoration: 'none', color: 'inherit' }}>
          <span style={{ position:'relative', paddingBottom: 2, borderBottom: active === k ? '1.6px solid var(--ink)' : 'none', opacity: active === k ? 1 : .55 }}>
            {label}
            {active === k && <span className="sparkle" style={{ position:'absolute', top:-10, right:-14 }} />}
          </span>
        </Link>
      ))}
      <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span style={{ position:'relative', paddingBottom: 2, borderBottom: active === 'login' ? '1.6px solid var(--ink)' : 'none', opacity: active === 'login' ? 1 : .55 }}>
          {session ? 'déconnexion' : 'connexion'}
          {active === 'login' && <span className="sparkle" style={{ position:'absolute', top:-10, right:-14 }} />}
        </span>
      </Link>
    </div>
  )
}

export const Header = ({ active }) => {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{ position:'absolute', top: 28, left: 56, right: 56, display:'flex', justifyContent:'space-between', alignItems:'center', zIndex: 5 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap: 10 }}>
        <span className="brand-mark" style={{ fontSize: 22 }}>All Roads</span>
        <span className="handwriting" style={{ fontSize: 26, color:'var(--primrose)', filter:'brightness(.85)' }}>lead to</span>
        <span className="brand-mark" style={{ fontSize: 22, fontStyle:'italic' }}>Ao3</span>
        <span className="mono" style={{ fontSize: 9, letterSpacing: '.3em', marginLeft: 6, color:'var(--ink-mute)' }}>· EST. 2026</span>
      </div>
      <NavBar active={active} session={session} />
    </div>
  )
}

// ── Icônes de classement de contenu ───────────────────────────────────────────

// Fleur vanille — pas de contenu sexuel
export const RatingFlower = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    {[0, 72, 144, 216, 288].map(deg => (
      <ellipse key={deg} cx="12" cy="7.2" rx="2.8" ry="4.6"
        fill="#F9D0CE" stroke="rgba(29,26,22,.22)" strokeWidth=".55"
        transform={`rotate(${deg} 12 12)`} />
    ))}
    <circle cx="12" cy="12" r="3.4" fill="#fef0c4" stroke="rgba(29,26,22,.18)" strokeWidth=".55" />
    <circle cx="12" cy="12" r="1.8" fill="#f5c840" />
  </svg>
)

// Pêche — contenu vanilla
export const RatingPeach = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    {/* Corps de la pêche */}
    <path d="M12 4.5 C7.5 4.5 4 8 4 13 C4 18 7.5 21 12 21 C16.5 21 20 18 20 13 C20 8 16.5 4.5 12 4.5 Z"
      fill="#FFAD87" stroke="rgba(29,26,22,.18)" strokeWidth=".6" />
    {/* Reflet */}
    <ellipse cx="9.5" cy="11" rx="2" ry="2.8" fill="rgba(255,255,255,.32)" transform="rotate(-25 9.5 11)" />
    {/* Fente du haut */}
    <path d="M10.2 6 C11 4.2, 12 5, 12 7 C12 5, 13 4.2, 13.8 6"
      stroke="#d97850" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    {/* Feuille */}
    <path d="M13.5 5 C18 1.5, 22 5.5, 19.5 8.5 C17 5.5, 15 4, 13.5 5 Z"
      fill="#7aaf40" opacity=".92" />
    <path d="M13.5 5 C16 6, 18 7.5, 19.5 8.5"
      stroke="#5a7a28" strokeWidth=".5" fill="none" strokeLinecap="round" />
  </svg>
)

// Toy icon — contenu explicite / hardcore
export const RatingTriskelion = ({ size = 18, style }) => (
  <img src={toyIcon} width={size} height={size} alt="explicit"
    style={{ display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', ...style }} />
)

// Composant unique qui choisit l'icône selon le type
export const RatingIcon = ({ kind, size = 18, style }) => {
  if (kind === 'no_sex')  return <RatingFlower      size={size} style={style} />
  if (kind === 'vanilla') return <RatingPeach        size={size} style={style} />
  if (kind === 'explicit') return <RatingTriskelion  size={size} style={style} />
  return null
}
