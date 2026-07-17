// File: src/components/assessments/section/useAssessmentForm.ts
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  batchUpdateAssessments,
  createAssessment,
  deleteAssessment,
  updateAssessment,
} from '@/services/assessmentService'
import type {
  AssessmentPayload,
  CreateAssessmentRequest,
} from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'

export interface AssessmentMutation {
  updated: AssessmentPayload[]
  deletedIds: string[]
  /** True after a parent edit (multi-request sequence) — a soft refetch is a good safety net */
  needsRefetch: boolean
}

export interface ChildDraft {
  assessmentId: string // `temp-…` until persisted
  name: string
  weightPoints: string
  maxScore: string
  sortOrder: number
  date: string
  isNew?: boolean
  toDelete?: boolean
}

interface UseAssessmentFormArgs {
  mode: 'add' | 'edit'
  classId: string
  /** Required when mode === 'edit' */
  assessment?: AssessmentPayload
  /** Used to derive existing children when editing a parent */
  allAssessments: AssessmentPayload[]
  onSuccess: (result: AssessmentMutation) => void
}

let tempIdCounter = 0
const nextTempId = () => `temp-${Date.now()}-${tempIdCounter++}`

/**
 * Shared state + validation + submit logic behind the inline assessment form.
 * This is the only place on the class edit page that writes assessments —
 * weightPercent is deprecated and intentionally never written here.
 */
export function useAssessmentForm({
  mode,
  classId,
  assessment,
  allAssessments,
  onSuccess,
}: UseAssessmentFormArgs) {
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [name, setName] = useState('')
  // Kept as strings so clearing an input doesn't snap to 0
  const [weightPoints, setWeightPoints] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('')
  // Once the teacher edits max score directly, stop mirroring weight points into it
  const [maxScoreTouched, setMaxScoreTouched] = useState(false)
  const [date, setDate] = useState<string>('')
  const [isParent, setIsParent] = useState(false)
  const [childrenData, setChildrenData] = useState<ChildDraft[]>([])
  const [childPointsError, setChildPointsError] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Prefill when editing
  useEffect(() => {
    if (mode !== 'edit' || !assessment) return
    setName(assessment.name)
    setWeightPoints(String(assessment.weightPoints || assessment.weightPercent || 0))
    setMaxScore(String(assessment.maxScore || ''))
    setMaxScoreTouched(true)
    setDate(assessment.date ? assessment.date.split('T')[0] : '')
    setIsParent(assessment.isParent)

    if (assessment.isParent) {
      const childAssessments = allAssessments.filter(
        (a) => a.parentAssessmentId === assessment.assessmentId
      )
      setChildrenData(
        childAssessments
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map((child) => ({
            assessmentId: child.assessmentId,
            name: child.name,
            weightPoints: String(child.weightPoints || child.weightPercent || 0),
            maxScore: String(child.maxScore || 100),
            sortOrder: child.sortOrder || 0,
            date: child.date ? child.date.split('T')[0] : '',
          }))
      )
    } else {
      setChildrenData([])
    }
    setChildPointsError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, assessment?.assessmentId])

  // Clear children when un-checking "multiple" (add mode only)
  useEffect(() => {
    if (mode === 'add' && !isParent) {
      setChildrenData([])
    }
  }, [mode, isParent])

  const activeChildren = useMemo(
    () => childrenData.filter((child) => !child.toDelete),
    [childrenData]
  )

  // Validate child points against parent points
  useEffect(() => {
    if (isParent && activeChildren.length > 0 && weightPoints) {
      const parentPoints = parseFloat(weightPoints) || 0
      const totalChildPoints = activeChildren.reduce(
        (sum, child) => sum + (parseFloat(child.weightPoints) || 0),
        0
      )

      if (totalChildPoints - parentPoints > 0.03) {
        setChildPointsError(
          `Individual points total ${totalChildPoints.toFixed(1)} (must not exceed parent ${parentPoints})`
        )
      } else if (Math.abs(totalChildPoints - parentPoints) > 0.03) {
        setChildPointsError(
          `Individual points total ${totalChildPoints.toFixed(1)} (should equal parent ${parentPoints})`
        )
      } else {
        setChildPointsError('')
      }
    } else {
      setChildPointsError('')
    }
  }, [isParent, activeChildren, weightPoints])

  const addChild = () => {
    setChildrenData((prev) => [
      ...prev,
      {
        assessmentId: nextTempId(),
        name: mode === 'add' ? `${name.trim() || 'Assessment'} ${prev.length + 1}` : '',
        weightPoints: '0',
        maxScore: '100',
        sortOrder: prev.length + 1,
        date, // parent's date as default
        isNew: true,
      },
    ])
  }

  const updateChild = (childId: string, field: keyof ChildDraft, value: string) => {
    setChildrenData((prev) =>
      prev.map((c) => (c.assessmentId === childId ? { ...c, [field]: value } : c))
    )
  }

  const removeChild = (childId: string) => {
    setChildrenData((prev) => {
      const child = prev.find((c) => c.assessmentId === childId)
      if (!child) return prev
      if (child.isNew) {
        return prev.filter((c) => c.assessmentId !== childId)
      }
      return prev.map((c) => (c.assessmentId === childId ? { ...c, toDelete: true } : c))
    })
  }

  const distributeEqually = () => {
    const parentPoints = parseFloat(weightPoints) || 0
    const equalPoints =
      activeChildren.length > 0 ? (parentPoints / activeChildren.length).toFixed(2) : '0'
    setChildrenData((prev) =>
      prev.map((child) => (child.toDelete ? child : { ...child, weightPoints: equalPoints }))
    )
  }

  const validate = (): boolean => {
    const trimmedName = name.trim()
    const parsedWeightPoints = Number(weightPoints)
    const parsedMaxScore = Number(maxScore)

    if (!trimmedName || weightPoints === '' || isNaN(parsedWeightPoints)) {
      showNotification('Name and points are required', 'error')
      return false
    }
    if (!isParent && (maxScore === '' || isNaN(parsedMaxScore))) {
      showNotification('Maximum score is required for standalone assessments', 'error')
      return false
    }
    if (parsedWeightPoints <= 0) {
      showNotification('Points must be greater than 0', 'error')
      return false
    }
    if (!isParent && parsedMaxScore <= 0) {
      showNotification('Maximum score must be greater than 0', 'error')
      return false
    }

    if (isParent) {
      if (mode === 'add' && activeChildren.length === 0) {
        showNotification('Multiple assessments must have individual assessments', 'error')
        return false
      }
      if (activeChildren.some((child) => !child.name.trim())) {
        showNotification('All individual assessment names are required', 'error')
        return false
      }
      if (
        activeChildren.some(
          (child) =>
            !child.maxScore.trim() ||
            isNaN(Number(child.maxScore)) ||
            Number(child.maxScore) <= 0
        )
      ) {
        showNotification('All individual assessments must have valid maximum scores', 'error')
        return false
      }
      if (childPointsError) {
        showNotification(childPointsError, 'error')
        return false
      }
    }
    return true
  }

  const submitAdd = async () => {
    const trimmedName = name.trim()
    const payload: CreateAssessmentRequest = {
      classId,
      name: trimmedName,
      weightPoints: Number(weightPoints),
      maxScore: isParent ? null : Number(maxScore),
      date: date || null,
      isParent,
      ...(isParent && {
        childCount: activeChildren.length,
        childrenData: activeChildren.map((child, index) => ({
          name: child.name.trim(),
          weightPoints: parseFloat(child.weightPoints),
          maxScore: parseFloat(child.maxScore),
          sortOrder: index + 1,
          date: child.date || null,
        })),
      }),
    }

    const res = await createAssessment(payload)
    if (res.status !== 'success') {
      showNotification(res.message || 'Failed to add assessment', 'error')
      return
    }

    if (isParent && 'parent' in res.data) {
      const { parent, children } = res.data
      onSuccess({ updated: [parent, ...children], deletedIds: [], needsRefetch: false })
      showNotification(
        `Multiple assessment "${trimmedName}" created with ${children.length} individual assessments`,
        'success'
      )
    } else {
      onSuccess({
        updated: [res.data as AssessmentPayload],
        deletedIds: [],
        needsRefetch: false,
      })
      showNotification('Assessment added successfully', 'success')
    }
  }

  const submitEdit = async () => {
    if (!assessment) return
    const trimmedName = name.trim()
    const parsedWeightPoints = Number(weightPoints)

    if (assessment.isParent && childrenData.length > 0) {
      const childrenToDelete = childrenData.filter((child) => child.toDelete && !child.isNew)
      const newChildren = childrenData.filter((child) => child.isNew && !child.toDelete)

      // Step 1: delete removed children
      for (const child of childrenToDelete) {
        try {
          await deleteAssessment(child.assessmentId)
        } catch (err) {
          console.error('Error deleting child assessment:', err)
          showNotification(`Failed to delete assessment "${child.name}"`, 'error')
          return
        }
      }

      // Step 2: create new children
      const createdChildren: AssessmentPayload[] = []
      for (const newChild of newChildren) {
        try {
          const createRes = await createAssessment({
            classId: assessment.classId,
            name: newChild.name.trim(),
            weightPoints: parseFloat(newChild.weightPoints),
            maxScore: parseFloat(newChild.maxScore),
            parentAssessmentId: assessment.assessmentId,
            sortOrder: newChild.sortOrder,
            isParent: false,
            date: newChild.date || null,
          })
          if (createRes.status === 'success') {
            createdChildren.push(createRes.data as AssessmentPayload)
          } else {
            showNotification(`Failed to create assessment "${newChild.name}"`, 'error')
            return
          }
        } catch (err) {
          console.error('Error creating child assessment:', err)
          showNotification(`Failed to create assessment "${newChild.name}"`, 'error')
          return
        }
      }

      // Step 3: batch update parent + remaining existing children
      const existingChildren = childrenData.filter((c) => !c.toDelete && !c.isNew)
      const res = await batchUpdateAssessments({
        updates: [
          {
            assessmentId: assessment.assessmentId,
            name: trimmedName,
            weightPoints: parsedWeightPoints,
            maxScore: undefined, // parents have no max score
            date: date || null,
          },
          ...existingChildren.map((child) => ({
            assessmentId: child.assessmentId,
            name: child.name.trim(),
            weightPoints: parseFloat(child.weightPoints),
            maxScore: parseFloat(child.maxScore),
            sortOrder: child.sortOrder,
            date: child.date || null,
          })),
        ],
      })

      if (res.status !== 'success') {
        showNotification(res.message || 'Failed to update assessments', 'error')
        return
      }

      onSuccess({
        updated: [...res.data, ...createdChildren],
        deletedIds: childrenToDelete.map((c) => c.assessmentId),
        needsRefetch: true,
      })
      showNotification('Assessment updated successfully', 'success')
    } else {
      // Standalone update
      const res = await updateAssessment(assessment.assessmentId, {
        name: trimmedName,
        weightPoints: parsedWeightPoints,
        maxScore: Number(maxScore),
        date: date || null,
      })
      if (res.status !== 'success') {
        showNotification(res.message || 'Failed to update assessment', 'error')
        return
      }
      onSuccess({ updated: [res.data], deletedIds: [], needsRefetch: false })
      showNotification('Assessment updated successfully', 'success')
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (submitting || !validate()) return
    setSubmitting(true)
    try {
      if (mode === 'add') await submitAdd()
      else await submitEdit()
    } catch (err) {
      console.error(`Error ${mode === 'add' ? 'creating' : 'updating'} assessment:`, err)
      showNotification(`Error ${mode === 'add' ? 'creating' : 'updating'} assessment`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    // field state
    name, setName,
    weightPoints,
    setWeightPointsMirrored: (value: string) => {
      setWeightPoints(value)
      if (!maxScoreTouched) setMaxScore(value)
    },
    maxScore,
    setMaxScoreTouchedValue: (value: string) => {
      setMaxScore(value)
      setMaxScoreTouched(true)
    },
    date, setDate,
    isParent, setIsParent,
    // children
    childrenData,
    activeChildren,
    addChild,
    updateChild,
    removeChild,
    distributeEqually,
    childPointsError,
    // submit
    submitting,
    handleSubmit,
  }
}
