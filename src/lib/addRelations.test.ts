import { describe, it, expect, vi } from 'vitest'
import { addRelationForEach, addRelationsSummary } from './addRelations'
import type { ParentStudentPayload, ParentStudentResponse } from '@/services/types/parentStudent'

const adam = { studentId: 's1', name: 'Adam Test' }
const lina = { studentId: 's2', name: 'Lina Test' }
const sara = { studentId: 's3', name: 'Sara Test' }

const linkFor = (studentId: string): ParentStudentPayload => ({
  parentStudentLinkId: `link-${studentId}`,
  studentId,
  relation: 'Mother',
  school: 'TEST',
  createdAt: '2026-11-09',
})
const ok = (studentId: string): ParentStudentResponse => ({ status: 'success', data: linkFor(studentId) })

describe('addRelationForEach', () => {
  it('adds the relation for every student, in the order picked', async () => {
    const create = vi.fn(async (s: typeof adam) => ok(s.studentId))
    const { added, failed } = await addRelationForEach([adam, lina, sara], create)
    expect(create.mock.calls.map(([s]) => s.studentId)).toEqual(['s1', 's2', 's3'])
    expect(added.map((a) => a.relation.parentStudentLinkId)).toEqual(['link-s1', 'link-s2', 'link-s3'])
    expect(added[1].student).toBe(lina)
    expect(failed).toEqual([])
  })

  it('carries on past a student the server refuses', async () => {
    const create = vi.fn(async (s: typeof adam) => {
      if (s === lina) throw new Error('Parent-student relation already exists')
      return ok(s.studentId)
    })
    const { added, failed } = await addRelationForEach([adam, lina, sara], create)
    expect(added.map((a) => a.student)).toEqual([adam, sara])
    expect(failed).toEqual([{ student: lina, message: 'Parent-student relation already exists' }])
  })

  it('counts a "failed" answer as a failure, with a fallback message', async () => {
    const { added, failed } = await addRelationForEach([adam, lina], async (s) =>
      s === adam ? { status: 'failed', message: 'Student or parent not found' } : { status: 'failed' }
    )
    expect(added).toEqual([])
    expect(failed).toEqual([
      { student: adam, message: 'Student or parent not found' },
      { student: lina, message: 'Failed to add relation' },
    ])
  })
})

describe('addRelationsSummary', () => {
  const taken = 'Parent-student relation already exists'

  it('keeps the one-student wording', () => {
    expect(addRelationsSummary(1, [])).toBe('Relation added')
    expect(addRelationsSummary(0, [{ student: adam, message: taken }])).toBe(taken)
  })

  it('counts several students', () => {
    expect(addRelationsSummary(3, [])).toBe('3 relations added')
  })

  it('says who was left out and why when only some went through', () => {
    expect(addRelationsSummary(2, [{ student: lina, message: taken }])).toBe(`Added 2 of 3. Lina Test: ${taken}`)
  })

  it('names everyone when none went through', () => {
    expect(
      addRelationsSummary(0, [
        { student: adam, message: taken },
        { student: lina, message: taken },
      ])
    ).toBe(`Adam Test, Lina Test: ${taken}`)
  })

  it('groups students by reason', () => {
    expect(
      addRelationsSummary(1, [
        { student: adam, message: taken },
        { student: lina, message: 'Student or parent not found' },
        { student: sara, message: taken },
      ])
    ).toBe(`Added 1 of 4. Adam Test, Sara Test: ${taken}. Lina Test: Student or parent not found`)
  })
})
