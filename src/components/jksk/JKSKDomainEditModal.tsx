'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  updateJKSKDomain,
  createJKSKSkill,
  updateJKSKSkill,
  deleteJKSKSkill,
} from '@/services/jkskService'
import type { JKSKDomain, JKSKSkill } from '@/services/types/jksk'
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'

interface JKSKDomainEditModalProps {
  isOpen: boolean
  onClose: () => void
  domain: JKSKDomain
  onUpdate: () => void
}

interface EditingSkill {
  skillId: string | null // null = new skill
  name: string
  description: string
  sortOrder: number
}

export default function JKSKDomainEditModal({
  isOpen,
  onClose,
  domain,
  onUpdate,
}: JKSKDomainEditModalProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)

  // Domain name editing
  const [domainName, setDomainName] = useState(domain.name)
  const [isEditingDomainName, setIsEditingDomainName] = useState(false)
  const [savingDomainName, setSavingDomainName] = useState(false)

  // Skill being added/edited inline
  const [editingSkill, setEditingSkill] = useState<EditingSkill | null>(null)
  const [savingSkill, setSavingSkill] = useState(false)
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null)

  // Reset state when domain changes
  useEffect(() => {
    setDomainName(domain.name)
    setIsEditingDomainName(false)
    setEditingSkill(null)
  }, [domain])

  const handleSaveDomainName = async () => {
    if (!domainName.trim()) return
    setSavingDomainName(true)
    try {
      const res = await updateJKSKDomain(domain.domainId, {
        name: domainName.trim(),
        sortOrder: domain.sortOrder,
      })
      if (res.status === 'success') {
        showNotification('Domain name updated', 'success')
        setIsEditingDomainName(false)
        onUpdate()
      }
    } catch {
      showNotification('Failed to update domain name', 'error')
    } finally {
      setSavingDomainName(false)
    }
  }

  const handleStartAddSkill = () => {
    setEditingSkill({
      skillId: null,
      name: '',
      description: '',
      sortOrder: domain.skills.length + 1,
    })
  }

  const handleStartEditSkill = (skill: JKSKSkill) => {
    setEditingSkill({
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description || '',
      sortOrder: skill.sortOrder,
    })
  }

  const handleSaveSkill = async () => {
    if (!editingSkill || !editingSkill.name.trim()) return
    setSavingSkill(true)
    try {
      if (editingSkill.skillId) {
        // Update existing
        const res = await updateJKSKSkill(editingSkill.skillId, {
          name: editingSkill.name.trim(),
          description: editingSkill.description.trim() || null,
          sortOrder: editingSkill.sortOrder,
        })
        if (res.status === 'success') {
          showNotification('Skill updated', 'success')
        }
      } else {
        // Create new
        const res = await createJKSKSkill({
          domainId: domain.domainId,
          name: editingSkill.name.trim(),
          description: editingSkill.description.trim() || null,
          sortOrder: editingSkill.sortOrder,
        })
        if (res.status === 'success') {
          showNotification('Skill added', 'success')
        }
      }
      setEditingSkill(null)
      onUpdate()
    } catch {
      showNotification('Failed to save skill', 'error')
    } finally {
      setSavingSkill(false)
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    setDeletingSkillId(skillId)
    try {
      const res = await deleteJKSKSkill(skillId)
      if (res.status === 'success') {
        showNotification('Skill deleted', 'success')
        onUpdate()
      }
    } catch {
      showNotification('Failed to delete skill', 'error')
    } finally {
      setDeletingSkillId(null)
    }
  }

  const documentTypeLabel =
    domain.documentType === 'progress_report' ? 'Progress Report' : 'Report Card'
  const scaleLabel =
    domain.documentType === 'progress_report' ? 'D / B / I / N' : 'BG / DV / NI'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Domain — ${documentTypeLabel}`} size="lg">
      <div className="p-6 space-y-6">
        {/* Domain Name */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Domain Name
          </label>
          {isEditingDomainName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDomainName()
                  if (e.key === 'Escape') {
                    setDomainName(domain.name)
                    setIsEditingDomainName(false)
                  }
                }}
              />
              <button
                onClick={handleSaveDomainName}
                disabled={savingDomainName || !domainName.trim()}
                className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {savingDomainName ? <Spinner size="sm" /> : <CheckIcon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setDomainName(domain.name)
                  setIsEditingDomainName(false)
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{domain.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Scale: {scaleLabel}</p>
              </div>
              <button
                onClick={() => setIsEditingDomainName(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Skills List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Skills ({domain.skills.length})
            </label>
            <button
              onClick={handleStartAddSkill}
              disabled={!!editingSkill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add Skill
            </button>
          </div>

          <div className="space-y-2">
            {domain.skills.map((skill) =>
              editingSkill?.skillId === skill.skillId ? (
                /* Inline edit form for existing skill */
                <div
                  key={skill.skillId}
                  className="p-3 border-2 border-purple-200 bg-purple-50 rounded-xl space-y-2"
                >
                  <input
                    type="text"
                    value={editingSkill.name}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, name: e.target.value })
                    }
                    placeholder="Skill name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                  {domain.documentType === 'report_card' && (
                    <input
                      type="text"
                      value={editingSkill.description}
                      onChange={(e) =>
                        setEditingSkill({ ...editingSkill, description: e.target.value })
                      }
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingSkill(null)}
                      className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSkill}
                      disabled={savingSkill || !editingSkill.name.trim()}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {savingSkill ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Read-only skill row */
                <div
                  key={skill.skillId}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{skill.name}</p>
                    {skill.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {skill.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEditSkill(skill)}
                      disabled={!!editingSkill}
                      className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      title="Edit skill"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(skill.skillId)}
                      disabled={deletingSkillId === skill.skillId}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      title="Delete skill"
                    >
                      {deletingSkillId === skill.skillId ? (
                        <Spinner size="sm" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            )}

            {/* New skill inline form (appears at bottom when adding) */}
            {editingSkill?.skillId === null && (
              <div className="p-3 border-2 border-emerald-200 bg-emerald-50 rounded-xl space-y-2">
                <input
                  type="text"
                  value={editingSkill.name}
                  onChange={(e) =>
                    setEditingSkill({ ...editingSkill, name: e.target.value })
                  }
                  placeholder="New skill name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editingSkill.name.trim()) handleSaveSkill()
                    if (e.key === 'Escape') setEditingSkill(null)
                  }}
                />
                {domain.documentType === 'report_card' && (
                  <input
                    type="text"
                    value={editingSkill.description}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, description: e.target.value })
                    }
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingSkill(null)}
                    className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSkill}
                    disabled={savingSkill || !editingSkill.name.trim()}
                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {savingSkill ? 'Saving...' : 'Add Skill'}
                  </button>
                </div>
              </div>
            )}

            {domain.skills.length === 0 && !editingSkill && (
              <div className="text-center py-6 text-slate-400 text-sm">
                No skills yet. Click &ldquo;Add Skill&rdquo; to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
