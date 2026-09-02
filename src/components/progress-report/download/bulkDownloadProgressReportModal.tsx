// File: src/components/progress-report/download/bulkDownloadProgressReportModal.tsx
'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getSignedProgressReportUrl } from '@/services/progressReportService';
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/components/shared/modalKit';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface BulkDownloadProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePaths: string[];
  term: string;
  onDownloaded?: () => void;
}

// Fetch in small batches so we don't hammer the signed-url endpoint or
// exhaust the browser's connection pool on large selections.
const BATCH_SIZE = 5;

const BulkDownloadProgressReportModal: React.FC<BulkDownloadProgressReportModalProps> = ({
  isOpen,
  onClose,
  filePaths,
  term,
  onDownloaded,
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  // Attempts that errored, surfaced live so the bar can't imply every fetch worked.
  const [failedCount, setFailedCount] = useState(0);

  const count = filePaths.length;
  const noun = `progress report${count !== 1 ? 's' : ''}`;

  const handleDownload = async () => {
    if (count === 0) return;

    setDownloading(true);
    setProgress(0);
    setFailedCount(0);

    const zip = new JSZip();
    const usedNames = new Set<string>();
    let failed = 0;
    let done = 0;

    // Ensure each entry has a unique name inside the zip (defensive: progress
    // report file names are unique per term in practice).
    const uniqueName = (filePath: string): string => {
      const base = filePath.split('/').pop() || 'progress-report.pdf';
      if (!usedNames.has(base)) {
        usedNames.add(base);
        return base;
      }
      const dot = base.lastIndexOf('.');
      const stem = dot === -1 ? base : base.slice(0, dot);
      const ext = dot === -1 ? '' : base.slice(dot);
      let n = 2;
      let candidate = `${stem}_${n}${ext}`;
      while (usedNames.has(candidate)) {
        n += 1;
        candidate = `${stem}_${n}${ext}`;
      }
      usedNames.add(candidate);
      return candidate;
    };

    const fetchOne = async (filePath: string) => {
      try {
        const url = await getSignedProgressReportUrl(filePath);
        if (!url) throw new Error('No signed URL');
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        zip.file(uniqueName(filePath), blob);
      } catch (err) {
        failed += 1;
        setFailedCount(failed);
        console.error(`Failed to fetch progress report: ${filePath}`, err);
      } finally {
        done += 1;
        setProgress(done);
      }
    };

    try {
      for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
        const batch = filePaths.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(fetchOne));
      }

      const succeeded = count - failed;
      if (succeeded === 0) {
        showNotification('Failed to download progress reports', 'error');
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const safeTerm = (term || 'progress-reports').replace(/\s+/g, '_');

      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `progress-reports-${safeTerm}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);

      if (failed > 0) {
        showNotification(
          `Downloaded ${succeeded} progress report${succeeded !== 1 ? 's' : ''}; ${failed} failed`,
          'error'
        );
      } else {
        showNotification(
          `Downloaded ${succeeded} progress report${succeeded !== 1 ? 's' : ''}`,
          'success'
        );
      }

      onDownloaded?.();
      onClose();
    } catch (err) {
      showNotification('Error downloading progress reports', 'error');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const percent = count > 0 ? (progress / count) * 100 : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title={`Download ${count} ${noun}`}
        subtitle={term ? `Bundled as one ZIP for ${term}.` : 'Bundled as one ZIP file.'}
        icon={ArrowDownTrayIcon}
      />

      <ModalBody>
        <ConfirmBody>
          <strong className="font-semibold text-slate-900">
            {count} {noun}
          </strong>{' '}
          will be fetched and packed into a single ZIP file. Large selections take a moment.
        </ConfirmBody>

        {downloading && (
          <div>
            <div
              className="h-2 w-full overflow-hidden rounded-xl bg-slate-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={count}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Fetching {progress} of {count}…
              {failedCount > 0 && (
                <span className="text-rose-600">
                  {' '}· {failedCount} failed
                </span>
              )}
            </p>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={downloading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleDownload}
          loading={downloading}
          disabled={count === 0}
        >
          {downloading ? 'Preparing ZIP' : 'Download as ZIP'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default BulkDownloadProgressReportModal;
