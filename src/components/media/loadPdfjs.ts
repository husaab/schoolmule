// src/components/media/loadPdfjs.ts
// pdf.js, loaded once and only when a PDF is actually drawn. It stays out of
// src/lib because the app copies that folder and has no pdf.js.

export type PdfJsModule = typeof import('pdfjs-dist')
export type PdfDocumentProxy = import('pdfjs-dist').PDFDocumentProxy

let pdfjsPromise: Promise<PdfJsModule> | null = null

export const loadPdfjs = (): Promise<PdfJsModule> => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      return pdfjs
    })
  }
  return pdfjsPromise
}
