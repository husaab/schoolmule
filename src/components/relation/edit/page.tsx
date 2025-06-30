// File: src/components/relation/edit/EditRelationModal.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getAllParents } from '@/services/parentService';
import { updateParentStudent } from '@/services/parentStudentService';
import type {
  ParentStudentPayload,
  UpdateParentStudentRequest
} from '@/services/types/parentStudent';
import type { ParentPayload } from '@/services/types/parent';

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

  // all parents in the school
  const [parents, setParents] = useState<ParentPayload[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // form fields
  const [search, setSearch] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentNumber, setParentNumber] = useState('');
  const [saving, setSaving] = useState(false);

  // When modal opens, prefill from `relation` and load parents
  useEffect(() => {
    if (!isOpen) return;

    setSearch('');
    setSelectedParentId(relation.parentId ?? null);
    setParentName(relation.parentName ?? '');
    setParentEmail(relation.parentEmail ?? '');
    setParentNumber(relation.parentNumber ?? '');

    setLoadingParents(true);
    getAllParents(relation.school)
      .then(r => {
        if (r.status === 'success' && r.data) {
          setParents(r.data);
        } else {
          showNotification('Failed to load parents', 'error');
        }
      })
      .catch(() => showNotification('Error fetching parents', 'error'))
      .finally(() => setLoadingParents(false));
  }, [isOpen, relation, showNotification]);

  // Filter by name
  const filteredParents = useMemo(() => {
    const q = search.toLowerCase();
    return parents.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    );
  }, [parents, search]);

  // Save handler
  const handleSave = async () => {
    setSaving(true);

    const payload: UpdateParentStudentRequest = {
      parentId:      selectedParentId,
      parentName:    parentName.trim() || null,
      parentEmail:   parentEmail.trim() || null,
      parentNumber:  parentNumber.trim() || null,
      relation:      relation.relation, // unchanged
    };

    try {
      const res = await updateParentStudent(
        relation.parentStudentLinkId,
        payload
      );
      if (res.status === 'success' && res.data) {
        // Look up the selected parent to populate parentUser
        const par = parents.find(p => p.userId === selectedParentId!);
        const updated: ParentStudentPayload = {
          ...res.data,
          student:    relation.student!,          // keep existing student info
          parentUser: par
            ? {
                firstName: par.firstName,
                lastName:  par.lastName,
                email:     par.email,
              }
            : null,
          parentNumber,                           // carry through edited phone
        };
        onUpdated(updated);
        showNotification('Relation updated', 'success');
        onClose();
      } else {
        showNotification(res.message || 'Failed to update', 'error');
      }
    } catch {
      showNotification('Error updating relation', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl mb-4 text-black">Edit Parent-Student Relation</h2>
      <p className="text-black mb-4">
        Student:{' '}
        <strong>
          {relation.student?.name} (Grade {relation.student?.grade})
        </strong>
      </p>

      {/* Parent selector */}
      <div className="space-y-4 text-black">
        <div>
          <label className="block text-sm font-medium mb-1">Parent</label>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <div className="max-h-36 overflow-y-auto border rounded-lg p-2 bg-white">
            {loadingParents ? (
              <p className="text-gray-600">Loading…</p>
            ) : filteredParents.length === 0 ? (
              <p className="text-gray-600">No parents found.</p>
            ) : (
              filteredParents.map(p => (
                <div key={p.userId} className="flex items-center mb-1">
                  <input
                    type="radio"
                    id={`par-${p.userId}`}
                    name="parent"
                    value={p.userId}
                    checked={selectedParentId === p.userId}
                    onChange={() => {
                      setSelectedParentId(p.userId);
                      setParentName(`${p.firstName} ${p.lastName}`);
                      setParentEmail(p.email);
                      // leave parentNumber untouched or clear if you prefer:
                      // setParentNumber('');
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={`par-${p.userId}`} className="text-black">
                    {p.firstName} {p.lastName} ({p.email})
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fallback contact info */}
        <div>
          <label className="block text-sm">Parent Name</label>
          <input
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Parent Email</label>
          <input
            type="email"
            value={parentEmail}
            onChange={e => setParentEmail(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Parent Phone</label>
          <input
            value={parentNumber}
            onChange={e => setParentNumber(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditRelationModal;
