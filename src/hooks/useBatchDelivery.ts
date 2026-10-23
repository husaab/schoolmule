// src/hooks/useBatchDelivery.ts
//
// One publish's parent emails, followed while any are still queued (they go
// out from the server's queue shortly after Publish), with Retry for the ones
// that didn't send. Remount (key) for another batch.
'use client'

import { useCallback } from 'react'
import { getBatchDelivery, retryBatchEmails } from '@/services/assessmentPublicationService'
import { useDeliveryPolling } from '@/hooks/useDeliveryPolling'

export function useBatchDelivery(classId: string, batchId: string | null) {
  const load = useCallback((id: string) => getBatchDelivery(classId, id), [classId])
  const retry = useCallback((id: string) => retryBatchEmails(classId, id), [classId])
  return useDeliveryPolling(batchId, load, retry)
}
