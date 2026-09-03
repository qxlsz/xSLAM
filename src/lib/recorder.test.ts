import { describe, expect, it } from 'vitest'
import {
  RECORD_BITRATE,
  RECORD_BLOB_TYPE,
  RECORD_FPS,
  RECORD_MAX_MS,
  RECORD_MIME,
  canStartRecording,
  canStopRecording,
  recordButtonClass,
  recordButtonLabel,
  recordingFileName,
  recordingOptions,
  shouldAutoStop,
  shouldKeepChunk,
} from './recorder'

describe('recording options', () => {
  it('matches the WebM capture settings used by the recorder button', () => {
    expect(RECORD_FPS).toBe(30)
    expect(RECORD_MAX_MS).toBe(30_000)
    expect(RECORD_BLOB_TYPE).toBe('video/webm')
    expect(recordingOptions()).toEqual({
      mimeType: RECORD_MIME,
      videoBitsPerSecond: RECORD_BITRATE,
    })
  })

  it('names downloads with the capture timestamp', () => {
    expect(recordingFileName(1_700_000_000_000)).toBe('slam-visualization-1700000000000.webm')
  })
})

describe('recording state machine', () => {
  it('refuses to start without a canvas', () => {
    expect(canStartRecording(false)).toBe(false)
    expect(canStartRecording(true)).toBe(true)
  })

  it('keeps only non-empty chunks', () => {
    expect(shouldKeepChunk(0)).toBe(false)
    expect(shouldKeepChunk(12)).toBe(true)
  })

  it('auto-stops and user-stops only while the recorder is live', () => {
    expect(shouldAutoStop('recording')).toBe(true)
    expect(shouldAutoStop('inactive')).toBe(false)
    expect(canStopRecording('recording')).toBe(true)
    expect(canStopRecording('inactive')).toBe(false)
    expect(canStopRecording(undefined)).toBe(false)
  })
})

describe('record button copy', () => {
  it('toggles label and class with recording state', () => {
    expect(recordButtonLabel(false)).toBe('Record')
    expect(recordButtonLabel(true)).toBe('Recording...')
    expect(recordButtonClass(false)).toBe('record-button')
    expect(recordButtonClass(true)).toBe('record-button recording')
  })
})
