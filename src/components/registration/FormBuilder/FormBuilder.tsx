'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { FormField, FieldType, RegistrationFormWithFields } from '@/services/types/registration';
import FieldCard from './FieldCard';
import FieldEditor from './FieldEditor';
import FieldTypeSelector from './FieldTypeSelector';
import StatusBadge from './StatusBadge';
import { useNotificationStore } from '@/store/useNotificationStore';
import * as registrationService from '@/services/registrationService';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface Props {
  form: RegistrationFormWithFields;
  onSaved: () => void;
}

export default function FormBuilder({ form, onSaved }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);

  // Form metadata state
  const [title, setTitle] = useState(form.title);
  const [slug, setSlug] = useState(form.slug);
  const [description, setDescription] = useState(form.description || '');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Fields state
  const [fields, setFields] = useState<FormField[]>(form.fields || []);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // ─── Drag Handlers ──────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setFields((prev) => {
        const oldIndex = prev.findIndex((f) => f.fieldId === active.id);
        const newIndex = prev.findIndex((f) => f.fieldId === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // ─── Field CRUD ─────────────────────────────────────────────────

  const addField = useCallback((type: FieldType) => {
    const newField: FormField = {
      fieldId: crypto.randomUUID(),
      fieldType: type,
      label: '',
      placeholder: null,
      isRequired: false,
      options: (type === 'select' || type === 'radio') ? [''] : null,
      sortOrder: fields.length,
    };
    setFields((prev) => [...prev, newField]);
    setEditingField(newField);
    setEditorOpen(true);
  }, [fields.length]);

  const editField = useCallback((fieldId: string) => {
    const field = fields.find((f) => f.fieldId === fieldId);
    if (field) {
      setEditingField(field);
      setEditorOpen(true);
    }
  }, [fields]);

  const saveField = useCallback((updated: FormField) => {
    setFields((prev) => prev.map((f) => (f.fieldId === updated.fieldId ? updated : f)));
  }, []);

  const deleteField = useCallback((fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.fieldId !== fieldId));
  }, []);

  // ─── Banner ─────────────────────────────────────────────────────

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Banner image must be under 5MB', 'error');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // ─── Save ───────────────────────────────────────────────────────

  const doSave = async () => {
    // Save form metadata (including custom slug)
    await registrationService.updateForm(form.formId, {
      title: title.trim(),
      slug: slug.trim(),
      description: description || undefined,
    });

    // Save fields
    await registrationService.upsertFields(
      form.formId,
      fields.map((f, i) => ({
        fieldId: f.fieldId,
        fieldType: f.fieldType,
        label: f.label,
        placeholder: f.placeholder,
        isRequired: f.isRequired,
        options: f.options,
        sortOrder: i,
      }))
    );

    // Upload banner if changed
    if (bannerFile) {
      await registrationService.uploadBanner(form.formId, bannerFile);
      setBannerFile(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showNotification('Title is required', 'error');
      return;
    }
    if (!slug.trim()) {
      showNotification('URL slug is required', 'error');
      return;
    }

    // Check that all fields have labels
    const unlabeled = fields.find((f) => !f.label.trim());
    if (unlabeled) {
      showNotification('All fields must have a label', 'error');
      return;
    }

    setSaving(true);
    try {
      await doSave();
      showNotification('Form saved successfully', 'success');
      onSaved();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Error saving form', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Publish / Close ────────────────────────────────────────────

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'published' && fields.length === 0) {
      showNotification('Add at least one field before publishing', 'error');
      return;
    }
    if (!title.trim() || !slug.trim()) {
      showNotification('Title and URL slug are required', 'error');
      return;
    }

    setSaving(true);
    try {
      // Save first, then change status
      await doSave();
      await registrationService.updateFormStatus(form.formId, newStatus);
      showNotification(
        newStatus === 'published'
          ? 'Form published! It is now live.'
          : newStatus === 'closed'
          ? 'Form closed. No more submissions accepted.'
          : 'Form moved back to draft.',
        'success'
      );
      onSaved();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Error changing status', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeField = activeId ? fields.find((f) => f.fieldId === activeId) : null;

  // Compute the banner image to show
  const displayBanner = bannerPreview || (form.bannerImagePath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/registration-forms/${form.bannerImagePath}?v=${Date.now()}`
    : null);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Form Builder</h2>
          <StatusBadge status={form.status} />
        </div>
        <div className="flex items-center gap-2">
          {form.status === 'draft' && (
            <button
              onClick={() => handleStatusChange('published')}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Publish
            </button>
          )}
          {form.status === 'published' && (
            <button
              onClick={() => handleStatusChange('closed')}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
            >
              Close Form
            </button>
          )}
          {form.status === 'closed' && (
            <button
              onClick={() => handleStatusChange('draft')}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Reopen as Draft
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Field Type Selector */}
        <div className="lg:col-span-1">
          <FieldTypeSelector onAdd={addField} />
        </div>

        {/* Right: Form Settings + Fields */}
        <div className="lg:col-span-3 space-y-6">
          {/* Form Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-700">Form Settings</h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Registration Form For Returning Students 2026-2027"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {/* URL Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-sm text-slate-500 whitespace-nowrap">
                  schoolmule.ca/your-school/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                  placeholder="returning-student-registration-2026"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">This is the URL path for the public form. Use lowercase letters, numbers, and hyphens only.</p>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Banner Image</label>
              {displayBanner && (
                <div className="mb-2 relative rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={displayBanner} alt="Banner" className="w-full h-40 object-cover" />
                  <button
                    onClick={async () => {
                      if (form.bannerImagePath) {
                        await registrationService.deleteBanner(form.formId);
                      }
                      setBannerFile(null);
                      setBannerPreview(null);
                      onSaved();
                    }}
                    className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleBannerChange}
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
              />
            </div>

            {/* Description (Rich Text) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Write a description for your form..."
                className="bg-white rounded-lg"
              />
            </div>
          </div>

          {/* Fields List */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Form Fields ({fields.length})
            </h3>

            {fields.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">No fields yet. Click a field type on the left to add one.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.fieldId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <FieldCard
                        key={field.fieldId}
                        field={field}
                        onEdit={editField}
                        onDelete={deleteField}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeField ? (
                    <div className="bg-white rounded-xl border-2 border-cyan-300 p-4 shadow-xl opacity-90">
                      <span className="text-sm font-medium text-slate-900">
                        {activeField.label || 'Untitled Field'}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Field Editor Modal */}
      <FieldEditor
        field={editingField}
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingField(null);
        }}
        onSave={saveField}
      />
    </div>
  );
}
