'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import Modal from '@/components/shared/modal';
import CategoryTag from '@/components/patchNotes/CategoryTag';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  getAllPatchNotesAdmin,
  createPatchNote,
  updatePatchNote,
  deletePatchNote,
  uploadPatchNoteImage,
} from '@/services/patchNoteService';
import type { PatchNote, PatchNoteCategory, CreatePatchNotePayload } from '@/services/types/patchNote';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

const CATEGORY_OPTIONS: { value: PatchNoteCategory; label: string }[] = [
  { value: 'new_feature', label: 'New Feature' },
  { value: 'bug_fix', label: 'Bug Fix' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'heads_up', label: 'Heads Up' },
];

const ROLE_OPTIONS = ['teacher', 'admin', 'parent'];

const QUILL_MODULES = {
  toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']],
};

type FormState = {
  title: string;
  body: string;
  version: string;
  category: PatchNoteCategory;
  targetRoles: string[];
  publishedAt: string;
  imageFile: File | null;
};

const toLocalDatetimeString = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const emptyForm: FormState = {
  title: '',
  body: '',
  version: '',
  category: 'new_feature',
  targetRoles: ['teacher', 'admin', 'parent'],
  publishedAt: toLocalDatetimeString(new Date()),
  imageFile: null,
};

export default function AdminPatchNotesPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [notes, setNotes] = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = async () => {
    try {
      const res = await getAllPatchNotesAdmin();
      setNotes(res.data);
    } catch {
      notify('Failed to load patch notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (note: PatchNote) => {
    setEditingId(note.patchNoteId);
    setForm({
      title: note.title,
      body: note.body,
      version: note.version,
      category: note.category,
      targetRoles: note.targetRoles,
      publishedAt: toLocalDatetimeString(new Date(note.publishedAt)),
      imageFile: null,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.body || !form.version || form.targetRoles.length === 0) {
      notify('Please fill in all required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreatePatchNotePayload = {
        title: form.title,
        body: form.body,
        version: form.version,
        category: form.category,
        targetRoles: form.targetRoles,
        publishedAt: new Date(form.publishedAt).toISOString(),
      };

      let savedNote: PatchNote;
      if (editingId) {
        const res = await updatePatchNote(editingId, payload);
        savedNote = res.data;
      } else {
        const res = await createPatchNote(payload);
        savedNote = res.data;
      }

      if (form.imageFile) {
        await uploadPatchNoteImage(savedNote.patchNoteId, form.imageFile);
      }

      notify(editingId ? 'Patch note updated' : 'Patch note created', 'success');
      setFormOpen(false);
      loadNotes();
    } catch {
      notify('Failed to save patch note', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePatchNote(deleteId);
      notify('Patch note deleted', 'success');
      setDeleteId(null);
      loadNotes();
    } catch {
      notify('Failed to delete patch note', 'error');
    }
  };

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Patch Notes</h1>
              <p className="text-sm text-slate-500 mt-1">Manage product updates shown to users</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-cyan-500 hover:to-teal-500 transition-all shadow-sm"
            >
              <PlusIcon className="h-4 w-4" />
              New Patch Note
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-slate-400 text-center py-20">No patch notes yet. Create your first one!</p>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Version</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Roles</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Published</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((note) => (
                    <tr key={note.patchNoteId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{note.title}</td>
                      <td className="px-4 py-3 text-slate-600">{note.version}</td>
                      <td className="px-4 py-3">
                        <CategoryTag category={note.category} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">
                        {note.targetRoles.join(', ')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(note.publishedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(note)}
                          className="text-slate-400 hover:text-cyan-600 p-1 mr-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(note.patchNoteId)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Edit Patch Note' : 'New Patch Note'} size="xl">
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="e.g. Teacher Attendance Tracking"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Version *</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="e.g. v2.4.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as PatchNoteCategory }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Publish Date</label>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Roles *</label>
            <div className="flex gap-3">
              {ROLE_OPTIONS.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.targetRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <ReactQuill
              theme="snow"
              value={form.body}
              onChange={(value: string) => setForm((p) => ({ ...p, body: value }))}
              modules={QUILL_MODULES}
              className="bg-white rounded-lg [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:max-h-[400px] [&_.ql-editor]:overflow-y-auto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Screenshot (optional)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={(e) =>
                setForm((p) => ({ ...p, imageFile: e.target.files?.[0] || null }))
              }
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:from-cyan-500 hover:to-teal-500 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Patch Note" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete this patch note? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-slate-600">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
