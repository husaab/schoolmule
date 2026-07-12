// Mirrors the backend assembler's placeImage() math (pdf-lib, Letter
// 612x792pt) in CSS percentage terms, so the on-screen placement is
// exactly what prints.

import type { AgendaFitMode } from '@/services/types/agenda';

export const LETTER_W = 612;
export const LETTER_H = 792;

export interface Placement {
  fitMode: AgendaFitMode;
  zoom: number;          // 0.2 - 4, horizontal scale on the fit-mode base
  zoomY: number | null;  // vertical scale; null = uniform (follows zoom)
  offsetX: number;       // -1 - 1, fraction of page width, + = right
  offsetY: number;       // -1 - 1, fraction of page height, + = down
}

/**
 * The image's drawn box, in fractions of the page (0-1 on each axis).
 * The adjust editor manipulates this directly (drag/resize handles),
 * then converts back to a Placement on save.
 */
export interface PlacementBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const DEFAULT_PLACEMENT: Omit<Placement, 'fitMode'> = {
  zoom: 1,
  zoomY: null,
  offsetX: 0,
  offsetY: 0,
};

const baseScaleFor = (naturalWidth: number, naturalHeight: number, fitMode: AgendaFitMode) =>
  fitMode === 'cover'
    ? Math.max(LETTER_W / naturalWidth, LETTER_H / naturalHeight)
    : Math.min(LETTER_W / naturalWidth, LETTER_H / naturalHeight);

/** Placement -> drawn box in page fractions. */
export function placementToBox(
  naturalWidth: number,
  naturalHeight: number,
  { fitMode, zoom, zoomY, offsetX, offsetY }: Placement
): PlacementBox {
  const base = baseScaleFor(naturalWidth, naturalHeight, fitMode);
  const width = (naturalWidth * base * zoom) / LETTER_W;
  const height = (naturalHeight * base * (zoomY ?? zoom)) / LETTER_H;
  return {
    left: (1 - width) / 2 + offsetX,
    top: (1 - height) / 2 + offsetY,
    width,
    height,
  };
}

/** Drawn box -> Placement (inverse of placementToBox for a given fitMode). */
export function boxToPlacement(
  naturalWidth: number,
  naturalHeight: number,
  fitMode: AgendaFitMode,
  box: PlacementBox
): Placement {
  const base = baseScaleFor(naturalWidth, naturalHeight, fitMode);
  const zoom = clampZoom((box.width * LETTER_W) / (naturalWidth * base));
  const zoomYRaw = clampZoom((box.height * LETTER_H) / (naturalHeight * base));
  return {
    fitMode,
    zoom,
    // Collapse to uniform when the axes match (within rounding)
    zoomY: Math.abs(zoomYRaw - zoom) < 0.005 ? null : zoomYRaw,
    offsetX: clampOffset(box.left + box.width / 2 - 0.5),
    offsetY: clampOffset(box.top + box.height / 2 - 0.5),
  };
}

/** Placement -> CSS percentages for the page frame. */
export function placementToCss(
  naturalWidth: number,
  naturalHeight: number,
  placement: Placement
) {
  const box = placementToBox(naturalWidth, naturalHeight, placement);
  return {
    left: `${box.left * 100}%`,
    top: `${box.top * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  };
}

export const clampZoom = (z: number) => Math.min(4, Math.max(0.2, z));
export const clampOffset = (o: number) => Math.min(1, Math.max(-1, o));
