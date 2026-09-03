import { useState, useRef } from 'react'
import {
  RECORD_FPS,
  RECORD_MAX_MS,
  canStartRecording,
  canStopRecording,
  recordButtonClass,
  recordButtonLabel,
  recordingFileName,
  recordingOptions,
  shouldAutoStop,
  shouldKeepChunk,
} from '../lib/recorder'
import './VideoRecorder.css'

export function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const startRecording = async () => {
    try {
      const canvas = document.querySelector('canvas')
      if (!canStartRecording(canvas instanceof HTMLCanvasElement) || !canvas) return
      
      const stream = canvas.captureStream(RECORD_FPS)
      const mediaRecorder = new MediaRecorder(stream, recordingOptions())
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (shouldKeepChunk(event.data.size)) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = recordingFileName(Date.now())
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (shouldAutoStop(mediaRecorderRef.current?.state ?? '')) {
          stopRecording()
        }
      }, RECORD_MAX_MS)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }
  
  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && canStopRecording(recorder.state)) {
      recorder.stop()
      setIsRecording(false)
    }
  }
  
  return (
    <button
      className={recordButtonClass(isRecording)}
      onClick={isRecording ? stopRecording : startRecording}
    >
      {isRecording ? (
        <>
          <span className="record-dot"></span>
          {recordButtonLabel(true)}
        </>
      ) : (
        recordButtonLabel(false)
      )}
    </button>
  )
}
