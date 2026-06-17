// File: src/components/report-cards/download/bulkDownloadReportCardModal.tsx
'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getSignedReportCardUrl } from '@/services/reportCardService';

interface BulkDownloadReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePaths: string[];
  term: string;
  onDownloaded?: () => void;
}

// Fetch in small batches so we don't hammer the signed-url endpoint or
// exhaust the browser's connection pool on large selections.
const BATCH_SIZE = 5;

const BulkDownloadReportCardModal: React.FC<BulkDownloadReportCardModalProps> = ({
  isOpen,
  onClose,
  filePaths,
  term,
  onDownloaded,
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const count = filePaths.length;

  const handleDownload = async () => {
    if (count === 0) return;

    setDownloading(true);
    setProgress(0);

    const zip = new JSZip();
    const usedNames = new Set<string>();
    let failed = 0;
    let done = 0;

    // Ensure each entry has a unique name inside the zip (defensive: report
    // card file names are unique per term in practice).
    const uniqueName = (filePath: string): string => {
      const base = filePath.split('/').pop() || 'report-card.pdf';
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
        const url = await getSignedReportCardUrl(filePath);
        if (!url) throw new Error('No signed URL');
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        zip.file(uniqueName(filePath), blob);
      } catch (err) {
        failed += 1;
        console.error(`Failed to fetch report card: ${filePath}`, err);
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
        showNotification('Failed to download report cards', 'error');
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const safeTerm = (term || 'report-cards').replace(/\s+/g, '_');

      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `report-cards-${safeTerm}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);

      if (failed > 0) {
        showNotification(
          `Downloaded ${succeeded} report card${succeeded !== 1 ? 's' : ''}; ${failed} failed`,
          'error'
        );
      } else {
        showNotification(
          `Downloaded ${succeeded} report card${succeeded !== 1 ? 's' : ''}`,
          'success'
        );
      }

      onDownloaded?.();
      onClose();
    } catch (err) {
      showNotification('Error downloading report cards', 'error');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-lg font-semibold mb-4 text-black">Download Report Cards</h2>
      <p className="text-black mb-6">
        Download <strong>{count} report card{count !== 1 ? 's' : ''}</strong> as a single ZIP file?
      </p>

      {downloading && (
        <div className="mb-6">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${count > 0 ? (progress / count) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">Fetching {progress} of {count}…</p>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          disabled={downloading}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading || count === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {downloading ? 'Preparing…' : 'Download as ZIP'}
        </button>
      </div>
    </Modal>
  );
};

export default BulkDownloadReportCardModal;
