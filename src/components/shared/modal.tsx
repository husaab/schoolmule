'use client'
import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'

interface ModalProps {
  style?: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
  /** Escape closes this modal, but only while it is the top-most one open. */
  closeOnEscape?: boolean
  /** Replaces the default max-h-[85vh] cap on the box. */
  maxHeightClass?: string
  /** Edge to edge below the sm breakpoint (no outer padding, square corners). */
  fullScreenOnMobile?: boolean
  /** Accessible name when the modal has no title. */
  ariaLabel?: string
  /** Replaces the default dimmed blur behind the box. */
  backdropClass?: string
  /** For a body that has its own close button. */
  hideClose?: boolean
  /** Keys other than Escape, while this modal is the top-most one open. */
  onKeyDown?: (e: KeyboardEvent) => void
}

// Modals can stack (a confirm opened from a larger modal). Track the open
// ones so Escape only ever reaches the top one, and keep the page behind
// scroll-locked until the last of them closes.
const openModals: string[] = []
let scrollLocks = 0
let overflowBeforeLock = ''

const lockBodyScroll = () => {
  if (scrollLocks++ === 0) {
    overflowBeforeLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

const unlockBodyScroll = () => {
  if (scrollLocks > 0 && --scrollLocks === 0) document.body.style.overflow = overflowBeforeLock
}

const Modal = ({
  isOpen,
  onClose,
  children,
  style,
  title,
  size = 'md',
  closeOnEscape = false,
  maxHeightClass = 'max-h-[85vh]',
  fullScreenOnMobile = false,
  ariaLabel,
  backdropClass = 'bg-slate-900/50 backdrop-blur-sm',
  hideClose = false,
  onKeyDown,
}: ModalProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const id = useId()
  // The keydown listener outlives renders; read the latest props through refs.
  const latest = useRef({ onClose, closeOnEscape, onKeyDown })
  useEffect(() => {
    latest.current = { onClose, closeOnEscape, onKeyDown }
  })

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    // Wide enough for the import preview table, which needs name, grade,
    // match, action and reason side by side.
    '4xl': 'max-w-5xl'
  }

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Trigger animation after render
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => setShouldRender(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // While open: hold a scroll lock and a place on the stack.
  useEffect(() => {
    if (!isOpen) return
    openModals.push(id)
    lockBodyScroll()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || openModals[openModals.length - 1] !== id) return
      if (e.key !== 'Escape') {
        latest.current.onKeyDown?.(e)
      } else if (latest.current.closeOnEscape) {
        e.preventDefault()
        latest.current.onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const at = openModals.lastIndexOf(id)
      if (at !== -1) openModals.splice(at, 1)
      unlockBodyScroll()
    }
  }, [isOpen, id])

  if (!shouldRender) return null

  const modalContent = (
    <div className={`fixed inset-0 flex items-center justify-center z-[60] ${fullScreenOnMobile ? 'p-0 sm:p-4' : 'p-4'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${backdropClass} transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal box */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className={`
          relative z-10
          bg-white shadow-2xl
          ${fullScreenOnMobile ? 'rounded-none sm:rounded-2xl' : 'rounded-2xl'}
          overflow-hidden ${maxHeightClass} flex flex-col
          transition-all duration-200 ease-out
          ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
          ${style ? style : `w-full ${sizeClasses[size]}`}
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Close button (when no title). z-20 keeps it above a sticky
            ModalHeader (z-10), which otherwise paints over it. */}
        {!title && !hideClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer z-20"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default Modal
