// src/components/classes/classwork/TopicFormModal.tsx
// Create a topic, or rename one (Classwork's Create → Topic, a topic's ⋮ →
// Rename, and the item form's "New topic…"). A name is 1 to 80 characters.
'use client'

import { useState } from 'react'
import { FolderIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader, inputClass } from '@/components/shared/modalKit'
import { createTopic, updateTopic } from '@/services/classworkService'
import type { Topic } from '@/services/types/classwork'
import { useNotificationStore } from '@/store/useNotificationStore'

const NAME_MAX = 80

interface TopicFormModalProps {
  isOpen: boolean
  classId: string
  /** The topic to rename; null creates one. */
  topic: Topic | null
  onClose: () => void
  onSaved: (topic: Topic) => void
}

function TopicForm({ classId, topic, onClose, onSaved }: Omit<TopicFormModalProps, 'isOpen'>) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [name, setName] = useState(topic?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trimmed = name.trim()

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!trimmed) {
      setError('Give the topic a name')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = topic ? await updateTopic(topic.topicId, { name: trimmed }) : await createTopic(classId, trimmed)
      showNotification(topic ? 'Topic renamed' : `${res.data.name} added`, 'success')
      onSaved(res.data)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "The topic couldn't be saved.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save}>
      <ModalHeader
        title={topic ? 'Rename topic' : 'New topic'}
        subtitle={topic ? topic.name : 'Group classwork by unit or theme, e.g. "Unit 2 · Cells".'}
        icon={FolderIcon}
      />
      <ModalBody>
        <div>
          <label htmlFor="topic-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="topic-name"
            autoFocus
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="e.g. Unit 2 · Cells"
            className={inputClass}
            aria-invalid={error ? true : undefined}
          />
          {error && <p className="mt-1 text-xs text-rose-700">{error}</p>}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={!trimmed || trimmed === topic?.name}>
          {topic ? 'Save' : 'Add topic'}
        </Button>
      </ModalFooter>
    </form>
  )
}

export default function TopicFormModal({ isOpen, onClose, ...rest }: TopicFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      {/* Keyed so every open starts from the topic's current name. */}
      {isOpen && <TopicForm key={rest.topic?.topicId ?? 'new'} onClose={onClose} {...rest} />}
    </Modal>
  )
}
