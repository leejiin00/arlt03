import { useState, useEffect, useRef } from 'react'
import spriteIdleSrc      from '../assets/HigurumaSniffingTournesol.png'
import spriteWaveSrc      from '../assets/HigurumaIconicPose.png'
import spriteWalkRightSrc from '../assets/HigurmawalkingSideLeftRight.png'
import spriteWalkLeftSrc  from '../assets/HigurumawalkingSideRightLeft.png'

const TARGET_H = 154
const WALK_SPEED = 1.5

const SPRITES = {
  idle:      { src: spriteIdleSrc,      frames: 6,  fps: 4,  w: 116, h: 246 },
  wave:      { src: spriteWaveSrc,      frames: 10, fps: 6,  w: 143, h: 255},
  walkRight: { src: spriteWalkRightSrc, frames: 6,  fps: 5,  w: 117, h: 252 },
  walkLeft:  { src: spriteWalkLeftSrc,  frames: 6,  fps: 5,  w: 117, h: 252 },
}

function scaleOf(s) { return TARGET_H / s.h }

export default function HigurumaMascot() {
  const [anim, setAnim] = useState('idle')
  const [frame, setFrame] = useState(0)
  const [posX, setPosX] = useState(400)
  const [opacity, setOpacity] = useState(1)

  const r = useRef({ anim: 'idle', beforeWave: 'idle', posX: 400, frame: 0 })

  function switchTo(name) {
    setOpacity(0)
    setTimeout(() => {
      r.current.anim  = name
      r.current.frame = 0
      setAnim(name)
      setFrame(0)
      setOpacity(1)
    }, 80)
  }

  useEffect(() => {
    const { fps, frames } = SPRITES[anim]
    const id = setInterval(() => {
      if (r.current.anim === 'idle' && r.current.frame >= frames - 1) return

      const next = (r.current.frame + 1) % frames
      r.current.frame = next
      setFrame(next)

      if (r.current.anim === 'wave' && next === 0) {
        const ret = r.current.beforeWave === 'wave' ? 'idle' : r.current.beforeWave
        switchTo(ret)
      }
    }, 1000 / fps)
    return () => clearInterval(id)
  }, [anim])

  useEffect(() => {
    if (anim !== 'walkRight' && anim !== 'walkLeft') return
    const dir = anim === 'walkRight' ? WALK_SPEED : -WALK_SPEED
    const spriteW = SPRITES[anim].w * scaleOf(SPRITES[anim])

    const id = setInterval(() => {
      const maxX = window.innerWidth - spriteW - 16
      const nx = Math.max(8, Math.min(maxX, r.current.posX + dir))
      r.current.posX = nx
      setPosX(nx)
      if (nx >= maxX || nx <= 8) switchTo('idle')
    }, 16)
    return () => clearInterval(id)
  }, [anim])

  useEffect(() => {
    let t
    function schedule() {
      t = setTimeout(() => {
        if (r.current.anim === 'idle') {
          switchTo(r.current.posX < window.innerWidth / 2 ? 'walkRight' : 'walkLeft')
        }
        schedule()
      }, 15000 + Math.random() * 10000)
    }
    schedule()
    return () => clearTimeout(t)
  }, [])

  function handleClick() {
    if (r.current.anim !== 'wave') {
      r.current.beforeWave = r.current.anim
      switchTo('wave')
    }
  }

  const s = SPRITES[anim]
  const sc = scaleOf(s)

  return (
    <div
      onClick={handleClick}
      title="Hiromi Higuruma ✦"
      style={{
        position: 'fixed',
        bottom: 0,
        left: posX,
        width: s.w * sc,
        height: s.h * sc,
        backgroundImage: `url(${s.src})`,
        backgroundSize: `${s.frames * s.w * sc}px ${s.h * sc}px`,
        backgroundPosition: `-${frame * s.w * sc}px 0px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        opacity,
        transition: 'opacity 0.08s ease',
        cursor: 'pointer',
        zIndex: 9999,
        userSelect: 'none',
        transform: s.boost ? `scale(${s.boost})` : undefined,
        transformOrigin: 'bottom center',
      }}
    />
  )
}
