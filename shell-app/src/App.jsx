import React, { Suspense, useState, useEffect, lazy } from 'react'

const Login = lazy(() => import('authApp/Login'))
const VideoUpload = lazy(() => import('contestApp/VideoUpload'))
const VideoPlayer = lazy(() => import('contestApp/VideoPlayer'))
const UploadPage = React.lazy(() => import('remoteApp1/UploadPage'));

const API_BASE = 'http://localhost:3333'

function Loader({ text = 'Loading...' }) {
  return (
    <div style={styles.loader}>
      <div style={styles.spinner} />
      <span>{text}</span>
    </div>
  )
}

class RemoteErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorBox}>
          <strong>⚠️ Microfrontend failed to load</strong>
          <p style={{ marginTop: 8, fontSize: 13 }}>
            Make sure{' '}
            <code>
              {this.props.name === 'auth' ? 'auth-app (port 5001)' : 'contest-app (port 5002)'}
            </code>{' '}
            is built and running.
          </p>
          <p style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
            Run:{' '}
            <code>
              cd {this.props.name === 'auth' ? 'auth-app' : 'contest-app'} && npm run build && npm
              run preview
            </code>
          </p>
          <p style={{ marginTop: 4, fontSize: 11, color: '#666' }}>
            Error: {this.state.error?.message}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState('')
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
        loadFeed(savedToken)
      } catch {
        // Clear corrupt data
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const loadFeed = async (t) => {
    setFeedLoading(true)
    setFeedError('')
    try {
      const res = await fetch(`${API_BASE}/api/videos/feed`, {
        headers: {
          Authorization: `Bearer ${t}`,
          Accept: 'application/json',
        },
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Backend returned non-JSON for /api/videos/feed')
      }

      if (!res.ok) throw new Error(data.message || 'Failed to load feed')
      setVideos(data.videos || [])
    } catch (err) {
      console.error('Feed error:', err)
      setFeedError(err.message)
    } finally {
      setFeedLoading(false)
    }
  }

  const handleLoginSuccess = (t, u) => {
    localStorage.setItem('access_token', t)
    localStorage.setItem('user', JSON.stringify(u))
    setToken(t)
    setUser(u)
    loadFeed(t)
  }

  const handleLogout = async () => {
    // Call logout endpoint
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch { }

    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setVideos([])
  }

  const handleUploadComplete = (newVideo) => {
    setVideos((prev) => [newVideo, ...prev])
  }

  return (
    <div style={styles.app}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.logo}>🎬Mini Reels</div>
        {
          user && (
            <div style={styles.headerRight}>
              <span style={styles.userBadge}>👤 {user.username || user.email}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </div>
          )
        }
      </header >

      {/* ── Main content ───────────────────────────────────────────────── */}
      < main style={styles.main} >
        {!token ? (
          /* ── Auth section ─────────────────────────────────────────────── */
          <RemoteErrorBoundary name="auth">
            <Suspense fallback={<Loader text="Loading auth module..." />}>
              <Login onLoginSuccess={handleLoginSuccess} />
            </Suspense>
          </RemoteErrorBoundary>
        ) : (
          /* ── Authenticated section ────────────────────────────────────── */
          <>
            {/* Upload */}
            <RemoteErrorBoundary name="contest">
              <Suspense fallback={<Loader text="Loading upload module..." />}>
                <VideoUpload token={token} onUploadComplete={handleUploadComplete} />
              </Suspense>
            </RemoteErrorBoundary>

            <RemoteErrorBoundary name="videouploader">
              <Suspense fallback={<Loader text="Loading upload page..." />}>
                <UploadPage />
              </Suspense>
            </RemoteErrorBoundary>

            {/* Feed */}
            <div style={styles.feedSection}>
              <div style={styles.feedHeader}>
                <h3 style={styles.feedTitle}>📽️ Your Reels</h3>
                <button
                  onClick={() => loadFeed(token)}
                  disabled={feedLoading}
                  style={styles.refreshBtn}
                >
                  {feedLoading ? '⏳' : '🔄'} Refresh
                </button>
              </div>

              {feedError && <div style={styles.feedError}>⚠️ {feedError}
              </div>}

              {feedLoading && <Loader text="Loading videos..." />}

              {!feedLoading && !feedError && videos.length === 0 && (
                <div style={styles.emptyState}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>🎬</p>
                  <p style={{ color: '#666' }}>No reels yet — upload your first one!</p>
                </div>
              )}

              <RemoteErrorBoundary name="contest">
                <Suspense fallback={<Loader text="Loading player..." />}>
                  {videos.map((v) => (
                    <VideoPlayer
                      key={v.id}
                      title={v.title}
                      hlsUrl={v.hls_url}
                      cloudinaryUrl={v.cloudinary_url}
                    />
                  ))}
                </Suspense>
              </RemoteErrorBoundary>
            </div>
          </>
        )
        }
      </main >
    </div >
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  app: {
    minHeight: '100vh',
    background: '#13131f',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    background: '#1a1a2e',
    borderBottom: '1px solid #2a2a3e',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
  },
  logo: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userBadge: {
    color: '#888',
    fontSize: '14px',
  },
  logoutBtn: {
    padding: '6px 16px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: 'transparent',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  main: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  loader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#666',
    padding: '32px',
    justifyContent: 'center',
    fontSize: '14px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #333',
    borderTop: '2px solid #7c6af7',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    background: 'rgba(255,107,107,0.08)',
    border: '1px solid rgba(255,107,107,0.25)',
    borderRadius: '12px',
    padding: '20px 24px',
    color: '#ff6b6b',
    margin: '20px 0',
  },
  feedSection: {
    marginTop: '32px',
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  feedTitle: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: '16px',
    margin: 0,
  },
  refreshBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: 'transparent',
    color: '#888',
    cursor: 'pointer',
    fontSize: '12px',
  },
  feedError: {
    background: 'rgba(255,107,107,0.08)',
    border: '1px solid rgba(255,107,107,0.2)',
    borderRadius: '8px',
    color: '#ff6b6b',
    padding: '12px 16px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#555',
  },
}