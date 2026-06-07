import { useMemo } from 'react'

// Ajuste `frames` si l'animation est trop rapide/lente ou saute des frames

export function SpriteAnimation({
  src,
  totalWidth,
  frameHeight,
  frames,
  fps = 8,
  scale = 1,
  blendMode = false,
  style = {},
}) {
  const uid = useMemo(() => `spr_${Math.random().toString(36).slice(2, 8)}`, [])
  const fw = Math.round(totalWidth / frames)
  const duration = frames / fps

  return (
    <>
      <style>{`
        @keyframes ${uid} {
          from { background-position-x: 0px; }
          to   { background-position-x: -${totalWidth * scale}px; }
        }
      `}</style>
      <div style={{
        width: fw * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${src})`,
        backgroundSize: `${totalWidth * scale}px ${frameHeight * scale}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPositionY: 0,
        animation: `${uid} ${duration}s steps(${frames}) infinite`,
        imageRendering: 'pixelated',
        flexShrink: 0,
        mixBlendMode: blendMode ? 'multiply' : undefined,
        ...style,
      }} />
    </>
  )
}

// Personnage qui traverse l'écran de gauche à droite ou droite à gauche (position: fixed → hors du carnet)
export function WalkerSprite({
  src,
  totalWidth,
  frameHeight,
  frames,
  fps = 7,
  scale = 1,
  direction = 'ltr',   // 'ltr' | 'rtl'
  travelDuration = 18,
  delay = 0,
  bottom = 0,
}) {
  const uid = useMemo(() => `wlk_${Math.random().toString(36).slice(2, 8)}`, [])
  const fw = Math.round(totalWidth / frames)
  const spriteDuration = frames / fps

  const fromX = direction === 'ltr' ? '-150px' : '110vw'
  const toX   = direction === 'ltr' ? '110vw'  : '-150px'

  return (
    <>
      <style>{`
        @keyframes ${uid}_sprite {
          from { background-position-x: 0px; }
          to   { background-position-x: -${totalWidth * scale}px; }
        }
        @keyframes ${uid}_move {
          from { transform: translateX(${fromX}); }
          to   { transform: translateX(${toX}); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom,
        left: 0,
        width: fw * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${src})`,
        backgroundSize: `${totalWidth * scale}px ${frameHeight * scale}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPositionY: 0,
        animation: [
          `${uid}_sprite ${spriteDuration}s steps(${frames}) infinite`,
          `${uid}_move ${travelDuration}s linear ${delay}s infinite`,
        ].join(', '),
        imageRendering: 'pixelated',
        pointerEvents: 'none',
        zIndex: 50,
      }} />
    </>
  )
}

// Overlay plein écran pour l'animation iconique (Higuruma)
export function IconicPoseOverlay({ src, totalWidth, frameHeight, frames, fps = 8, scale = 2, onClose }) {
  const uid = useMemo(() => `ico_${Math.random().toString(36).slice(2, 8)}`, [])
  const fw = Math.round(totalWidth / frames)
  const duration = frames / fps

  return (
    <>
      <style>{`
        @keyframes ${uid} {
          from { background-position-x: 0px; }
          to   { background-position-x: -${totalWidth * scale}px; }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,10,5,0.75)',
          backdropFilter: 'blur(4px)',
          cursor: 'pointer',
          animation: 'fadeInOverlay .2s ease',
        }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: fw * scale,
            height: frameHeight * scale,
            backgroundImage: `url(${src})`,
            backgroundSize: `${totalWidth * scale}px ${frameHeight * scale}px`,
            backgroundRepeat: 'no-repeat',
            backgroundPositionY: 0,
            animation: `${uid} ${duration}s steps(${frames}) infinite`,
            imageRendering: 'pixelated',
            margin: '0 auto',
          }} />
          <p style={{
            marginTop: 16,
            fontFamily: 'var(--f-mono, monospace)',
            fontSize: 11,
            letterSpacing: '.25em',
            color: 'rgba(255,250,240,.5)',
          }}>
            HIROMI HIGURUMA · cliquez pour fermer
          </p>
        </div>
      </div>
    </>
  )
}
