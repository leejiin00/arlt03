const PINK  = '#F297A0'
const SOFT  = '#F9D0CE'
const LIME  = '#B6BB79'
const LIME_D = '#8a8f55'

const Flower = ({ color = PINK, size = 20, opacity = 0.6 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    {[0, 72, 144, 216, 288].map(r => (
      <ellipse key={r} cx="10" cy="4.5" rx="2.2" ry="3.5"
        fill={color} opacity={opacity}
        transform={`rotate(${r} 10 10)`} />
    ))}
    <circle cx="10" cy="10" r="2.8" fill="white" opacity="0.7" />
    <circle cx="10" cy="10" r="1.6" fill={color} opacity="0.4" />
  </svg>
)

const Daisy = ({ color = SOFT, size = 16, opacity = 0.65 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    {[0, 45, 90, 135, 180, 225, 270, 315].map(r => (
      <ellipse key={r} cx="10" cy="4" rx="1.6" ry="3"
        fill={color} opacity={opacity}
        transform={`rotate(${r} 10 10)`} />
    ))}
    <circle cx="10" cy="10" r="2.5" fill="#fff9f0" opacity="0.9" />
  </svg>
)

const Leaf = ({ color = LIME, size = 20, opacity = 0.55 }) => (
  <svg width={size * 0.65} height={size} viewBox="0 0 13 20">
    <path d="M6.5 1 C 2 6, 1.5 14, 6.5 19 C 11.5 14, 11 6, 6.5 1 Z"
      fill={color} opacity={opacity} />
    <line x1="6.5" y1="2" x2="6.5" y2="18"
      stroke={LIME_D} strokeWidth="0.9" opacity="0.4" />
  </svg>
)

const Star = ({ color = PINK, size = 13, opacity = 0.48 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14">
    <path d="M7 1 L8.1 5.4 L12.8 5 L9.2 7.8 L11.5 12.5 L7 10 L2.5 12.5 L4.8 7.8 L1.2 5 L5.9 5.4 Z"
      fill={color} opacity={opacity} />
  </svg>
)

const Dot = ({ color = SOFT, size = 8, opacity = 0.42 }) => (
  <svg width={size} height={size} viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="3.5" fill={color} opacity={opacity} />
  </svg>
)

// x/y en % viewport, rot en degrés
const DECO = [
  // ── Bord gauche ──────────────────────────────────────────
  { C: Flower, x:  2.5, y:  6,  size: 22, color: PINK,  rot:  15, op: 0.58 },
  { C: Leaf,   x:  6.5, y: 13,  size: 26, color: LIME,  rot: -20, op: 0.50 },
  { C: Dot,    x:  1.8, y: 22,  size:  9, color: SOFT,  rot:   0, op: 0.40 },
  { C: Daisy,  x:  5,   y: 31,  size: 18, color: SOFT,  rot:  -8, op: 0.52 },
  { C: Star,   x:  3,   y: 41,  size: 14, color: PINK,  rot:  22, op: 0.45 },
  { C: Leaf,   x:  7,   y: 51,  size: 24, color: LIME,  rot:  30, op: 0.48 },
  { C: Dot,    x:  3.5, y: 60,  size:  7, color: LIME,  rot:   0, op: 0.35 },
  { C: Flower, x:  5.5, y: 69,  size: 20, color: SOFT,  rot: -12, op: 0.50 },
  { C: Leaf,   x:  2,   y: 80,  size: 26, color: LIME,  rot: -25, op: 0.44 },
  { C: Star,   x:  6.5, y: 90,  size: 13, color: SOFT,  rot:  10, op: 0.40 },

  // ── Bord droit ───────────────────────────────────────────
  { C: Leaf,   x: 93,   y:  5,  size: 24, color: LIME,  rot:  18, op: 0.50 },
  { C: Flower, x: 96.5, y: 15,  size: 22, color: PINK,  rot: -10, op: 0.55 },
  { C: Dot,    x: 91.5, y: 25,  size:  9, color: PINK,  rot:   0, op: 0.40 },
  { C: Daisy,  x: 94.5, y: 35,  size: 18, color: SOFT,  rot:  12, op: 0.50 },
  { C: Leaf,   x: 92,   y: 47,  size: 22, color: LIME,  rot: -18, op: 0.46 },
  { C: Star,   x: 96.5, y: 57,  size: 14, color: PINK,  rot:  30, op: 0.45 },
  { C: Dot,    x: 92.5, y: 65,  size:  8, color: LIME,  rot:   0, op: 0.36 },
  { C: Flower, x: 95.5, y: 75,  size: 20, color: PINK,  rot:   8, op: 0.50 },
  { C: Leaf,   x: 91,   y: 85,  size: 26, color: LIME,  rot:  22, op: 0.45 },

  // ── Bord haut ────────────────────────────────────────────
  { C: Dot,    x: 18,   y:  2,  size:  8, color: SOFT,  rot:   0, op: 0.38 },
  { C: Flower, x: 27,   y:  3,  size: 16, color: PINK,  rot:  -5, op: 0.45 },
  { C: Leaf,   x: 57,   y:  2,  size: 18, color: LIME,  rot:  10, op: 0.40 },
  { C: Star,   x: 72,   y:  4,  size: 13, color: SOFT,  rot:  18, op: 0.40 },

  // ── Bord bas ─────────────────────────────────────────────
  { C: Flower, x: 21,   y: 95,  size: 18, color: SOFT,  rot:   6, op: 0.45 },
  { C: Leaf,   x: 42,   y: 97,  size: 20, color: LIME,  rot: -14, op: 0.42 },
  { C: Dot,    x: 61,   y: 94,  size:  8, color: PINK,  rot:   0, op: 0.38 },
  { C: Star,   x: 76,   y: 96,  size: 14, color: PINK,  rot:  24, op: 0.40 },
  { C: Daisy,  x: 85,   y: 95,  size: 16, color: SOFT,  rot:  -8, op: 0.45 },
]

export default function Decorations() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
    }}>
      {DECO.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${d.x}vw`,
          top: `${d.y}vh`,
          transform: `rotate(${d.rot}deg)`,
        }}>
          <d.C size={d.size} color={d.color} opacity={d.op} />
        </div>
      ))}
    </div>
  )
}
