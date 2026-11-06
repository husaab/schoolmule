// src/components/media/MediaViewer.tsx
// The one place a pressed picture or PDF opens, instead of a new tab on the raw
// storage link: dark, edge to edge, with previous and next through every file
// the surface handed over, "2 of 5", zoom, rotate and download. It is a shared
// Modal, so opened from inside another (a student's profile) it sits on top and
// Escape and the arrow keys reach only it. On a computer a PDF is the browser's
// own frame, which has its own zoom, rotate and search; on a phone it is drawn
// by PdfPages and the viewer's tools work on it. Files are opened with
// useMediaViewer, and the list is fixed when it opens, so a thread refreshing
// behind it can't move what is being looked at.
'use client'

import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import Spinner from '@/components/Spinner'
import { counterLabel, downloadUrl, stepIndex, type ViewerItem } from '@/lib/mediaViewer'
import { fitSize, turnedSize, type Size } from '@/lib/zoomMath'
import PdfPages from './PdfPages'
import { useZoomPan } from './useZoomPan'

const TOOL =
  'inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white'
const ZOOM_STEP = 1.5
const MAX_PDF_ZOOM = 3

type Loaded = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'error' }

/**
 * The address to show. A link already at hand is used until it fails, then a
 * fresh one is asked for, once. A PDF is always asked for fresh when it can be:
 * a browser's frame can't say a link has died, it just shows the error page.
 */
function useItemUrl(item: ViewerItem) {
  const known = useRef(new Map<string, string>())
  const refreshed = useRef(new Set<string>())
  const [state, setState] = useState<{ id: string; loaded: Loaded } | null>(null)

  const load = (target: ViewerItem) => {
    if (!target.resolve) {
      setState({ id: target.id, loaded: { status: 'error' } })
      return
    }
    setState({ id: target.id, loaded: { status: 'loading' } })
    target.resolve().then(
      (url) => {
        known.current.set(target.id, url)
        setState((s) => (s?.id === target.id ? { id: target.id, loaded: { status: 'ready', url } } : s))
      },
      () => setState((s) => (s?.id === target.id ? { id: target.id, loaded: { status: 'error' } } : s)),
    )
  }

  const atHand = known.current.get(item.id) ?? (item.kind === 'pdf' && item.resolve ? null : item.url) ?? null
  const needsAsking = !atHand && state?.id !== item.id
  useEffect(() => {
    if (needsAsking) load(item)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per file; load only reads refs and the item
  }, [item.id, needsAsking])

  const loaded: Loaded = state?.id === item.id ? state.loaded : atHand ? { status: 'ready', url: atHand } : { status: 'loading' }

  return {
    loaded,
    /** The file wouldn't load from this address. */
    onBroken: () => {
      known.current.delete(item.id)
      if (item.resolve && !refreshed.current.has(item.id)) {
        refreshed.current.add(item.id)
        load(item)
      } else {
        setState({ id: item.id, loaded: { status: 'error' } })
      }
    },
    retry: () => load(item),
  }
}

function useElementSize(ref: MutableRefObject<HTMLElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return size
}

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={TOOL}>
      {children}
    </button>
  )
}

function StepButton({ direction, disabled, onClick }: { direction: 1 | -1; disabled: boolean; onClick: () => void }) {
  const Icon = direction === 1 ? ChevronRightIcon : ChevronLeftIcon
  const label = direction === 1 ? 'Next' : 'Previous'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-slate-900/70 text-white ring-1 ring-white/15 transition-colors hover:bg-slate-800 disabled:cursor-default disabled:opacity-30 sm:h-12 sm:w-12 ${
        direction === 1 ? 'right-2 sm:right-4' : 'left-2 sm:left-4'
      }`}
    >
      <Icon className="h-6 w-6" aria-hidden="true" />
    </button>
  )
}

interface MediaViewerProps {
  /** Never empty. */
  items: ViewerItem[]
  startId: string
  onClose: () => void
}

function ViewerBody({ items, startId, onClose, keyHandlerRef }: MediaViewerProps & { keyHandlerRef: MutableRefObject<((e: KeyboardEvent) => void) | null> }) {
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((i) => i.id === startId)))
  const [cameFrom, setCameFrom] = useState<1 | -1 | 0>(0)
  const [turnsById, setTurnsById] = useState<Record<string, number>>({})
  const [naturalById, setNaturalById] = useState<Record<string, Size>>({})
  const [pdfZoom, setPdfZoom] = useState(1)
  const [finePointer] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const stage = useElementSize(stageRef)

  const item = items[index]
  const turns = turnsById[item.id] ?? 0
  const isImage = item.kind === 'image'
  // A computer's PDF frame has its own zoom and rotate; ours would do nothing to it.
  const ownTools = isImage || !finePointer
  const { loaded, onBroken, retry } = useItemUrl(item)
  const url = loaded.status === 'ready' ? loaded.url : null

  const natural = naturalById[item.id]
  const box = natural && stage ? fitSize(natural, stage, turns) : null
  const content = box ? turnedSize(box, turns) : null

  const go = (direction: 1 | -1) => {
    const next = stepIndex(index, direction, items.length)
    if (next === index) return
    setCameFrom(direction)
    setIndex(next)
    setPdfZoom(1)
  }

  const zoom = useZoomPan({
    stageRef,
    stage,
    content,
    enabled: isImage,
    resetKey: `${item.id}:${turns}`,
    onSwipe: go,
    onTapOutside: onClose,
  })

  const zoomIn = () => (isImage ? zoom.zoomBy(ZOOM_STEP) : setPdfZoom((z) => Math.min(MAX_PDF_ZOOM, z * ZOOM_STEP)))
  const zoomOut = () => (isImage ? zoom.zoomBy(1 / ZOOM_STEP) : setPdfZoom((z) => Math.max(1, z / ZOOM_STEP)))
  const rotate = () => setTurnsById((all) => ({ ...all, [item.id]: turns + 1 }))

  useEffect(() => {
    keyHandlerRef.current = (e) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (ownTools && (e.key === '+' || e.key === '=')) zoomIn()
      else if (ownTools && e.key === '-') zoomOut()
      else return
      e.preventDefault()
    }
  })

  // Into the viewer on opening, back to what was pressed on closing.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus({ preventScroll: true })
    return () => opener?.focus({ preventScroll: true })
  }, [])

  // The next picture along is usually already a thumbnail in the page, so this costs little.
  useEffect(() => {
    for (const near of [items[index - 1], items[index + 1]]) {
      if (near?.kind === 'image' && near.url) new Image().src = near.url
    }
  }, [items, index])

  const offset = (() => {
    const pastEnd = (zoom.swipeX > 0 && index === 0) || (zoom.swipeX < 0 && index === items.length - 1)
    return pastEnd ? zoom.swipeX / 3 : zoom.swipeX
  })()

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full flex-col text-white">
        <header className="flex shrink-0 items-center gap-1 px-3 py-2 sm:px-4">
          <div className="mr-auto min-w-0 flex-1 pr-2" aria-live="polite">
            {items.length > 1 && <p className="text-xs text-white/60">{counterLabel(index, items.length)}</p>}
            <p className="truncate text-sm font-medium">{item.name}</p>
          </div>
          {/* On touch a picture pinches; PDF pages don't, so they keep the buttons. */}
          {ownTools && (!isImage || finePointer) && (
            <>
              <Tool label="Zoom out" onClick={zoomOut}>
                <MagnifyingGlassMinusIcon className="h-5 w-5" aria-hidden="true" />
              </Tool>
              <Tool label="Zoom in" onClick={zoomIn}>
                <MagnifyingGlassPlusIcon className="h-5 w-5" aria-hidden="true" />
              </Tool>
            </>
          )}
          {ownTools && (
            <Tool label="Rotate" onClick={rotate}>
              <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
            </Tool>
          )}
          {url && (
            <a href={downloadUrl(url, item.fileName ?? item.name)} download={item.fileName ?? item.name} aria-label="Download" title="Download" className={TOOL}>
              <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
          <button ref={closeRef} type="button" aria-label="Close" title="Close" onClick={onClose} className={TOOL}>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
          <div
            ref={stageRef}
            {...(isImage ? zoom.handlers : {})}
            className={`absolute inset-0 select-none overflow-hidden ${isImage ? 'touch-none' : ''} ${
              !isImage ? '' : zoom.gesturing && zoom.view.scale > 1 ? 'cursor-grabbing' : zoom.view.scale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
          >
            {loaded.status === 'loading' && (
              <div className="flex h-full items-center justify-center">
                <Spinner size="lg" />
              </div>
            )}

            {loaded.status === 'error' && (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
                <p className="text-sm text-white/80">
                  {item.resolve ? "This file couldn't be opened." : 'The link to this file has expired. Close this and reload the page to see it.'}
                </p>
                {item.resolve && (
                  <button
                    type="button"
                    onClick={retry}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="cursor-pointer rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}

            {url && isImage && (
              <motion.div
                key={item.id}
                initial={cameFrom ? { x: cameFrom * 48, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                {!box && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner size="lg" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived storage URL */}
                <img
                  key={url}
                  src={url}
                  alt={item.name}
                  draggable={false}
                  onLoad={(e) => {
                    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
                    setNaturalById((all) => ({ ...all, [item.id]: { width, height } }))
                  }}
                  onError={onBroken}
                  className="max-w-none shrink-0"
                  style={
                    box
                      ? {
                          width: box.width,
                          height: box.height,
                          transform: `translate(${zoom.view.x + offset}px, ${zoom.view.y}px) scale(${zoom.view.scale}) rotate(${turns * 90}deg)`,
                          transition: zoom.gesturing ? 'none' : 'transform 160ms ease-out, width 160ms ease-out, height 160ms ease-out',
                        }
                      : { position: 'absolute', opacity: 0 }
                  }
                />
              </motion.div>
            )}

            {url && !isImage &&
              (finePointer ? (
                <iframe key={url} src={url} title={item.name} className="mx-auto h-full w-full bg-white sm:w-[calc(100%-9rem)]" />
              ) : (
                <PdfPages key={url} url={url} quarterTurns={turns} zoom={pdfZoom} onBroken={onBroken} onSwipe={go} />
              ))}
          </div>

          {items.length > 1 && (
            <>
              <StepButton direction={-1} disabled={index === 0} onClick={() => go(-1)} />
              <StepButton direction={1} disabled={index === items.length - 1} onClick={() => go(1)} />
            </>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}

export default function MediaViewer(props: MediaViewerProps) {
  // The Modal holds the key listener and knows who is on top; what the keys do lives in the body it mounts.
  const keyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null)
  return (
    <Modal
      isOpen
      bare
      closeOnEscape
      onClose={props.onClose}
      onKeyDown={(e) => keyHandlerRef.current?.(e)}
      ariaLabel="File viewer"
      style="h-full w-full"
      maxHeightClass="max-h-full"
    >
      <ViewerBody {...props} keyHandlerRef={keyHandlerRef} />
    </Modal>
  )
}
