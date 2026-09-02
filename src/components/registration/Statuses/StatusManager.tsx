'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, LockClosedIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import * as statusService from '@/services/registrationStatusService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { STATUS_COLORS, statusDotClass, statusBadgeClass } from '@/lib/statusColors';
import type { SubmissionStatusDef, StatusColor } from '@/services/types/registrationStatus';

/**
 * Manages the school's submission status vocabulary — the list every form's
 * status dropdown and filter reads from.
 *
 * Built-ins can be relabelled and recoloured but not deleted: submissions store
 * their keys, and 'new' is what the sidebar's unread badge counts.
 */
export default function StatusManager({ onChanged }: { onChanged?: () => void }) {
  const showNotification = useNotificationStore((s) => s.showNotification);

  const [statuses, setStatuses] = useState<SubmissionStatusDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create / edit form
  const [editing, setEditing] = useState<SubmissionStatusDef | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState<StatusColor>('cyan');

  // Delete flow
  const [deleting, setDeleting] = useState<SubmissionStatusDef | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [reassignTo, setReassignTo] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await statusService.getStatuses();
      setStatuses(res.data);
    } catch (err) {
      showNotification((err as Error).message || 'Error loading statuses', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setLabel('');
    setColor('cyan');
    setFormOpen(true);
  };

  const openEdit = (s: SubmissionStatusDef) => {
    setEditing(s);
    setLabel(s.label);
    setColor(s.color);
    setFormOpen(true);
  };

  // Up/down rather than drag-and-drop: the list is short, and arrows are
  // keyboard-reachable and unambiguous where a drag target wouldn't be.
  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= statuses.length) return;

    const next = [...statuses];
    [next[index], next[target]] = [next[target], next[index]];
    setStatuses(next); // optimistic: the reorder should feel instant

    try {
      await statusService.reorderStatuses(next.map((s) => s.statusId));
      onChanged?.();
    } catch (err) {
      showNotification((err as Error).message || 'Error reordering statuses', 'error');
      await load(); // put the list back the way the server has it
    }
  };

  const handleSave = async () => {
    if (!label.trim()) {
      showNotification('A label is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await statusService.updateStatus(editing.statusId, label.trim(), color);
        showNotification('Status updated', 'success');
      } else {
        await statusService.createStatus(label.trim(), color);
        showNotification('Status created', 'success');
      }
      setFormOpen(false);
      await load();
      onChanged?.();
    } catch (err) {
      showNotification((err as Error).message || 'Error saving status', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Look up how many submissions are affected before showing the dialog, so the
  // admin sees the consequence up front rather than after a failed delete.
  const openDelete = async (s: SubmissionStatusDef) => {
    try {
      const res = await statusService.getStatusUsage(s.statusId);
      setUsageCount(res.data.submissionCount);
      setReassignTo(statuses.find((x) => x.statusId !== s.statusId)?.key || '');
      setDeleting(s);
    } catch (err) {
      showNotification((err as Error).message || 'Error checking status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await statusService.deleteStatus(
        deleting.statusId,
        usageCount > 0 ? reassignTo : undefined,
      );
      showNotification(res.message, 'success');
      setDeleting(null);
      await load();
      onChanged?.();
    } catch (err) {
      showNotification((err as Error).message || 'Error deleting status', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-slate-400">
        <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm">Loading statuses...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Submission statuses</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Shared by every form in your school.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Add status
          </button>
        </div>

        <ul className="divide-y divide-slate-50">
          {statuses.map((s, i) => (
            <li key={s.statusId} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex flex-col -my-1 shrink-0">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                  className="p-0.5 text-slate-300 hover:text-cyan-600 disabled:opacity-30 disabled:hover:text-slate-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === statuses.length - 1}
                  title="Move down"
                  className="p-0.5 text-slate-300 hover:text-cyan-600 disabled:opacity-30 disabled:hover:text-slate-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDotClass(s.color)}`} />
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(s.color)}`}>
                {s.label}
              </span>

              <div className="flex items-center gap-2 ml-1 text-xs text-slate-400">
                {s.isDefault && <span title="New submissions start here">default</span>}
                {s.isBuiltin && (
                  <span className="inline-flex items-center gap-1" title="Built in — can be renamed but not deleted">
                    <LockClosedIcon className="w-3 h-3" />
                    built-in
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => openEdit(s)}
                  title="Rename or recolour"
                  className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDelete(s)}
                  disabled={s.isBuiltin}
                  title={s.isBuiltin ? 'Built-in statuses cannot be deleted' : 'Delete'}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Create / edit */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit status' : 'New status'}
        size="md"
      >
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Accepted"
              autoFocus
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {editing?.isBuiltin && (
              <p className="text-xs text-slate-400 mt-1.5">
                This is a built-in status. Renaming it is safe — existing submissions keep their state.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Colour</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className={`w-8 h-8 rounded-full transition-all cursor-pointer ${statusDotClass(c)} ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pt-1">
            <p className="text-xs text-slate-400 mb-1.5">Preview</p>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(color)}`}>
              {label.trim() || 'Status'}
            </span>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={() => setFormOpen(false)}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : editing ? 'Save changes' : 'Create status'}
          </button>
        </div>
      </Modal>

      {/* Delete, with reassignment when the status is in use */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete status" size="md">
        {deleting && (
          <>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-slate-600">
                Delete{' '}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(deleting.color)}`}>
                  {deleting.label}
                </span>
                ?
              </p>

              {usageCount > 0 ? (
                <>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-900">{usageCount}</span>{' '}
                    submission{usageCount === 1 ? '' : 's'} currently use this status. Move{' '}
                    {usageCount === 1 ? 'it' : 'them'} to:
                  </p>
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    {statuses
                      .filter((s) => s.statusId !== deleting.statusId)
                      .map((s) => (
                        <option key={s.statusId} value={s.key}>{s.label}</option>
                      ))}
                  </select>
                </>
              ) : (
                <p className="text-sm text-slate-500">No submissions use this status.</p>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving || (usageCount > 0 && !reassignTo)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting...' : usageCount > 0 ? 'Reassign & delete' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
