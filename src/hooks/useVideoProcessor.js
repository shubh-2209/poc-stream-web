import { useState, useCallback, useRef } from 'react'
import { uploadVideo, convertVideo, getDownloadUrl } from '../features/videoConvert/videoConvertApi'
export function useVideoProcessor() {
  const [state, setState] = useState({
    stage:          'idle',
    uploadProgress: 0,
    uploadResult:   null,
    convertResult:  null,
    error:          null,
  })
 
  const uploadResultRef = useRef(null)
 
  const upload = useCallback(async (file) => {
    setState(s => ({ ...s, stage: 'uploading', uploadProgress: 0, error: null }))
 
    try {
      const result = await uploadVideo(file, (pct) => {
        setState(s => ({ ...s, uploadProgress: pct }))
      })
      uploadResultRef.current = result
      setState(s => ({ ...s, stage: 'uploaded', uploadResult: result }))
    } catch (err) {
      setState(s => ({ ...s, stage: 'error', error: err.message }))
    }
  }, [])
 
  // Convert — now accepts filters object
  // opts = { outputFormat, quality, resolution, filters }
  const convert = useCallback(async (opts) => {
    const uploaded = uploadResultRef.current
    if (!uploaded) {
      setState(s => ({ ...s, stage: 'error', error: 'No file uploaded yet' }))
      return
    }
 
    setState(s => ({ ...s, stage: 'converting', error: null }))
 
    try {
      const result = await convertVideo({ ...opts, fileName: uploaded.fileName })
      setState(s => ({ ...s, stage: 'done', convertResult: result }))
    } catch (err) {
      setState(s => ({ ...s, stage: 'error', error: err.message }))
    }
  }, [])
 
  const reset = useCallback(() => {
    uploadResultRef.current = null
    setState({
      stage:          'idle',
      uploadProgress: 0,
      uploadResult:   null,
      convertResult:  null,
      error:          null,
    })
  }, [])
 
  const downloadUrl = state.convertResult
    ? getDownloadUrl(state.convertResult.convertedFile, 'converted')
    : null
 
  return { state, upload, convert, reset, downloadUrl }
}