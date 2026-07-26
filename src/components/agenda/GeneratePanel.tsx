'use client';

import { useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { generateAgenda, getAgendaById, fetchGeneratedAgendaBlobUrl } from '@/services/agendaService';
import type { AgendaDetailPayload } from '@/services/types/agenda';
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Props {
  agenda: AgendaDetailPayload;
  /** Parent refetches agenda detail (status change) */
  onStatusChange: () => void;
}

export default function GeneratePanel({ agenda, onStatusChange }: Props) {
  const showNotification = useNotificationStore((state) => state.showNotification);
  const [starting, setStarting] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState<'preview' | 'download' | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // The PDF blob is cached per generation so Preview-then-Download (or a
  // second Preview) doesn't re-stream the whole multi-MB file
  const blobCacheRef = useRef<{ stamp: string; url: string } | null>(null);

  const isGenerating = agenda.status === 'generating';
  const isStale =
    agenda.status === 'generated' &&
    agenda.generatedAt !== undefined &&
    agenda.generatedAt !== null &&
    new Date(agenda.updatedAt) > new Date(agenda.generatedAt);

  // Poll while generating
  useEffect(() => {
    if (!isGenerating) return;
    pollRef.current = setInterval(async () => {
      try {
        const response = await getAgendaById(agenda.agendaId);
        if (response.data.status !== 'generating') {
          onStatusChange();
        }
      } catch (error) {
        console.error('Error polling agenda status:', error);
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isGenerating, agenda.agendaId, onStatusChange]);

  const handleGenerate = async () => {
    setStarting(true);
    try {
      await generateAgenda(agenda.agendaId);
      showNotification('Generation started — this takes under a minute', 'success');
      onStatusChange();
    } catch (error) {
      console.error('Error starting generation:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to start generation', 'error');
    } finally {
      setStarting(false);
    }
  };

  /** Fetch the assembled PDF once per generation; reuse afterwards. */
  const getBlobUrl = async (): Promise<string> => {
    const stamp = agenda.generatedAt || 'unknown';
    const cached = blobCacheRef.current;
    if (cached && cached.stamp === stamp) return cached.url;

    const url = await fetchGeneratedAgendaBlobUrl(agenda.agendaId);
    if (cached) URL.revokeObjectURL(cached.url);
    blobCacheRef.current = { stamp, url };
    return url;
  };

  // Drop the cache when a newer PDF is generated
  useEffect(() => {
    const cached = blobCacheRef.current;
    if (cached && cached.stamp !== (agenda.generatedAt || 'unknown')) {
      URL.revokeObjectURL(cached.url);
      blobCacheRef.current = null;
      setViewerUrl(null);
    }
  }, [agenda.generatedAt]);

  const openPdf = async (download: boolean) => {
    if (fetching) return;
    setFetching(download ? 'download' : 'preview');
    // Open the viewer immediately with a loading state — the file streams in
    if (!download) setViewerOpen(true);
    try {
      const url = await getBlobUrl();
      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `agenda-${agenda.academicYear}.pdf`;
        link.click();
      } else {
        setViewerUrl(url);
      }
    } catch (error) {
      // e.g. server restarted since generation — the file must be rebuilt
      if (!download) setViewerOpen(false);
      showNotification(
        error instanceof Error ? error.message : 'Could not download the PDF',
        'error'
      );
    } finally {
      setFetching(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Print-ready PDF</h3>
            <p className="text-xs text-slate-500">
              {agenda.status === 'generated' && agenda.generatedAt
                ? `Last generated ${new Date(agenda.generatedAt).toLocaleString()} · ${agenda.generatedPageCount} pages`
                : agenda.status === 'failed'
                  ? 'Last generation failed'
                  : isGenerating
                    ? 'Generating…'
                    : 'Not generated yet'}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={starting || isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl cursor-pointer disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            {isGenerating ? 'Generating…' : agenda.status === 'generated' ? 'Regenerate' : 'Generate PDF'}
          </button>
        </div>

        {isGenerating && (
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-1/3 bg-indigo-500 rounded-full animate-pulse" />
          </div>
        )}

        {isStale && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            The agenda changed since this PDF was generated — regenerate before printing.
          </div>
        )}

        {agenda.status === 'failed' && agenda.generationError && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {agenda.generationError}
          </div>
        )}

        {agenda.status === 'generated' && agenda.generatedFilePath && (
          <div className="flex gap-2">
            <button
              onClick={() => openPdf(false)}
              disabled={fetching !== null}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {fetching === 'preview' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                  Loading…
                </>
              ) : (
                <>
                  <EyeIcon className="w-4 h-4" /> Preview
                </>
              )}
            </button>
            <button
              onClick={() => openPdf(true)}
              disabled={fetching !== null}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {fetching === 'download' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                  Preparing…
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" /> Download
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* PDF viewer modal — opens instantly, shows progress while the
          file streams in (the blob stays cached for Download) */}
      {viewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Agenda {agenda.academicYear}
              </h2>
              <button
                onClick={() => setViewerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {viewerUrl ? (
              <iframe src={viewerUrl} className="flex-1 w-full" title="Agenda PDF" />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
                <p className="text-sm">
                  Loading the PDF ({agenda.generatedPageCount || '~130'} pages)…
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
