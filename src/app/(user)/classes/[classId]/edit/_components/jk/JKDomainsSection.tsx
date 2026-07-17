// File: src/app/(user)/classes/[classId]/edit/_components/jk/JKDomainsSection.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { getJKDomains, deleteJKDomain } from '@/services/jkService'
import type { JKDomain } from '@/services/types/jk'
import JKDomainEditModal from '@/components/jk/JKDomainEditModal'
import JKDomainAddModal from '@/components/jk/JKDomainAddModal'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getGradeDisplayName, GradeValue } from '@/lib/schoolUtils'
import Spinner from '@/components/Spinner'
import {
  AcademicCapIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface JKDomainsSectionProps {
  school: string
  grade: GradeValue
}

const JKDomainsSection: React.FC<JKDomainsSectionProps> = ({ school, grade }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [jkProgressDomains, setJkProgressDomains] = useState<JKDomain[]>([])
  const [jkReportCardDomains, setJkReportCardDomains] = useState<JKDomain[]>([])
  const [jkDomainsLoading, setJkDomainsLoading] = useState(false)
  const [editingDomain, setEditingDomain] = useState<JKDomain | null>(null)
  const [addDomainType, setAddDomainType] = useState<'progress_report' | 'report_card' | null>(null)
  const [deletingDomainId, setDeletingDomainId] = useState<string | null>(null)

  const refreshJKDomains = async () => {
    if (!school) return
    setJkDomainsLoading(true)
    try {
      const [prRes, rcRes] = await Promise.all([
        getJKDomains('progress_report', school),
        getJKDomains('report_card', school),
      ])
      const prDomains = prRes.status === 'success' ? prRes.data : []
      const rcDomains = rcRes.status === 'success' ? rcRes.data : []
      setJkProgressDomains(prDomains)
      setJkReportCardDomains(rcDomains)

      // Update the editing domain with fresh data if modal is open
      if (editingDomain) {
        const allDomains = [...prDomains, ...rcDomains]
        const updated = allDomains.find(d => d.domainId === editingDomain.domainId)
        if (updated) {
          setEditingDomain(updated)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setJkDomainsLoading(false)
    }
  }

  useEffect(() => {
    refreshJKDomains()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school])

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Delete this domain and all its skills?')) return
    setDeletingDomainId(domainId)
    try {
      const res = await deleteJKDomain(domainId)
      if (res.status === 'success') {
        showNotification('Domain deleted', 'success')
        refreshJKDomains()
      }
    } catch {
      showNotification('Failed to delete domain', 'error')
    } finally {
      setDeletingDomainId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white cursor-pointer hover:from-purple-600 hover:to-violet-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <ClipboardDocumentListIcon className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold">Skill Domains</span>
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
            {jkProgressDomains.length + jkReportCardDomains.length} domains
          </span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 transform transition-transform duration-200 ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className="p-6 space-y-6">
          {jkDomainsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <AcademicCapIcon className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-700">
                  <p className="font-medium mb-1">Skill-based grading for {getGradeDisplayName(grade)}</p>
                  <p className="text-purple-600">These domains and skills are used for progress reports and report cards. To enter ratings for students, open the gradebook.</p>
                </div>
              </div>

              {/* Progress Report Domains */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Progress Report Domains
                    <span className="text-xs font-normal normal-case text-slate-400">(D / B / I / N)</span>
                  </h3>
                  <button
                    onClick={() => setAddDomainType('progress_report')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 cursor-pointer transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add Domain
                  </button>
                </div>
                {jkProgressDomains.length > 0 ? (
                  <div className="space-y-3">
                    {jkProgressDomains.map((domain) => (
                      <div key={domain.domainId} className="border border-slate-100 rounded-xl overflow-hidden group">
                        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50">
                          <span className="font-medium text-slate-800 text-sm">{domain.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{domain.skills.length} skills</span>
                            <button
                              onClick={() => setEditingDomain(domain)}
                              className="px-2.5 py-1 bg-white text-cyan-600 border border-cyan-200 rounded-lg text-xs font-medium hover:bg-cyan-50 cursor-pointer transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDomain(domain.domainId)}
                              disabled={deletingDomainId === domain.domainId}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            >
                              {deletingDomainId === domain.domainId ? (
                                <Spinner size="sm" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {domain.skills.map((skill) => (
                            <div key={skill.skillId} className="px-4 py-2 text-sm text-slate-600">
                              {skill.name}
                            </div>
                          ))}
                          {domain.skills.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-400 italic">No skills — click Edit to add</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                    No progress report domains yet
                  </div>
                )}
              </div>

              {/* Report Card Domains */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Report Card Domains
                    <span className="text-xs font-normal normal-case text-slate-400">(BG / DV / NI)</span>
                  </h3>
                  <button
                    onClick={() => setAddDomainType('report_card')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 cursor-pointer transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add Domain
                  </button>
                </div>
                {jkReportCardDomains.length > 0 ? (
                  <div className="space-y-3">
                    {jkReportCardDomains.map((domain) => (
                      <div key={domain.domainId} className="border border-slate-100 rounded-xl overflow-hidden group">
                        <div className="flex items-center justify-between px-4 py-3 bg-blue-50">
                          <span className="font-medium text-slate-800 text-sm">{domain.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{domain.skills.length} skills</span>
                            <button
                              onClick={() => setEditingDomain(domain)}
                              className="px-2.5 py-1 bg-white text-cyan-600 border border-cyan-200 rounded-lg text-xs font-medium hover:bg-cyan-50 cursor-pointer transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDomain(domain.domainId)}
                              disabled={deletingDomainId === domain.domainId}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            >
                              {deletingDomainId === domain.domainId ? (
                                <Spinner size="sm" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {domain.skills.map((skill) => (
                            <div key={skill.skillId} className="px-4 py-2 text-sm text-slate-600 flex justify-between items-start">
                              <span className="font-medium">{skill.name}</span>
                              {skill.description && (
                                <span className="text-xs text-slate-400 ml-4 text-right max-w-[50%]">{skill.description}</span>
                              )}
                            </div>
                          ))}
                          {domain.skills.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-400 italic">No skills — click Edit to add</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                    No report card domains yet
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─ JK Domain Edit Modal ─ */}
      {editingDomain && (
        <JKDomainEditModal
          isOpen={!!editingDomain}
          onClose={() => setEditingDomain(null)}
          domain={editingDomain}
          onUpdate={() => {
            refreshJKDomains()
          }}
        />
      )}

      {/* ─ JK Domain Add Modal ─ */}
      {addDomainType && (
        <JKDomainAddModal
          isOpen={!!addDomainType}
          onClose={() => setAddDomainType(null)}
          documentType={addDomainType}
          school={school}
          currentCount={addDomainType === 'progress_report' ? jkProgressDomains.length : jkReportCardDomains.length}
          onAdded={() => refreshJKDomains()}
        />
      )}
    </div>
  )
}

export default JKDomainsSection
