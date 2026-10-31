/**
 * reportkit public surface. Bundled as an IIFE (global `ReportKit`) for the
 * backend PDF printer by scripts/build-reportkit.mjs; imported directly by
 * the designer. Bump ENGINE_VERSION whenever rendering output changes.
 */
export const ENGINE_VERSION = 1;

export * from './types';
export { renderReport, ensureFonts, ensureStyles, defaultResolveImage } from './render';
export type { RenderOptions, RenderResult } from './render';
export { evaluateCondition, describeCondition } from './conditions';
export { formatMark, formatDate, termDisplay, gradeLabel, gradeNumber, overallRating, DEFAULT_MARK_RULES, ONTARIO_LETTER_BANDS, GRADES } from './format';
export { mergeHtml, mergeText, mergeFieldsIn } from './merge';
export { FONT_FAMILIES, fontFaceCss, fontFiles, fontStack, DEFAULT_FONT } from './fonts';
export { planPages } from './splitPlan';
export { sampleReportData, SAMPLE_OPTIONS } from './sample';
export type { SampleKey } from './sample';
export { DEFAULT_TEMPLATES, defaultTemplate } from './defaults';
export type { DefaultTemplateDef } from './defaults';
export { SCALES } from './defaults/scales';
export { validateTemplate, BLOCK_TYPES } from './validate';
export type { ValidationResult } from './validate';
export { BLOCK_CATALOG, ELEMENT_CATALOG, blockLabel, createBlock, createElement, blankTemplate, reId } from './factory';
export { FIELD_CATALOG, catalogFor, fieldLabel } from './catalog';
export type { CatalogField, FieldKind } from './catalog';
