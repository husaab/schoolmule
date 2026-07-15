'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AgendaManifestPayload,
  AgendaManifestItem,
} from '@/services/types/agenda';
import { renderAgendaMonth, getAgendaPageSignedUrl } from '@/services/agendaService';
import { placementToCss, DEFAULT_PLACEMENT } from './imagePlacement';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

// Letter page at CSS 96dpi: 8.5in x 11in
const PAGE_W = 816;
const PAGE_H = 1056;

// pdfjs is loaded once, lazily, on the client
type PdfJsModule = typeof import('pdfjs-dist');
type PdfDocumentProxy = import('pdfjs-dist').PDFDocumentProxy;

let pdfjsPromise: Promise<PdfJsModule> | null = null;
const loadPdfjs = (): Promise<PdfJsModule> => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
};

interface Props {
  agendaId: string;
  manifest: AgendaManifestPayload | null;
  /** Bumped by the parent whenever structure/content changes — flushes caches */
  refreshKey: number;
  /** Seq to scroll to (set by outline clicks); consumed once */
  jumpToSeq: number | null;
  onJumpConsumed: () => void;
  /** Open the placement editor for an image page */
  onAdjustImage?: (pageId: string) => void;
}

export default function AgendaLivePreview({
  agendaId,
  manifest,
  refreshKey,
  jumpToSeq,
  onJumpConsumed,
  onAdjustImage,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // seq -> rendered generated-page HTML (filled per month on demand)
  const [htmlBySeq, setHtmlBySeq] = useState<Map<number, string>>(new Map());
  const fetchedMonthsRef = useRef<Set<number>>(new Set());

  // pageId -> pdfjs document promise / signed url
  const pdfDocsRef = useRef<Map<string, Promise<PdfDocumentProxy>>>(new Map());
  const signedUrlsRef = useRef<Map<string, Promise<string | null>>>(new Map());

  // Flush all caches when the agenda changes structurally
  useEffect(() => {
    setHtmlBySeq(new Map());
    fetchedMonthsRef.current = new Set();
    pdfDocsRef.current = new Map();
    signedUrlsRef.current = new Map();
  }, [refreshKey, agendaId]);

  const ensureMonthHtml = useCallback(async (month: number) => {
    if (fetchedMonthsRef.current.has(month)) return;
    fetchedMonthsRef.current.add(month);
    try {
      const response = await renderAgendaMonth(agendaId, month);
      setHtmlBySeq((prev) => {
        const next = new Map(prev);
        for (const page of response.data) next.set(page.seq, page.html);
        return next;
      });
    } catch (error) {
      console.error(`Error rendering month ${month}:`, error);
      fetchedMonthsRef.current.delete(month); // allow retry
    }
  }, [agendaId]);

  const getSignedUrl = useCallback((pageId: string) => {
    let promise = signedUrlsRef.current.get(pageId);
    if (!promise) {
      promise = getAgendaPageSignedUrl(agendaId, pageId);
      signedUrlsRef.current.set(pageId, promise);
    }
    return promise;
  }, [agendaId]);

  const getPdfDoc = useCallback((pageId: string) => {
    let promise = pdfDocsRef.current.get(pageId);
    if (!promise) {
      promise = (async () => {
        const [pdfjs, url] = await Promise.all([loadPdfjs(), getSignedUrl(pageId)]);
        if (!url) throw new Error('No signed URL');
        return pdfjs.getDocument({ url }).promise;
      })();
      pdfDocsRef.current.set(pageId, promise);
    }
    return promise;
  }, [getSignedUrl]);

  // Scroll to a page when the outline asks for it
  useEffect(() => {
    if (jumpToSeq === null) return;
    const el = pageRefs.current.get(jumpToSeq);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onJumpConsumed();
  }, [jumpToSeq, onJumpConsumed]);

  const items = useMemo(() => manifest?.items ?? [], [manifest]);

  if (!manifest) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        Loading preview…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {items.map((item) => (
        <PageFrame
          key={`${refreshKey}-${item.seq}`}
          item={item}
          registerRef={(el) => {
            if (el) pageRefs.current.set(item.seq, el);
            else pageRefs.current.delete(item.seq);
          }}
          html={item.kind !== 'custom' ? htmlBySeq.get(item.seq) : undefined}
          onNeedsContent={() => {
            if (item.kind !== 'custom' && item.month !== undefined) {
              ensureMonthHtml(item.month);
            }
          }}
          getSignedUrl={getSignedUrl}
          getPdfDoc={getPdfDoc}
          onAdjustImage={onAdjustImage}
          pageBackground={manifest.theme?.background}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- PageFrame

interface PageFrameProps {
  item: AgendaManifestItem;
  registerRef: (el: HTMLDivElement | null) => void;
  html?: string;
  onNeedsContent: () => void;
  getSignedUrl: (pageId: string) => Promise<string | null>;
  getPdfDoc: (pageId: string) => Promise<PdfDocumentProxy>;
  onAdjustImage?: (pageId: string) => void;
  pageBackground?: string;
}

function PageFrame({ item, registerRef, html, onNeedsContent, getSignedUrl, getPdfDoc, onAdjustImage, pageBackground }: PageFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '1200px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible) onNeedsContent();
  }, [visible, onNeedsContent]);

  const label =
    item.kind === 'custom'
      ? `${item.title || 'Custom page'}${(item.sourcePageCount ?? 1) > 1 ? ` (${(item.sourcePageIndex ?? 0) + 1}/${item.sourcePageCount})` : ''}`
      : item.kind === 'monthOverview'
        ? 'Month overview'
        : item.kind === 'weekly'
          ? `Week of ${item.mondayIso}`
          : item.kind === 'notes'
            ? 'Notes / communication'
            : 'Monthly evaluation';

  return (
    <div
      ref={(el) => {
        frameRef.current = el;
        registerRef(el);
      }}
    >
      <div className="flex items-baseline justify-between px-1 mb-1">
        <span className="text-[11px] text-slate-400 truncate">{label}</span>
        <span className="text-[11px] font-medium text-slate-300">p.{item.seq}</span>
      </div>
      <div
        className="relative w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
        style={{ aspectRatio: '8.5 / 11' }}
      >
        {visible ? (
          item.kind !== 'custom' ? (
            <GeneratedPageView html={html} />
          ) : item.fileType === 'pdf' ? (
            <PdfPageView
              pageId={item.pageId!}
              sourcePageIndex={item.sourcePageIndex ?? 0}
              getPdfDoc={getPdfDoc}
            />
          ) : (
            <>
              <ImagePageView
                item={item}
                pageBackground={pageBackground}
                getSignedUrl={getSignedUrl}
              />
              {onAdjustImage && (
                <button
                  type="button"
                  onClick={() => onAdjustImage(item.pageId!)}
                  className="group absolute inset-0 flex items-center justify-center bg-transparent hover:bg-slate-900/25 transition-colors cursor-pointer"
                  title="Adjust size and position"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 text-xs font-medium text-slate-700 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowsPointingOutIcon className="w-4 h-4" /> Adjust
                  </span>
                </button>
              )}
            </>
          )
        ) : (
          <div className="absolute inset-0 bg-slate-50" />
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------- GeneratedPageView

function GeneratedPageView({ html }: { html?: string }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PAGE_W);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={holderRef} className="absolute inset-0">
      {html && scale > 0 ? (
        <iframe
          sandbox=""
          srcDoc={html}
          title="Agenda page preview"
          width={PAGE_W}
          height={PAGE_H}
          style={{
            border: 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-slate-100" />
      )}
    </div>
  );
}

// -------------------------------------------------------------- PdfPageView

function PdfPageView({
  pageId,
  sourcePageIndex,
  getPdfDoc,
}: {
  pageId: string;
  sourcePageIndex: number;
  getPdfDoc: (pageId: string) => Promise<PdfDocumentProxy>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

    (async () => {
      try {
        const doc = await getPdfDoc(pageId);
        if (cancelled) return;
        const page = await doc.getPage(sourcePageIndex + 1);
        if (cancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const holderWidth = canvas.parentElement?.clientWidth || 500;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: 1 });
        const scale = (holderWidth / viewport.width) * dpr;
        const scaled = page.getViewport({ scale });

        canvas.width = scaled.width;
        canvas.height = scaled.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';

        const context = canvas.getContext('2d');
        if (!context) return;
        renderTask = page.render({ canvas, canvasContext: context, viewport: scaled });
        await (renderTask as unknown as { promise: Promise<void> }).promise;
      } catch (err) {
        if (!cancelled) {
          console.error('PDF page render error:', err);
          setError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pageId, sourcePageIndex, getPdfDoc]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
        Preview unavailable
      </div>
    );
  }
  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

// ------------------------------------------------------------ ImagePageView

function ImagePageView({
  item,
  pageBackground,
  getSignedUrl,
}: {
  item: AgendaManifestItem;
  pageBackground?: string;
  getSignedUrl: (pageId: string) => Promise<string | null>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignedUrl(item.pageId!).then((signed) => {
      if (!cancelled) setUrl(signed);
    });
    return () => { cancelled = true; };
  }, [item.pageId, getSignedUrl]);

  if (!url) return <div className="absolute inset-0 animate-pulse bg-slate-100" />;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: pageBackground || '#ffffff' }}
    >
      {/* Placement mirrors the assembler's placeImage() math exactly */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Custom page"
        onLoad={(e) => {
          const img = e.currentTarget;
          setNatural({ w: img.naturalWidth, h: img.naturalHeight });
        }}
        className="absolute max-w-none"
        style={
          natural
            ? placementToCss(natural.w, natural.h, {
                fitMode: item.fitMode || 'contain',
                zoom: item.zoom ?? DEFAULT_PLACEMENT.zoom,
                zoomY: item.zoomY ?? DEFAULT_PLACEMENT.zoomY,
                offsetX: item.offsetX ?? DEFAULT_PLACEMENT.offsetX,
                offsetY: item.offsetY ?? DEFAULT_PLACEMENT.offsetY,
              })
            : { opacity: 0 }
        }
      />
    </div>
  );
}
