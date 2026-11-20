// src/components/settings/SignatureCard.tsx
// Settings → My signature (staff). Saved once, it prints on every JK/SK
// progress report and report card where this person is the teacher or the
// teacher assistant. Draw it, upload a photo or scan of it, replace it or
// remove it. Reports pick up a change when they are generated again.
'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpTrayIcon, PencilIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import SignaturePad from './SignaturePad'
import { hasEnoughInk, toDrawing, undoStroke, type Stroke } from '@/lib/signatureStrokes'
import { deleteSignature, getSignature, saveDrawnSignature, uploadSignature } from '@/services/signatureService'
import { useNotificationStore } from '@/store/useNotificationStore'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

export default function SignatureCard() {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [url, setUrl] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [drawOpen, setDrawOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [padSize, setPadSize] = useState({ width: 600, height: 200 })
  const fileInput = useRef<HTMLInputElement>(null)

  const load = async () => {
    setState('loading')
    try {
      const res = await getSignature()
      setUrl(res.data.signatureUrl)
      setState('ready')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openPad = () => {
    setStrokes([])
    setDrawOpen(true)
  }

  const saveDrawing = async () => {
    const drawing = toDrawing(strokes, padSize.width, padSize.height)
    if (!drawing) return
    setBusy(true)
    try {
      const res = await saveDrawnSignature(drawing)
      setUrl(res.data.signatureUrl)
      setDrawOpen(false)
      showNotification('Signature saved', 'success')
    } catch (err) {
      showNotification(errorText(err, "Your signature couldn't be saved"), 'error')
    } finally {
      setBusy(false)
    }
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      showNotification('The image must be 8 MB or smaller', 'error')
      return
    }
    setBusy(true)
    setUploading(true)
    try {
      const res = await uploadSignature(file, file.name)
      setUrl(res.data.signatureUrl)
      showNotification('Signature saved', 'success')
    } catch (err) {
      showNotification(errorText(err, "Your signature couldn't be saved"), 'error')
    } finally {
      setBusy(false)
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteSignature()
      setUrl(null)
      setRemoveOpen(false)
      showNotification('Signature removed', 'success')
    } catch (err) {
      showNotification(errorText(err, "Your signature couldn't be removed"), 'error')
    } finally {
      setBusy(false)
    }
  }

  const secondary =
    'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <PencilSquareIcon className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-900">My signature</h3>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Save your signature once. It prints on every JK and SK progress report and report card where you are the teacher or the
        teacher assistant. Generate a report again to pick up a change.
      </p>

      {state === 'loading' && <div className="h-24 max-w-sm rounded-xl bg-slate-100 animate-pulse" aria-label="Loading your signature" />}
      {state === 'error' && (
        <p className="text-sm text-rose-600">
          Could not load your signature.{' '}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Try again
          </button>
        </p>
      )}
      {state === 'ready' && (
        <>
          {url ? (
            <div className="mb-4 flex h-24 max-w-sm items-center justify-center rounded-xl border border-slate-200 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a short-lived signed URL */}
              <img src={url} alt="Your saved signature" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <p className="mb-4 text-sm text-slate-500">No signature saved yet. The signature boxes print blank, to be signed by hand.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openPad} disabled={busy} className={secondary}>
              <PencilIcon className="h-4 w-4 text-slate-400" />
              {url ? 'Draw again' : 'Draw signature'}
            </button>
            <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className={secondary}>
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" aria-hidden />
              ) : (
                <ArrowUpTrayIcon className="h-4 w-4 text-slate-400" />
              )}
              Upload image
            </button>
            {url && (
              <button
                type="button"
                onClick={() => setRemoveOpen(true)}
                disabled={busy}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">Uploading? Sign in dark ink on plain white paper and take the photo close up.</p>
        </>
      )}

      <Modal isOpen={drawOpen} onClose={() => !busy && setDrawOpen(false)} size="2xl" fullScreenOnMobile>
        <ModalHeader title="Draw your signature" subtitle="Use your mouse, a finger or a pen." icon={PencilIcon} />
        <ModalBody>
          <SignaturePad
            strokes={strokes}
            onChange={(next, size) => {
              setStrokes(next)
              setPadSize(size)
            }}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStrokes((s) => undoStroke(s))} disabled={busy || strokes.length === 0}>
              Undo
            </Button>
            <Button variant="secondary" onClick={() => setStrokes([])} disabled={busy || strokes.length === 0}>
              Clear
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDrawOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void saveDrawing()} loading={busy} disabled={!hasEnoughInk(strokes, padSize.width)}>
            Save signature
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={removeOpen} onClose={() => !busy && setRemoveOpen(false)}>
        <ModalHeader title="Remove your signature?" tone="danger" icon={TrashIcon} />
        <ModalBody>
          <ConfirmBody>
            Reports generated from now on leave your signature box blank, to be signed by hand. You can save a signature again any time.
          </ConfirmBody>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRemoveOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void remove()} loading={busy}>
            Remove signature
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
