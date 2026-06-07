import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, Header, Tape, ScribbleArrow, FloralCluster, Doodle } from '../components/JournalShared'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(undefined)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    navigate('/')
  }

  if (session === undefined) return null

  if (session) return (
    <Page>
      <Header active="login" />
      <div className="floral-corner" style={{ opacity: .65, pointerEvents: 'none' }} />
      <div className="floral-corner floral-corner--br" style={{ opacity: .55, pointerEvents: 'none' }} />

      <div style={{ padding: '88px 24px 56px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 'min(520px, 100%)', position: 'relative' }}>
          <div className="card" style={{ padding: '56px 64px 64px', position: 'relative', transform: 'rotate(-.4deg)', textAlign: 'center' }}>
            <Tape kind="grid" color="var(--lime)" rot={-6} style={{ top: -12, left: 60, padding: '8px 30px' }}> </Tape>
            <Tape kind="dots" color="var(--primrose)" rot={5} style={{ top: -12, right: 60, padding: '8px 30px' }}> </Tape>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <Doodle kind="flower" size={22} color="var(--lime)" />
              <Doodle kind="heart"  size={18} color="#F297A0" style={{ marginTop: 4 }} />
              <Doodle kind="flower" size={22} color="var(--primrose)" />
            </div>

            <div className="mono" style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>
              CONNECTÉ EN TANT QUE
            </div>
            <div className="heading-handwritten" style={{ fontSize: 26, marginTop: 10, color: 'var(--ink)', wordBreak: 'break-all' }}>
              {session.user.email}
            </div>

            <div style={{ marginTop: 12, fontFamily: 'var(--f-body)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
              ton journal t'attend — bonne lecture ✿
            </div>

            <div style={{ height: 1, background: 'rgba(29,26,22,.1)', margin: '32px 0' }} />

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="btn-stamp"
              style={{ width: '100%', padding: '14px', fontSize: 13, opacity: loading ? .6 : 1, cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'déconnexion…' : 'se déconnecter ✦'}
            </button>

            <div style={{ marginTop: 16 }}>
              <button onClick={() => navigate('/admin')}
                className="btn-stamp btn-stamp--ghost"
                style={{ fontSize: 11, padding: '8px 18px' }}>
                → aller à l'index
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <FloralCluster size={140} variant={1} style={{ opacity: .8 }} />
          </div>
        </div>
      </div>
    </Page>
  )

  return (
    <Page>
      <Header active="login" />

      {/* Décoratifs */}
      <div className="floral-corner" style={{ opacity: .65, pointerEvents: 'none' }} />
      <div className="floral-corner floral-corner--br" style={{ opacity: .55, pointerEvents: 'none' }} />

      {/* Contenu centré via flex */}
      <div style={{ padding: '88px 24px 56px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 'min(560px, 100%)', position: 'relative' }}>

          <div className="tab-side" style={{ left: -22, right: 'auto' }}>
            <div className="tab" style={{ ['--c']: 'var(--pinktone)', clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 12% 100%, 0 50%)' }}>home</div>
            <div className="tab" style={{ ['--c']: 'var(--lime)', clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 12% 100%, 0 50%)' }}>biblio</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: '56px 64px 64px', position: 'relative', transform: 'rotate(-.4deg)' }}>
              <Tape kind="grid" color="var(--lime)" rot={-6} style={{ top: -12, left: 60, padding: '8px 30px' }}> </Tape>
              <Tape kind="dots" color="var(--primrose)" rot={5} style={{ top: -12, right: 60, padding: '8px 30px' }}> </Tape>

              <div className="mono" style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>
                ─ JOURNAL DE LECTURE PRIVÉ ─
              </div>
              <div className="heading-handwritten" style={{ fontSize: 70, lineHeight: .95, marginTop: 12, color: 'var(--ink)' }}>
                bon <span style={{ color: 'var(--primrose)', filter: 'brightness(.85)', fontStyle: 'italic' }}>retour</span>
                <span className="sparkle" style={{ marginLeft: 8 }} />
              </div>
              <div className="body-serif" style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--ink-soft)', marginTop: 8 }}>
                déverrouille ta bibliothèque — reprends là où tu t'étais arrêté·e.
              </div>

              <div style={{ marginTop: 36, display: 'grid', gap: 28 }}>
                <label style={{ display: 'block' }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>TON ADRESSE EMAIL</span>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.6px solid var(--ink)', marginTop: 6, paddingBottom: 6 }}>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="your@email.com"
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--f-hand)', fontSize: 26, color: 'var(--ink)' }}
                    />
                  </div>
                </label>

                <label style={{ display: 'block' }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>LE MOT SECRET</span>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.6px solid var(--ink)', marginTop: 6, paddingBottom: 6 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--f-hand)', fontSize: 26, letterSpacing: showPassword ? 'normal' : '.4em', color: 'var(--ink)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-mute)', padding: 0 }}>
                      {showPassword ? 'masquer ⊙' : 'voir ⊙'}
                    </button>
                  </div>
                </label>

                {error && (
                  <div className="mono" style={{ fontSize: 11, color: '#c0392b', letterSpacing: '.05em' }}>
                    ✗ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-stamp"
                  style={{ width: '100%', padding: '16px', fontSize: 13, opacity: loading ? .6 : 1, cursor: loading ? 'wait' : 'pointer' }}>
                  {loading ? 'ouverture…' : 'ouvrir le journal ✦'}
                </button>

                <div className="divider-wave" style={{ margin: '4px 0' }} />

                <div style={{ textAlign: 'center', fontFamily: 'var(--f-body)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
                  nouveau·elle ici ? <span className="handwriting" style={{ fontSize: 22, color: 'var(--primrose)', filter: 'brightness(.85)' }}>commence ta bibliothèque →</span>
                </div>
              </div>

              {/* Annotation décorative — positionnée hors du card */}
              <div style={{ position: 'absolute', right: -180, top: 60, width: 160, transform: 'rotate(6deg)', pointerEvents: 'none' }}>
                <ScribbleArrow rot={-160} w={70} h={50} style={{ marginLeft: 80 }} />
                <div className="handwriting" style={{ fontSize: 20, color: 'var(--ink-soft)' }}>
                  psst — ta bibliothèque<br />te réclame ✿
                </div>
              </div>
            </div>
          </form>

          <div style={{ marginTop: 16 }}>
            <FloralCluster size={140} variant={1} style={{ opacity: .8 }} />
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div style={{ padding: '0 56px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>
          ALLROADSLEADTOAO3 · v 1.0
        </span>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '.3em', color: 'var(--ink-mute)' }}>
          ─ 04 / 05 · CONNEXION ─
        </span>
      </div>
    </Page>
  )
}
