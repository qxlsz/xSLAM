export const RECORD_FPS = 30
export const RECORD_BITRATE = 5_000_000
export const RECORD_MIME = 'video/webm;codecs=vp9'
export const RECORD_BLOB_TYPE = 'video/webm'
export const RECORD_MAX_MS = 30_000

export function recordingOptions(): { mimeType: string; videoBitsPerSecond: number } {
  return {
    mimeType: RECORD_MIME,
    videoBitsPerSecond: RECORD_BITRATE,
  }
}

export function recordingFileName(now: number): string {
  return `slam-visualization-${now}.webm`
}

export function canStartRecording(hasCanvas: boolean): boolean {
  return hasCanvas
}

export function shouldKeepChunk(size: number): boolean {
  return size > 0
}

export function shouldAutoStop(state: string): boolean {
  return state === 'recording'
}

export function canStopRecording(state: string | undefined): boolean {
  return state === 'recording'
}

export function recordButtonLabel(isRecording: boolean): string {
  return isRecording ? 'Recording...' : 'Record'
}

export function recordButtonClass(isRecording: boolean): string {
  return isRecording ? 'record-button recording' : 'record-button'
}
