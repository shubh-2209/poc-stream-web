import React, { useState } from 'react'

const API_BASE = 'http://localhost:3333'

export default function VideoUpload({ token, onUploadComplete }) {
    const [file, setFile] = useState(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('')
    const [statusType, setStatusType] = useState('info') // 'info' | 'error' | 'success'
    const [progress, setProgress] = useState(0)
    const [uploading, setUploading] = useState(false)

    const setMsg = (msg, type = 'info') => {
        setStatus(msg)
        setStatusType(type)
    }

    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (selected) {
            setFile(selected)
            setMsg(`Selected: ${selected.name} (${(selected.size / 1024 / 1024).toFixed(1)} MB)`)
        }
    }

    const handleUpload = async () => {
        if (!file) return setMsg('Please select a video file', 'error')
        if (!title.trim()) return setMsg('Please enter a title', 'error')
        if (!token) return setMsg('Not authenticated', 'error')

        setUploading(true)
        setProgress(0)

        try {
            // ── STEP 1: Get signed upload params from backend ──────────────────
            setMsg('⏳ Getting upload credentials...')

            const signRes = await fetch(`${API_BASE}/api/cloudinary/sign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ folder: 'reels' }),
            })

            const signText = await signRes.text()
            let signData
            try {
                signData = JSON.parse(signText)
            } catch {
                throw new Error('Backend returned invalid response for /api/cloudinary/sign')
            }

            if (!signRes.ok) {
                throw new Error(signData.message || 'Failed to get upload credentials')
            }

            const { signature, timestamp, api_key, cloud_name, upload_url } = signData

            // ── STEP 2: Upload directly to Cloudinary from browser ─────────────
            setMsg('⬆️ Uploading video to Cloudinary...')

            const formData = new FormData()
            formData.append('file', file)
            formData.append('signature', signature)
            formData.append('timestamp', String(timestamp))
            formData.append('api_key', api_key)
            formData.append('folder', 'reels')

            const cloudRes = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 100)
                        setProgress(pct)
                    }
                }

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText))
                        } catch {
                            reject(new Error('Cloudinary returned invalid JSON'))
                        }
                    } else {
                        reject(new Error(`Cloudinary upload failed: ${xhr.status}`))
                    }
                }

                xhr.onerror = () => reject(new Error('Network error during upload'))
                xhr.open('POST', upload_url)
                xhr.send(formData)
            })

            // ── STEP 3: Notify backend to save metadata ────────────────────────
            setMsg('💾 Saving video metadata...')
            setProgress(100)

            const metaRes = await fetch(`${API_BASE}/api/videos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    cloudinary_url: cloudRes.secure_url,
                    public_id: cloudRes.public_id,
                    duration: cloudRes.duration || 0,
                    format: cloudRes.format || 'mp4',
                }),
            })

            const metaText = await metaRes.text()
            let metaData
            try {
                metaData = JSON.parse(metaText)
            } catch {
                throw new Error('Backend returned invalid response for /api/videos')
            }

            if (!metaRes.ok) {
                throw new Error(metaData.message || 'Failed to save video metadata')
            }

            // ── SUCCESS ────────────────────────────────────────────────────────
            setMsg('✅ Video uploaded successfully!', 'success')
            setTitle('')
            setDescription('')
            setFile(null)
            setProgress(0)

            onUploadComplete?.(metaData.video)
        } catch (err) {
            console.error('Upload error:', err)
            setMsg(`❌ ${err.message}`, 'error')
            setProgress(0)
        } finally {
            setUploading(false)
        }
    }

    const statusColors = {
        info: '#aaa',
        error: '#ff6b6b',
        success: '#4ade80',
    }

    return (
        <div style={styles.card}>
            <h3 style={styles.heading}>📤 Upload Reel</h3>

            <div style={styles.field}>
                <label style={styles.label}>Title *</label>
                <input
                    type="text"
                    placeholder="Give your reel a title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={uploading}
                    style={styles.input}
                />
            </div>

            <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea
                    placeholder="Describe your reel..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={uploading}
                    rows={3}
                    style={{ ...styles.input, resize: 'vertical' }}
                />
            </div>

            <div style={styles.field}>
                <label style={styles.label}>Video File *</label>
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    style={styles.fileInput}
                />
            </div>

            {progress > 0 && (
                <div style={styles.progressWrap}>
                    <div style={{ ...styles.progressBar, width: `${progress}%` }} />
                    <span style={styles.progressText}>{progress}%</span>
                </div>
            )}

            {status && (
                <p style={{ ...styles.statusMsg, color: statusColors[statusType] }}>{status}</p>
            )}

            <button
                onClick={handleUpload}
                disabled={uploading || !file || !title.trim()}
                style={{
                    ...styles.btn,
                    opacity: uploading || !file || !title.trim() ? 0.5 : 1,
                    cursor: uploading || !file || !title.trim() ? 'not-allowed' : 'pointer',
                }}
            >
                {uploading ? '⏳ Uploading...' : '🚀 Upload Reel'}
            </button>
        </div>
    )
}

const styles = {
    card: {
        background: '#1e1e2e',
        border: '1px solid #2a2a3e',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '32px',
    },
    heading: {
        color: '#fff',
        fontSize: '18px',
        fontWeight: '700',
        margin: '0 0 24px 0',
    },
    field: {
        marginBottom: '16px',
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
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid #333',
        background: '#12121e',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
    },
    fileInput: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px dashed #444',
        background: '#12121e',
        color: '#aaa',
        fontSize: '13px',
        cursor: 'pointer',
        boxSizing: 'border-box',
    },
    progressWrap: {
        height: '8px',
        background: '#2a2a3e',
        borderRadius: '4px',
        marginBottom: '12px',
        overflow: 'hidden',
        position: 'relative',
    },
    progressBar: {
        height: '100%',
        background: 'linear-gradient(90deg, #7c6af7, #4ade80)',
        borderRadius: '4px',
        transition: 'width 0.3s ease',
    },
    progressText: {
        position: 'absolute',
        right: '0',
        top: '-18px',
        fontSize: '12px',
        color: '#aaa',
    },
    statusMsg: {
        fontSize: '13px',
        margin: '0 0 12px 0',
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
        boxShadow: '0 4px 15px rgba(124,106,247,0.3)',
        transition: 'all 0.2s',
    },
}