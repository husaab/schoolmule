// File: src/components/assessments/section/useAssessmentForm.ts
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  batchUpdateAssessments,
  createAssessment,
  getAssessmentsByClass,
  makeAssessmentCategory,
  moveAssessment,
  updateAssessment,
} from '@/services/assessmentService'
import type {
  AssessmentPayload,
  CreateAssessmentRequest,
} from '@/services/types/assessment'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ON_ITS_OWN, canBecomeCategory } from '@/lib/assessmentGroups'
import { replaceAllMutation } from '@/lib/assessmentMutation'

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
 *
 * Editing an assessment that isn't a category can also regroup it: "Counts
 * toward" moves it into a category, between categories or out on its own
 * (it keeps its points), and "Make this a multiple assessment" turns one that
 * counts on its own into a category whose first item is the assessment
 * itself, scores and all (lib/assessmentGroups).
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
  // Where it counts: ON_ITS_OWN or a category id (edit only, not for a category).
  const [countsToward, setCountsToward] = useState<string>(ON_ITS_OWN)
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
    setCountsToward(assessment.parentAssessmentId || ON_ITS_OWN)

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

  // Editing an assessment that counts on its own, with "multiple" ticked.
  const converting = mode === 'edit' && !!assessment && !assessment.isParent && isParent
  const canConvert = mode === 'edit' && !!assessment && canBecomeCategory(assessment) && countsToward === ON_ITS_OWN

  // "Make this a multiple assessment" while editing: the assessment itself is
  // the first item (its scores stay with it), worth its current points.
  const setMultiple = (checked: boolean) => {
    setIsParent(checked)
    if (mode !== 'edit' || !assessment || assessment.isParent) return
    setChildrenData(
      checked
        ? [{ assessmentId: assessment.assessmentId, name: name.trim() || assessment.name, weightPoints, maxScore, sortOrder: 1, date }]
        : []
    )
  }

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
      if ((mode === 'add' || converting) && activeChildren.length === 0) {
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

  // A category and its items in one transactional call. Previously this
  // deleted removed children, then created new ones, then updated the rest as
  // three separate requests — so a failure after step 1 left the deletions
  // committed with no way back.
  const childrenToDelete = childrenData.filter((child) => child.toDelete && !child.isNew)
  const saveCategory = (categoryId: string) => {
    const newChildren = childrenData.filter((child) => child.isNew && !child.toDelete)
    const existingChildren = childrenData.filter((c) => !c.toDelete && !c.isNew)
    return batchUpdateAssessments({
      deleteIds: childrenToDelete.map((child) => child.assessmentId),
      creates: newChildren.map((newChild) => ({
        classId,
        name: newChild.name.trim(),
        weightPoints: parseFloat(newChild.weightPoints),
        maxScore: parseFloat(newChild.maxScore),
        parentAssessmentId: categoryId,
        sortOrder: newChild.sortOrder,
        isParent: false,
        date: newChild.date || null,
      })),
      updates: [
        {
          assessmentId: categoryId,
          name: name.trim(),
          weightPoints: Number(weightPoints),
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
  }

  // The class's list from the server: after a regroup several rows changed.
  const reloadedList = async (fallback: AssessmentPayload[]) => {
    const res = await getAssessmentsByClass(classId).catch(() => null)
    return res?.status === 'success' ? res.data : fallback
  }

  // An assessment that counts on its own becomes a multiple assessment holding it.
  const submitConvert = async (current: AssessmentPayload) => {
    const made = await makeAssessmentCategory(classId, current.assessmentId)
    const categoryId = made.data?.categoryId
    if (made.status !== 'success' || !categoryId) {
      showNotification(made.message || "It couldn't become a multiple assessment", 'error')
      return
    }
    let saved = false
    try {
      saved = (await saveCategory(categoryId)).status === 'success'
    } catch {
      saved = false
    }
    onSuccess({ ...replaceAllMutation(allAssessments, await reloadedList(made.data.assessments)), needsRefetch: false })
    showNotification(
      saved
        ? `"${name.trim()}" is now a multiple assessment`
        : `"${name.trim()}" is now a multiple assessment, but its items didn't all save. Edit it to try again.`,
      saved ? 'success' : 'error'
    )
  }

  const submitEdit = async () => {
    if (!assessment) return
    const trimmedName = name.trim()
    const parsedWeightPoints = Number(weightPoints)

    if (converting) {
      await submitConvert(assessment)
      return
    }

    if (assessment.isParent && childrenData.length > 0) {
      const res = await saveCategory(assessment.assessmentId)

      if (res.status !== 'success') {
        showNotification(res.message || 'Failed to update assessments', 'error')
        return
      }

      onSuccess({
        updated: [...res.data, ...(res.created ?? [])],
        deletedIds: childrenToDelete.map((c) => c.assessmentId),
        needsRefetch: true,
      })
      showNotification('Assessment updated successfully', 'success')
    } else {
      // Standalone (or an item inside a category) update, then the move if "Counts toward" changed
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
      if (countsToward === (assessment.parentAssessmentId || ON_ITS_OWN)) {
        onSuccess({ updated: [res.data], deletedIds: [], needsRefetch: false })
        showNotification('Assessment updated successfully', 'success')
        return
      }
      const moved = await moveAssessment(classId, assessment.assessmentId, countsToward || null)
      if (moved.status !== 'success') {
        onSuccess({ updated: [res.data], deletedIds: [], needsRefetch: false })
        showNotification(moved.message || "Saved, but it couldn't be moved. Try again.", 'error')
        return
      }
      onSuccess({ ...replaceAllMutation(allAssessments, moved.data.assessments), needsRefetch: false })
      const target = moved.data.assessments.find((a) => a.assessmentId === countsToward)
      showNotification(target ? `"${trimmedName}" now counts toward ${target.name}` : `"${trimmedName}" now counts on its own`, 'success')
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
      // The server's reason (e.g. "Choose one of this class's categories.") beats a generic line.
      showNotification(
        err instanceof Error && err.message ? err.message : `Error ${mode === 'add' ? 'creating' : 'updating'} assessment`,
        'error'
      )
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
    setMultiple,
    converting,
    canConvert,
    countsToward, setCountsToward,
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
