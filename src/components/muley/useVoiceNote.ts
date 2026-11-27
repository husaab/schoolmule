'use client'
// Muley's microphone on the web: record with MediaRecorder, then turn the
// recording into text (services/muleyService transcribeAudio). The words go
// into the composer for the person to read and send; nothing is sent by
// itself. Stops on its own after two minutes.

import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '@/services/muleyService'

const MAX_SECONDS = 120

export type VoiceState =
  | { status: 'idle' }
  | { status: 'recording'; seconds: number }
  | { status: 'transcribing' }
  | { status: 'error'; message: string }

/** Whether this browser can record at all (it may still be refused permission). */
export const canRecord = () =>
  typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

// The container the browser records in: Chrome and Firefox take webm/opus, Safari mp4.
const pickType = () => ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported(t)) || ''

export function useVoiceNote(onText: (text: string) => void) {
  const [state, setState] = useState<VoiceState>({ status: 'idle' })
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const cancelled = useRef(false)
  const onTextRef = useRef(onText)
  useEffect(() => {
    onTextRef.current = onText
  })

  const release = () => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }
  useEffect(() => () => {
    cancelled.current = true
    if (recorder.current && recorder.current.state === 'recording') recorder.current.stop()
    release()
  }, [])

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state === 'recording') recorder.current.stop()
  }, [])

  const start = useCallback(async () => {
    if (!canRecord()) return setState({ status: 'error', message: "This browser can't record. Type your message instead." })
    cancelled.current = false
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return setState({ status: 'error', message: 'Muley needs the microphone. Allow it in your browser, or type your message.' })
    }
    const type = pickType()
    const rec = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined)
    chunks.current = []
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.current.push(e.data)
    }
    rec.onstop = async () => {
      release()
      if (cancelled.current) return setState({ status: 'idle' })
      const blob = new Blob(chunks.current, { type: rec.mimeType || type || 'audio/webm' })
      if (blob.size === 0) return setState({ status: 'error', message: 'Nothing was recorded. Try again.' })
      setState({ status: 'transcribing' })
      try {
        const text = await transcribeAudio(blob, rec.mimeType.includes('mp4') ? 'recording.m4a' : 'recording.webm')
        onTextRef.current(text)
        setState({ status: 'idle' })
      } catch (err) {
        setState({ status: 'error', message: err instanceof Error && err.message ? err.message : "Your recording couldn't be turned into text." })
      }
    }
    recorder.current = rec
    rec.start()
    setState({ status: 'recording', seconds: 0 })
    const began = Date.now()
    timer.current = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - began) / 1000)
      if (seconds >= MAX_SECONDS) stop()
      else setState({ status: 'recording', seconds })
    }, 250)
  }, [stop])

  /** Throw the recording away. */
  const cancel = useCallback(() => {
    cancelled.current = true
    stop()
    setState({ status: 'idle' })
  }, [stop])

  const dismiss = useCallback(() => setState({ status: 'idle' }), [])

  return { state, start, stop, cancel, dismiss }
}
