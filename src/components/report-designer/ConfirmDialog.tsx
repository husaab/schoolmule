'use client';

/** The app's confirmation modal for the report designer's destructive actions. */
import { useState } from 'react';
import Modal from '@/components/shared/modal';
import { Button, ConfirmBody } from '@/components/shared/modalKit';

export interface ConfirmRequest {
  title: string;
  message: React.ReactNode;
  consequences?: string[];
  confirmLabel: string;
  tone?: 'danger' | 'warning';
  onConfirm: () => Promise<void> | void;
}

export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    if (!request) return;
    setBusy(true);
    try {
      await request.onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal isOpen={!!request} onClose={onClose} title={request?.title} size="md" closeOnEscape>
      {request && (
        <div className="space-y-4">
          <ConfirmBody tone={request.tone ?? 'danger'} consequences={request.consequences ? { title: 'What happens', items: request.consequences } : undefined}>
            {request.message}
          </ConfirmBody>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant={request.tone === 'warning' ? 'warning' : 'danger'} onClick={confirm} loading={busy} data-testid="confirm-action">
              {request.confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
