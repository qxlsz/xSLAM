import { useState, useRef } from 'react'
import './VideoRecorder.css'

export function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const startRecording = async () => {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return
      
      const stream = canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `slam-visualization-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, 30000)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }
  
  return (
    <button
      className={`record-button ${isRecording ? 'recording' : ''}`}
      onClick={isRecording ? stopRecording : startRecording}
    >
      {isRecording ? (
        <>
          <span className="record-dot"></span>
          Recording...
        </>
      ) : (
        'Record'
      )}
    </button>
  )
}
