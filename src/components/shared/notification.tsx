'use client'

import { useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '@/store/useNotificationStore'

const Notification: React.FC = () => {
  const { message, type, isOpen, closeNotification } = useNotificationStore()

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        closeNotification()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, closeNotification])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-6 right-6 z-[100] max-w-sm w-full"
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div
            className={`
              relative overflow-hidden rounded-xl shadow-2xl backdrop-blur-sm
              ${type === 'success'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-red-500 to-rose-500'
              }
            `}
          >
            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
            />

            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${type === 'success' ? 'bg-white/20' : 'bg-white/20'}
              `}>
                {type === 'success' ? (
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-semibold text-white">
                  {type === 'success' ? 'Success' : 'Error'}
                </p>
                <p className="text-sm text-white/90 mt-0.5">
                  {message}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={closeNotification}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Notification
