'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../../shared/modal';
import RelationFormFields, { useRelationForm } from '../RelationFormFields';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getAllParents } from '@/services/parentService';
import { updateParentStudent } from '@/services/parentStudentService';
import type {
  ParentStudentPayload,
  UpdateParentStudentRequest,
} from '@/services/types/parentStudent';
import type { ParentPayload } from '@/services/types/parent';
import { getGradeDisplayName } from '@/lib/schoolUtils';
import { UserIcon } from '@heroicons/react/24/outline';

interface EditRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  relation: ParentStudentPayload;
  onUpdated: (updated: ParentStudentPayload) => void;
}

const EditRelationModal: React.FC<EditRelationModalProps> = ({
  isOpen,
  onClose,
  relation,
  onUpdated,
}) => {
  const showNotification = useNotificationStore(s => s.showNotification);

  const [parents, setParents] = useState<ParentPayload[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const { form, setForm, relationValue, validate, buildParentFields, buildParentUser } =
    useRelationForm(relation);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoadingParents(true);
    getAllParents()
      .then(r => {
        if (r.status === 'success' && r.data) setParents(r.data);
        else showNotification('Failed to load parents', 'error');
      })
      .catch(() => showNotification('Error fetching parents', 'error'))
      .finally(() => setLoadingParents(false));
  }, [isOpen, showNotification]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      return showNotification(error, 'error');
    }

    const payload: UpdateParentStudentRequest = {
      relation: relationValue(),
      ...buildParentFields(),
    };

    setSaving(true);
    try {
      const res = await updateParentStudent(relation.parentStudentLinkId, payload);
      if (res.status === 'success' && res.data) {
        const updated: ParentStudentPayload = {
          ...res.data,
          student: relation.student,
          parentUser: buildParentUser(),
        };
        onUpdated(updated);
        showNotification('Relation updated', 'success');
        onClose();
      } else {
        showNotification(res.message || 'Failed to update', 'error');
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error updating relation', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Relation" size="lg">
      <form onSubmit={handleSave} className="p-6 space-y-5">
        {/* Student (fixed) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-cyan-700" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-900 truncate">
                {relation.student?.name || 'Unknown Student'}
              </span>
              <span className="block text-xs text-slate-500">
                {getGradeDisplayName(relation.student?.grade)}
              </span>
            </span>
          </div>
        </div>

        <RelationFormFields
          form={form}
          setForm={setForm}
          parents={parents}
          loadingParents={loadingParents}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditRelationModal;
