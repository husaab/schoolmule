// src/components/media/useMediaViewer.tsx
// How a surface opens the viewer: hand `open` all of its files and the one that
// was pressed, and render `viewer` anywhere in the component.
'use client'

import { useCallback, useState } from 'react'
import { viewerItems, viewerKind, type ViewerFile, type ViewerItem } from '@/lib/mediaViewer'
import MediaViewer from './MediaViewer'

/** Whether a file opens in the viewer. What doesn't (a Word document) keeps its own way of opening. */
export const canView = (file: Pick<ViewerFile, 'name' | 'mimeType' | 'fileName'>): boolean => viewerKind(file) !== null

export function useMediaViewer() {
  const [shown, setShown] = useState<{ items: ViewerItem[]; startId: string; onClosed?: () => void } | null>(null)

  const open = useCallback((files: ViewerFile[], startId: string, onClosed?: () => void) => {
    const items = viewerItems(files)
    if (items.length > 0) setShown({ items, startId, onClosed })
  }, [])

  const viewer = shown && (
    <MediaViewer
      items={shown.items}
      startId={shown.startId}
      onClose={() => {
        shown.onClosed?.()
        setShown(null)
      }}
    />
  )

  return { open, viewer }
}
