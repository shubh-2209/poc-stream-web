import React, { useState } from 'react'

const API_BASE = 'http://localhost:3333'

export default function Login({ onLoginSuccess }) {
    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const resetForm = () => {
        setUsername('')
        setEmail('')
        setPassword('')
        setError('')
    }

    const switchMode = (newMode) => {
        setMode(newMode)
        resetForm()
    }

    const handleSubmit = async () => {
        setError('')

        // Basic validation
        if (!email.trim() || !password.trim()) {
            setError('Email and password are required')
            return
        }
        if (mode === 'register' && !username.trim()) {
            setError('Username is required')
            return
        }

        setLoading(true)

        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
            const body =
                mode === 'login'
                    ? { email: email.trim(), password }
                    : { username: username.trim(), email: email.trim(), password }

            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(body),
            })

            // Always parse as text first to debug if we get HTML
            const text = await res.text()

            let data
            try {
                data = JSON.parse(text)
            } catch {
                console.error('Server returned non-JSON:', text.substring(0, 200))
                setError('Server error — check that backend is running on port 3333')
                return
            }

            if (!res.ok) {
                setError(data.message || 'Something went wrong')
                return
            }

            // Success — pass token and user up to shell
            onLoginSuccess(data.token.token, data.user)
        } catch (err) {
            console.error('Network error:', err)
            setError('Cannot connect to backend. Is it running on http://localhost:3333?')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit()
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                {/* Tab switcher */}
                <div style={styles.tabs}>
                    <button
                        style={{
                            ...styles.tab,
                            ...(mode === 'login' ? styles.activeTab : {}),
                        }}
                        onClick={() => switchMode('login')}
                    >
                        Login
                    </button>
                    <button
                        style={{
                            ...styles.tab,
                            ...(mode === 'register' ? styles.activeTab : {}),
                        }}
                        onClick={() => switchMode('register')}
                    >
                        Register
                    </button>
                </div>

                <h2 style={styles.title}>
                    {mode === 'login' ? '👋 Welcome Back' : '🎬 Create Account'}
                </h2>

                {/* Username — register only */}
                {mode === 'register' && (
                    <div style={styles.field}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            placeholder="anushka"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={styles.input}
                            autoComplete="username"
                        />
                    </div>
                )}

                <div style={styles.field}>
                    <label style={styles.label}>Email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={styles.input}
                        autoComplete="email"
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={styles.input}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                </div>

                {error && <div style={styles.errorBox}>⚠️ {error}</div>}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ ...styles.btn, opacity: loading ? 0.65 : 1 }}
                >
                    {loading ? '⏳ Please wait...' : mode === 'login' ? '🔐 Login' : '🚀 Create Account'}
                </button>

                <p style={styles.switchText}>
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <span
                        style={styles.switchLink}
                        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    >
                        {mode === 'login' ? 'Register here' : 'Login instead'}
                    </span>
                </p>
            </div>
        </div>
    )
}

const styles = {
    wrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        padding: '20px',
    },
    card: {
        background: '#1e1e2e',
        border: '1px solid #2a2a3e',
        borderRadius: '16px',
        padding: '36px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    },
    tabs: {
        display: 'flex',
        borderBottom: '1px solid #2a2a3e',
        marginBottom: '28px',
    },
    tab: {
        flex: 1,
        padding: '10px 0',
        background: 'none',
        border: 'none',
        borderBottom: '2px solid transparent',
        color: '#666',
        fontSize: '15px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s',
        marginBottom: '-1px',
    },
    activeTab: {
        color: '#fff',
        borderBottom: '2px solid #7c6af7',
    },
    title: {
        color: '#fff',
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: '24px',
        margin: '0 0 24px 0',
    },
    field: {
        marginBottom: '18px',
    },
    label: {
        display: 'block',
        color: '#888',
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '6px',
    },
    input: {
        width: '100%',
        padding: '11px 14px',
        borderRadius: '8px',
        border: '1px solid #333',
        background: '#12121e',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    errorBox: {
        background: 'rgba(255,107,107,0.1)',
        border: '1px solid rgba(255,107,107,0.3)',
        color: '#ff6b6b',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        marginBottom: '16px',
    },
    btn: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #7c6af7, #6451d6)',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '4px',
        transition: 'all 0.2s',
        boxShadow: '0 4px 15px rgba(124,106,247,0.3)',
    },
    switchText: {
        color: '#666',
        fontSize: '13px',
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '0',
    },
    switchLink: {
        color: '#7c6af7',
        cursor: 'pointer',
        fontWeight: '600',
        textDecoration: 'underline',
    },
}