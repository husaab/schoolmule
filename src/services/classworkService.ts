// src/services/classworkService.ts
// The teacher's classwork API (/api/classroom): items, topics, attachments
// and copy from another class. Staff only; class routes check that the
// caller teaches the class, item/topic/attachment routes apply the same rule
// to the resource's class.

import apiClient from './apiClient'
import apiUpload from './apiUpload'
import type {
  Attachment,
  ClassworkData,
  ClassworkEnvelope,
  CopyInput,
  CopyResult,
  CopySource,
  DeleteItemResult,
  Item,
  ItemInput,
  Topic,
} from './types/classwork'

const classPath = (classId: string) => `/classroom/classes/${encodeURIComponent(classId)}`
const itemPath = (itemId: string) => `/classroom/items/${encodeURIComponent(itemId)}`
const topicPath = (topicId: string) => `/classroom/topics/${encodeURIComponent(topicId)}`
const attachmentPath = (attachmentId: string) => `/classroom/attachments/${encodeURIComponent(attachmentId)}`

// ── Items ──────────────────────────────────────────────────────────────────

/** GET items: every live item of the class with its topics, categories and the columns work can fill. */
export const getClasswork = (classId: string) => apiClient<ClassworkEnvelope<ClassworkData>>(`${classPath(classId)}/items`)

/** POST an item (201). A graded one becomes a gradebook column. */
export const createItem = (classId: string, input: ItemInput) =>
  apiClient<ClassworkEnvelope<Item>, ItemInput>(`${classPath(classId)}/items`, { method: 'POST', body: input })

export const getItem = (itemId: string) => apiClient<ClassworkEnvelope<Item>>(itemPath(itemId))

/**
 * PATCH an item: keys left out keep their value. `keepalive` lets the save
 * outlive the page (an autosave sent from pagehide).
 */
export const updateItem = (itemId: string, patch: Partial<ItemInput>, opts: { keepalive?: boolean } = {}) =>
  apiClient<ClassworkEnvelope<Item>, Partial<ItemInput>>(itemPath(itemId), {
    method: 'PATCH',
    body: patch,
    keepalive: opts.keepalive,
  })

/** DELETE an item; a graded one takes its gradebook column and scores along. */
export const deleteItem = (itemId: string) =>
  apiClient<ClassworkEnvelope<DeleteItemResult>>(itemPath(itemId), { method: 'DELETE' })

// ── Topics ─────────────────────────────────────────────────────────────────

export const getTopics = (classId: string) => apiClient<ClassworkEnvelope<Topic[]>>(`${classPath(classId)}/topics`)

export const createTopic = (classId: string, name: string) =>
  apiClient<ClassworkEnvelope<Topic>, { name: string }>(`${classPath(classId)}/topics`, { method: 'POST', body: { name } })

export const updateTopic = (topicId: string, patch: { name?: string; sortOrder?: number }) =>
  apiClient<ClassworkEnvelope<Topic>, { name?: string; sortOrder?: number }>(topicPath(topicId), { method: 'PATCH', body: patch })

/** DELETE a topic; its items stay, with no topic. */
export const deleteTopic = (topicId: string) =>
  apiClient<ClassworkEnvelope<{ deleted: true }>>(topicPath(topicId), { method: 'DELETE' })

/** POST reorder: every topic of the class, once, in the new order. */
export const reorderTopics = (classId: string, topicIds: string[]) =>
  apiClient<ClassworkEnvelope<Topic[]>, { topicIds: string[] }>(`${classPath(classId)}/topics/reorder`, {
    method: 'POST',
    body: { topicIds },
  })

// ── Attachments ────────────────────────────────────────────────────────────

/** POST files (multipart "files", at most 5 per request, 10 MB each). */
export const uploadAttachments = (itemId: string, files: File[]) => {
  const form = new FormData()
  for (const f of files) form.append('files', f, f.name)
  return apiUpload<ClassworkEnvelope<Attachment[]>>(`${itemPath(itemId)}/attachments`, form)
}

export const addLink = (itemId: string, link: { title: string | null; url: string }) =>
  apiClient<ClassworkEnvelope<Attachment>, { title: string | null; url: string }>(`${itemPath(itemId)}/links`, {
    method: 'POST',
    body: link,
  })

/** PATCH a title (any attachment) or a link's address. */
export const updateAttachment = (attachmentId: string, patch: { title?: string | null; url?: string }) =>
  apiClient<ClassworkEnvelope<Attachment>, { title?: string | null; url?: string }>(attachmentPath(attachmentId), {
    method: 'PATCH',
    body: patch,
  })

/** PUT a new file in place of a file attachment (multipart "file"); the old one is removed. */
export const replaceAttachmentFile = (attachmentId: string, file: File) => {
  const form = new FormData()
  form.append('file', file, file.name)
  return apiUpload<ClassworkEnvelope<Attachment>>(`${attachmentPath(attachmentId)}/file`, form, { method: 'PUT' })
}

export const deleteAttachment = (attachmentId: string) =>
  apiClient<ClassworkEnvelope<{ deleted: true }>>(attachmentPath(attachmentId), { method: 'DELETE' })

/** GET url: a file's signed link (1 h), or a link's address. */
export const getAttachmentUrl = async (attachmentId: string): Promise<string> => {
  const res = await apiClient<ClassworkEnvelope<{ url: string }>>(`${attachmentPath(attachmentId)}/url`)
  return res.data.url
}

// ── Copy from another class ────────────────────────────────────────────────

/** GET copy-sources: the caller's other classes this year (an admin's: every class). */
export const getCopySources = (classId: string) =>
  apiClient<ClassworkEnvelope<{ classes: CopySource[] }>>(`${classPath(classId)}/copy-sources`)

/** POST copy: the chosen classwork (default all) arrives as drafts, with a warning per item that couldn't keep its grade. */
export const copyFromClass = (classId: string, input: CopyInput) =>
  apiClient<ClassworkEnvelope<CopyResult>, CopyInput>(`${classPath(classId)}/copy`, { method: 'POST', body: input })
