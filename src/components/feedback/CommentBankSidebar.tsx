'use client'

import React, { useState } from 'react'
import { XMarkIcon, ClipboardDocumentIcon, ChevronRightIcon, ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export interface CommentBankSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onInsertPhrase: (phrase: string, field: 'workHabits' | 'behavior' | 'comment') => void
  activeField?: 'workHabits' | 'behavior' | 'comment' | null
}

interface PhraseCategory {
  label: string
  field: 'workHabits' | 'behavior' | 'comment'
  phrases: string[]
}

const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    label: 'Work Habits',
    field: 'workHabits',
    phrases: [
      'Demonstrates excellent organizational skills',
      'Consistently completes work on time',
      'Works well independently',
      'Shows strong attention to detail',
      'Takes pride in their work',
      'Needs reminders to stay on task',
      'Would benefit from improved time management',
      'Sometimes rushes through assignments',
      'Working on following directions more carefully',
      'Makes good use of class time',
      'Prepares well for class activities',
      'Brings all required materials to class',
    ]
  },
  {
    label: 'Behavior',
    field: 'behavior',
    phrases: [
      'Demonstrates respect for peers and teachers',
      'Positive attitude and enthusiasm',
      'Helpful and cooperative in class',
      'Shows excellent self-control',
      'Participates actively in discussions',
      'Leads by example',
      'A role model for others',
      'Needs encouragement to participate',
      'Working on impulse control',
      'Sometimes disrupts others',
      'Making progress with social skills',
      'Responds well to guidance',
    ]
  },
  {
    label: 'General Comments',
    field: 'comment',
    phrases: [
      'A pleasure to have in class',
      'Shows strong academic progress',
      'Demonstrates leadership qualities',
      'Eager to learn and ask questions',
      'Has shown remarkable improvement',
      'Keep up the great work!',
      'Looking forward to continued growth',
      'Would benefit from extra practice',
      'Encouraged to seek help when needed',
      'Shows great potential',
      'Continues to meet expectations',
      'A dedicated and hardworking student',
    ]
  }
]

const CommentBankSidebar: React.FC<CommentBankSidebarProps> = ({
  isOpen,
  onToggle,
  onInsertPhrase,
  activeField
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(activeField || 'workHabits')

  // Filter phrases by search query
  const getFilteredPhrases = (phrases: string[]) => {
    if (!searchQuery) return phrases
    return phrases.filter(p =>
      p.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handlePhraseClick = (phrase: string, field: 'workHabits' | 'behavior' | 'comment') => {
    onInsertPhrase(phrase, field)
    setCopiedPhrase(phrase)
    setTimeout(() => setCopiedPhrase(null), 1500)
  }

  // Update expanded category when activeField changes
  React.useEffect(() => {
    if (activeField) {
      setExpandedCategory(activeField)
    }
  }, [activeField])

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-2 py-4 rounded-l-xl shadow-lg hover:from-cyan-600 hover:to-teal-600 transition-all cursor-pointer"
          title="Open Comment Bank"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="sr-only">Open Comment Bank</span>
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 shadow-2xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-gradient-to-r from-cyan-500 to-teal-500">
          <div className="flex items-center gap-2 text-white">
            <ClipboardDocumentIcon className="w-5 h-5" />
            <h3 className="font-semibold">Comment Bank</h3>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phrases..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
          {activeField && (
            <p className="mt-2 text-xs text-slate-500">
              Click a phrase to insert into the focused field
            </p>
          )}
        </div>

        {/* Categories */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {PHRASE_CATEGORIES.map((category) => {
            const filteredPhrases = getFilteredPhrases(category.phrases)
            const isExpanded = expandedCategory === category.field
            const isActiveCategory = activeField === category.field

            return (
              <div key={category.field} className="border-b border-slate-100">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.field)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    isActiveCategory ? 'bg-cyan-50' : ''
                  }`}
                >
                  <span className={`font-medium text-sm ${isActiveCategory ? 'text-cyan-700' : 'text-slate-700'}`}>
                    {category.label}
                    {isActiveCategory && (
                      <span className="ml-2 text-xs text-cyan-500">(active)</span>
                    )}
                  </span>
                  <ChevronRightIcon
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1">
                    {filteredPhrases.length === 0 ? (
                      <p className="text-sm text-slate-400 py-2 text-center">
                        No matching phrases
                      </p>
                    ) : (
                      filteredPhrases.map((phrase, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePhraseClick(phrase, category.field)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                            copiedPhrase === phrase
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        >
                          {copiedPhrase === phrase ? 'Inserted!' : phrase}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer tip */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            Tip: Click any cell first, then click a phrase to insert it
          </p>
        </div>
      </div>

      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  )
}

export default CommentBankSidebar
