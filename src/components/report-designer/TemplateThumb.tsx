'use client';

/** A small live render of a template's first page (cards on the list page). */
import { useEffect, useRef, useState } from 'react';
import { ensureFonts, renderReport } from '@/reportkit/render';
import { sampleReportData, type SampleKey } from '@/reportkit/sample';
import { PAGE_SIZES, type ReportData, type TemplateDoc } from '@/reportkit/types';

const SRC = '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;overflow:hidden}</style></head><body><div id="rk"></div></body></html>';

export default function TemplateThumb({ doc, sample, data, width = 220 }: { doc: TemplateDoc | null; sample?: SampleKey; data?: ReportData | null; width?: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const size = PAGE_SIZES[doc?.page.size ?? 'letter'];
  const scale = width / size.width;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!ready || !visible || !doc) return;
    const d = ref.current?.contentDocument;
    const root = d?.getElementById('rk');
    if (!d || !root) return;
    ensureFonts(d, (f) => `/report-fonts/${f}`);
    const rd = data ?? sampleReportData(sample ?? (doc.docType === 'progress_report' ? 'SK' : '4'), doc.docType);
    void renderReport(root, doc, rd, { mode: 'editor' }).catch(() => {});
  }, [ready, visible, doc, data, sample]);

  return (
    <div ref={host} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" style={{ width, height: size.height * scale }}>
      <iframe
        ref={ref}
        title="Template preview"
        srcDoc={SRC}
        sandbox="allow-same-origin"
        onLoad={() => setReady(true)}
        className="pointer-events-none origin-top-left border-0"
        style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}
        tabIndex={-1}
      />
    </div>
  );
}
