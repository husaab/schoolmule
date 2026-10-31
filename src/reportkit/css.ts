/** Base stylesheet for rendered reports. Everything is scoped under .rk-root. */
export const REPORTKIT_CSS = `
.rk-root{position:relative;color:#111;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rk-root *,.rk-root *::before,.rk-root *::after{box-sizing:border-box;margin:0;padding:0}
.rk-page{position:relative;overflow:hidden;background:#fff;break-after:page;page-break-after:always}
.rk-page:last-child{break-after:auto;page-break-after:auto}
.rk-screen .rk-page{margin:0 auto 28px;box-shadow:0 1px 2px rgba(15,23,42,.08),0 8px 28px rgba(15,23,42,.10)}
.rk-body{position:absolute;display:flex;flex-direction:column;align-items:stretch}
.rk-zone{position:absolute;left:0;right:0}
.rk-frag{display:flow-root;flex:none}
.rk-measure{position:absolute;left:-100000px;top:0;visibility:hidden}
.rk-measure>.rk-frag{display:flow-root}
.rk-el{position:absolute}
.rk-text{display:flex;flex-direction:column;overflow:visible;word-wrap:break-word;overflow-wrap:anywhere}
.rk-text.rk-clip{overflow:hidden}
.rk-img{display:block;width:100%;height:100%}
.rk-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:1px dashed #94a3b8;color:#64748b;font:600 11px/1.2 sans-serif;background:repeating-linear-gradient(45deg,#f8fafc,#f8fafc 6px,#f1f5f9 6px,#f1f5f9 12px)}
.rk-table{width:100%;border-collapse:collapse;table-layout:fixed;border:var(--rk-obw,1px) solid var(--rk-bc,#000)}
.rk-table td,.rk-table th{border:var(--rk-bw,1px) solid var(--rk-bc,#000);padding:var(--rk-pad,4px) var(--rk-padx,calc(var(--rk-pad,4px) + 2px));vertical-align:var(--rk-va,middle);text-align:left;font-weight:inherit;overflow-wrap:anywhere;word-wrap:break-word}
.rk-table th{font-weight:700}
.rk-table .rk-bar{font-weight:700}
.rk-table .rk-c{text-align:center}
.rk-table .rk-r{text-align:right}
.rk-table .rk-rating{text-align:center;font-weight:700}
.rk-table .rk-vertical{padding:4px 0;text-align:center;vertical-align:middle}
.rk-table .rk-vertical>span{display:inline-block;writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap}
.rk-table .rk-caption{display:block;font-weight:400;font-size:.82em;line-height:1.25;margin-top:1px}
.rk-table .rk-stripe>td{background:var(--rk-stripe,#f8fafc)}
.rk-table .rk-desc{margin:3px 0 0 14px;font-size:.88em}
.rk-table .rk-desc li{margin:1px 0}
.rk-table td img{display:inline-block;max-width:100%;object-fit:contain;vertical-align:middle}
.rk-card{border:var(--rk-obw,1px) solid var(--rk-bc,#000)}
.rk-card-head{padding:6px 10px;font-weight:700}
.rk-card .rk-table{border-left:0;border-right:0}
.rk-card-body{padding:8px 10px}
.rk-card-label{font-weight:700;margin-bottom:3px}
.rk-chips{display:flex;flex-wrap:wrap;gap:6px 14px}
.rk-chip{display:inline-flex;align-items:center;gap:6px}
.rk-chip b{display:inline-flex;min-width:22px;justify-content:center;padding:1px 5px;border-radius:3px}
.rk-sigs{display:flex;gap:24px;align-items:flex-end}
.rk-sig{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center}
.rk-sig-img{display:flex;align-items:flex-end;justify-content:center;width:100%}
.rk-sig-img img{max-height:100%;max-width:100%;object-fit:contain}
.rk-sig-line{width:100%;border-top:1px solid currentColor;margin-top:2px;padding-top:4px}
.rk-cols{display:flex;align-items:flex-start}
.rk-cols>div{min-width:0}
.rk-region{position:relative}
`;
