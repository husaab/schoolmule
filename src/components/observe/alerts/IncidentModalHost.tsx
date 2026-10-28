// src/components/observe/alerts/IncidentModalHost.tsx
'use client'
// The incident modal, mounted once in ObserveShell: it shows whenever the URL
// carries ?incident=<id>, so the Overview banner, the Alerts list, an alert
// email and a push all open the same view (see hooks/useIncidentModal).
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Modal from '@/components/shared/modal'
import { readIncident } from '@/lib/observeAlerts'
import { useIncidentModal } from '@/hooks/useIncidentModal'
import IncidentDetail from './IncidentDetail'

export default function IncidentModalHost() {
  const searchParams = useSearchParams()
  const { close } = useIncidentModal()
  const id = readIncident(searchParams)

  // Keep the last incident on screen while the modal fades out.
  const [shown, setShown] = useState<string | null>(null)
  if (id && id !== shown) setShown(id)
  const view = id ?? shown

  return (
    <Modal
      isOpen={id != null}
      onClose={close}
      closeOnEscape
      fullScreenOnMobile
      ariaLabel="Alert incident"
      style="w-full max-w-3xl h-full sm:h-auto !bg-slate-950 observe-root"
      maxHeightClass="max-h-full sm:max-h-[88vh]"
    >
      {/* The shared modal is white; observe-root keeps it dark like the console. */}
      <div className="px-5 sm:px-7 py-6">
        {view && <IncidentDetail key={view} id={view} onClose={close} />}
      </div>
    </Modal>
  )
}
