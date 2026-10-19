// src/components/auth/QrCardScanner.tsx
// The camera view that reads a student's QR sign-in card in the app (final
// review I2): the card's secret goes straight from the camera to the sign-in
// request, never into an address or the browser's history.
//
// It opens the back camera, and every ~200 ms reads one frame: with the
// browser's own BarcodeDetector where there is one (Chrome, Android), else
// with jsQR (Safari and iPad have no BarcodeDetector; jsQR is loaded only
// then, and also when a detector keeps failing). If jsQR can't be loaded
// (flaky classroom wifi), the camera stops and the page says so instead of
// showing a camera that reads nothing (fallbackReader, FE re-review N3).
// The first SchoolMule card it sees is handed to `onToken` and the camera
// stops; any other QR code gets a short "That isn't a sign-in card". It
// pauses while the tab is hidden and always releases the camera when it goes
// away.
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  QR_NOT_A_CARD,
  QR_READER_UNAVAILABLE,
  QrReaderLoadError,
  cameraProblem,
  fallbackReader,
  parseCardPayload,
  type FrameReader,
} from '@/lib/qrSignIn'

interface QrCardScannerProps {
  /** A card was read. The camera has already stopped. */
  onToken: (token: string) => void
  /** The camera could not start, or the card reader could not load (the words to show). */
  onCameraError: (message: string) => void
}

// The bits of the Barcode Detection API used here (not in TypeScript's DOM types yet).
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}
interface BarcodeDetectorClass {
  new (options: { formats: string[] }): BarcodeDetectorLike
  getSupportedFormats?: () => Promise<string[]>
}

type Reader = FrameReader<HTMLVideoElement>

const SCAN_EVERY_MS = 200
// jsQR reads a frame this wide at most: plenty for a card held up to the camera, and quick on an old iPad.
const JSQR_WIDTH = 640

async function nativeReader(): Promise<Reader | null> {
  const Detector = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector
  if (!Detector) return null
  try {
    const formats = (await Detector.getSupportedFormats?.()) ?? ['qr_code']
    if (!formats.includes('qr_code')) return null
    const detector = new Detector({ formats: ['qr_code'] })
    return async (video) => {
      const found = await detector.detect(video)
      return found[0]?.rawValue ?? null
    }
  } catch {
    return null
  }
}

async function jsqrReader(): Promise<Reader> {
  const { default: jsQR } = await import('jsqr')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  return async (video) => {
    if (!ctx || !video.videoWidth || !video.videoHeight) return null
    const scale = Math.min(1, JSQR_WIDTH / video.videoWidth)
    const width = Math.round(video.videoWidth * scale)
    const height = Math.round(video.videoHeight * scale)
    canvas.width = width
    canvas.height = height
    ctx.drawImage(video, 0, 0, width, height)
    const frame = ctx.getImageData(0, 0, width, height)
    return jsQR(frame.data, width, height, { inversionAttempts: 'dontInvert' })?.data ?? null
  }
}

export default function QrCardScanner({ onToken, onCameraError }: QrCardScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [starting, setStarting] = useState(true)
  const [hint, setHint] = useState<string | null>(null)
  // The latest callbacks, so the camera effect runs once.
  const onTokenRef = useRef(onToken)
  const onErrorRef = useRef(onCameraError)
  useEffect(() => {
    onTokenRef.current = onToken
    onErrorRef.current = onCameraError
  })

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let hintTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const stop = () => {
      stopped = true
      if (timer) clearTimeout(timer)
      if (hintTimer) clearTimeout(hintTimer)
      stream?.getTracks().forEach((t) => t.stop())
      stream = null
    }

    const start = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        onErrorRef.current(cameraProblem({ name: 'NoCameraApi' }))
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
      } catch (err) {
        if (!stopped) onErrorRef.current(cameraProblem(err))
        return
      }
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      try {
        await video.play()
      } catch {
        // Autoplay of a muted, inline video is allowed everywhere we run; a refusal still shows the first frame.
      }
      setStarting(false)

      // The camera is no use without a reader: a failed load stops it and says why.
      const unavailable = () => {
        if (stopped) return
        stop()
        onErrorRef.current(QR_READER_UNAVAILABLE)
      }
      const reader = fallbackReader<HTMLVideoElement>({ primary: await nativeReader(), loadFallback: jsqrReader })
      try {
        await reader.ready()
      } catch {
        unavailable()
        return
      }
      const tick = async () => {
        if (stopped) return
        if (document.visibilityState === 'visible' && video.readyState >= 2) {
          let text: string | null = null
          try {
            text = await reader.read(video)
          } catch (err) {
            if (err instanceof QrReaderLoadError) {
              unavailable()
              return
            }
            text = null
          }
          if (stopped) return
          if (text) {
            const token = parseCardPayload(text)
            if (token) {
              stop()
              onTokenRef.current(token)
              return
            }
            setHint(QR_NOT_A_CARD)
            if (hintTimer) clearTimeout(hintTimer)
            hintTimer = setTimeout(() => setHint(null), 3000)
          }
        }
        timer = setTimeout(() => void tick(), SCAN_EVERY_MS)
      }
      void tick()
    }

    void start()
    return stop
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl bg-slate-900">
        <video ref={videoRef} muted playsInline autoPlay className="h-full w-full object-cover" aria-label="Camera" />
        {/* The frame to hold the card's code in. */}
        <span className="pointer-events-none absolute inset-[18%] rounded-2xl border-4 border-white/85 shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" aria-hidden="true" />
        {starting && (
          <span role="status" className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-medium text-white">
            Starting the camera… If your browser asks, allow the camera.
          </span>
        )}
      </div>
      <p aria-live="polite" className={`min-h-[40px] text-center text-sm ${hint ? 'font-medium text-rose-700' : 'text-slate-600'}`}>
        {hint ?? 'Hold the code on your card inside the square.'}
      </p>
    </div>
  )
}
