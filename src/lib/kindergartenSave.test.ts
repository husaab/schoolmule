import { describe, it, expect, vi } from 'vitest'
import {
  applyKindergartenChange,
  kindergartenKey,
  loadAfterPendingSaves,
  openSKDocument,
  saveJKDocument,
  saveSKDocument,
  type KindergartenDoc,
  type KindergartenFields,
  type KindergartenSnapshot,
  type OpenedKindergartenDoc,
  type SKSaveApi,
} from './kindergartenSave'
import { createAutosaver } from './scoreAutosaver'

const snap = (over: Partial<KindergartenSnapshot> = {}): KindergartenSnapshot => ({
  studentId: 'k1',
  term: 'Term 1',
  doc: 'progress_report',
  school: 'DEMO',
  assessedBy: 'u1',
  ratings: { sk1: 'D', sk2: '', sk3: 'B' },
  comments: { d1: 'Counts to 20.', d2: '   ' },
  learningSkills: { Responsibility: 'G', Organization: '' },
  teacherAssistant: '',
  progressComments: { academic_achievement: 'Growing reader.', socio_emotional: '' },
  ...over,
})

// Records every call in order, answering like the services do.
function recorder() {
  const calls: [string, unknown, unknown][] = []
  const fn = (name: string) => vi.fn(async (payload: unknown, opts: unknown) => {
    calls.push([name, payload, opts])
    return { status: 'success' }
  })
  return { calls, fn }
}

describe('saveJKDocument: the same calls and payloads the JK Save button sent', () => {
  const api = (fn: (n: string) => ReturnType<typeof vi.fn>) => ({
    assessments: fn('assessments'),
    progressComments: fn('progressComments'),
    domainComments: fn('domainComments'),
    learningSkills: fn('learningSkills'),
    teacherAssistant: fn('teacherAssistant'),
  })

  it('progress report: rated skills, then the non-empty section comments', async () => {
    const { calls, fn } = recorder()
    await saveJKDocument(snap(), api(fn))
    expect(calls).toEqual([
      ['assessments', [
        { studentId: 'k1', skillId: 'sk1', term: 'Term 1', rating: 'D', school: 'DEMO', assessedBy: 'u1' },
        { studentId: 'k1', skillId: 'sk3', term: 'Term 1', rating: 'B', school: 'DEMO', assessedBy: 'u1' },
      ], {}],
      ['progressComments', [
        { studentId: 'k1', term: 'Term 1', sectionType: 'academic_achievement', comment: 'Growing reader.', school: 'DEMO' },
      ], {}],
    ])
  })

  it('report card: rated skills, domain comments, learning skills, then the teacher assistant (always)', async () => {
    const { calls, fn } = recorder()
    await saveJKDocument(snap({ doc: 'report_card' }), api(fn))
    expect(calls.map((c) => c[0])).toEqual(['assessments', 'domainComments', 'learningSkills', 'teacherAssistant'])
    expect(calls[1][1]).toEqual([{ studentId: 'k1', domainId: 'd1', term: 'Term 1', comment: 'Counts to 20.', school: 'DEMO' }])
    expect(calls[2][1]).toEqual([{ studentId: 'k1', term: 'Term 1', skillName: 'Responsibility', rating: 'G', school: 'DEMO' }])
    expect(calls[3][1]).toEqual({ studentId: 'k1', teacherAssistantName: null, term: 'Term 1', school: 'DEMO' })
  })

  it('skips an empty list, as Save did', async () => {
    const { calls, fn } = recorder()
    await saveJKDocument(snap({ ratings: { sk1: '' }, progressComments: {} }), api(fn))
    expect(calls).toEqual([])
  })
})

describe('saveSKDocument: the same calls and payloads the SK Save button sent', () => {
  const api = (fn: (n: string) => ReturnType<typeof vi.fn>) => ({
    assessments: fn('assessments'),
    subjectComments: fn('subjectComments'),
    progressComments: fn('progressComments'),
    teacherAssistant: fn('teacherAssistant'),
  })

  it('progress report: rated standards, subject comments, then section comments', async () => {
    const { calls, fn } = recorder()
    await saveSKDocument(snap({ ratings: { st1: 'E' }, comments: { sub1: 'Loves art.' } }), api(fn))
    expect(calls).toEqual([
      ['assessments', [{ studentId: 'k1', standardId: 'st1', term: 'Term 1', rating: 'E', school: 'DEMO', assessedBy: 'u1' }], {}],
      ['subjectComments', [{ studentId: 'k1', subjectId: 'sub1', term: 'Term 1', comment: 'Loves art.', school: 'DEMO' }], {}],
      ['progressComments', [{ studentId: 'k1', term: 'Term 1', sectionType: 'academic_achievement', comment: 'Growing reader.', school: 'DEMO' }], {}],
    ])
  })

  it('report card: rated standards, subject comments, then the teacher assistant', async () => {
    const { calls, fn } = recorder()
    await saveSKDocument(snap({ doc: 'report_card', ratings: {}, comments: {}, teacherAssistant: 'Rana Kareem' }), api(fn))
    expect(calls).toEqual([
      ['teacherAssistant', { studentId: 'k1', teacherAssistantName: 'Rana Kareem', term: 'Term 1', school: 'DEMO' }, {}],
    ])
  })
})

describe('leaving the page', () => {
  it('a keepalive save sends every call at once (none waits behind another)', async () => {
    const started: string[] = []
    const never = (name: string) => vi.fn(() => {
      started.push(name)
      return new Promise(() => {})
    })
    void saveJKDocument(snap({ doc: 'report_card', teacherAssistant: 'Rana Kareem' }), {
      assessments: never('assessments'),
      progressComments: never('progressComments'),
      domainComments: never('domainComments'),
      learningSkills: never('learningSkills'),
      teacherAssistant: never('teacherAssistant'),
    }, { keepalive: true })
    await Promise.resolve()
    expect(started).toEqual(['assessments', 'domainComments', 'learningSkills', 'teacherAssistant'])
  })

  it('keys a document by student and document', () => {
    expect(kindergartenKey('k1', 'report_card')).toBe('k1|report_card')
  })
})

describe('applyKindergartenChange: a change lands only in the document it was made for', () => {
  const open = {
    readyKey: 'k1|report_card',
    fields: { ratings: { s1: 'BG' }, comments: { d1: 'Old.' }, learningSkills: {}, teacherAssistant: 'Sami Haddad', progressComments: {} },
  }

  it('merges a change made for the open, loaded document', () => {
    expect(applyKindergartenChange(open, 'k1|report_card', { comments: { d1: 'New.' } })).toEqual({ ...open.fields, comments: { d1: 'New.' } })
  })

  it('drops an AI comment that arrives after the teacher switched student (or document)', () => {
    expect(applyKindergartenChange(open, 'k2|report_card', { comments: { d1: 'For k2.' } })).toBeNull()
    expect(applyKindergartenChange(open, 'k1|progress_report', { comments: { d1: 'For the other document.' } })).toBeNull()
  })

  it('drops a change while the document is still loading (nothing is ready yet)', () => {
    expect(applyKindergartenChange({ ...open, readyKey: null }, 'k1|report_card', { teacherAssistant: '' })).toBeNull()
    expect(applyKindergartenChange(open, null, { teacherAssistant: '' })).toBeNull()
  })
})

describe('loadAfterPendingSaves: a document is read only after earlier edits have saved', () => {
  it('SK subject comments edited on one document are saved before the other document reads them', async () => {
    const server = { subjectComment: 'Old.' }
    const autosaver = createAutosaver<{ comment: string }, void>({
      save: async (batch) => {
        await new Promise((r) => setTimeout(r, 5))
        server.subjectComment = batch[batch.length - 1][1].comment
      },
    })
    autosaver.queue('k1|progress_report', { comment: 'Loves painting.' })
    // The teacher switches to the report card at once: it must read the new comment.
    const read = await loadAfterPendingSaves(() => autosaver.flush(), async () => server.subjectComment)
    expect(read).toBe('Loves painting.')
  })
})

describe('openSKDocument: SK subject comments are shared by both documents', () => {
  const EMPTY: KindergartenFields = { ratings: {}, comments: {}, learningSkills: {}, teacherAssistant: '', progressComments: {} }

  // One SK class on a fake server: subject comments by student and subject,
  // written and read by both documents. The autosaver saves each document with
  // the Save button's own calls (saveSKDocument).
  function setup() {
    const server = { comments: { k1: { sub1: 'Old.' }, k2: { sub1: 'Draws.' } } as Record<string, Record<string, string>>, down: false }
    const reachable = () => {
      if (server.down) throw new Error('Network down')
    }
    const api: SKSaveApi = {
      assessments: async () => reachable(),
      subjectComments: async (entries) => {
        reachable()
        for (const e of entries) server.comments[e.studentId][e.subjectId] = e.comment ?? ''
      },
      progressComments: async () => reachable(),
      teacherAssistant: async () => reachable(),
    }
    const autosaver = createAutosaver<KindergartenSnapshot, void>({
      save: async (batch, opts) => {
        for (const [, s] of batch) await saveSKDocument(s, api, opts)
      },
    })
    const open = (studentId: string, doc: KindergartenDoc) =>
      openSKDocument(studentId, doc, autosaver, async () => ({ ...EMPTY, comments: { ...server.comments[studentId] } }))
    const edit = (studentId: string, doc: KindergartenDoc, fields: KindergartenFields) =>
      autosaver.queue(kindergartenKey(studentId, doc), { studentId, term: 'Term 1', doc, school: 'DEMO', assessedBy: 'u1', ...fields })
    return { server, autosaver, open, edit }
  }

  const fieldsOf = (opened: OpenedKindergartenDoc): KindergartenFields => {
    if (opened.state !== 'ready') throw new Error(`expected the document to open, got ${JSON.stringify(opened)}`)
    return opened.fields
  }

  it('a failed report card save, then Retry from the progress report and an edit there, keeps the retried comment', async () => {
    const { server, autosaver, open, edit } = setup()

    // 1. The teacher rewrites a subject comment on the report card; its save fails.
    const rc = fieldsOf(await open('k1', 'report_card'))
    expect(rc.comments).toEqual({ sub1: 'Old.' })
    server.down = true
    edit('k1', 'report_card', { ...rc, comments: { sub1: 'New.' } })
    await autosaver.flush()
    expect(Object.keys(autosaver.getState().failed)).toEqual(['k1|report_card'])
    server.down = false

    // 2. They switch to the progress report.
    let pr = await open('k1', 'progress_report')

    // 3. They press Retry there (the page opens a waiting document again once
    //    the retry has run).
    const retried = autosaver.retry()
    if (pr.state === 'blocked') pr = await open('k1', 'progress_report')
    await retried
    expect(server.comments.k1.sub1).toBe('New.')

    // 4. They edit the progress report (a rating), which saves the whole document.
    edit('k1', 'progress_report', { ...fieldsOf(pr), ratings: { st1: 'E' } })
    await autosaver.flush()

    expect(server.comments.k1.sub1).toBe('New.')
  })

  it("waits while the other document's save has failed, and opens on the saved comment after Discard", async () => {
    const { server, autosaver, open, edit } = setup()
    server.down = true
    edit('k1', 'report_card', { ...EMPTY, comments: { sub1: 'New.' } })
    await autosaver.flush()
    server.down = false

    expect(await open('k1', 'progress_report')).toEqual({ state: 'blocked', by: 'report_card' })
    autosaver.discard()
    expect(fieldsOf(await open('k1', 'progress_report')).comments).toEqual({ sub1: 'Old.' })
  })

  it("the document whose save failed opens on the teacher's unsaved version", async () => {
    const { server, autosaver, open, edit } = setup()
    server.down = true
    edit('k1', 'report_card', { ...EMPTY, comments: { sub1: 'New.' }, teacherAssistant: 'Rana Kareem' })
    await autosaver.flush()

    expect(fieldsOf(await open('k1', 'report_card'))).toEqual({ ...EMPTY, comments: { sub1: 'New.' }, teacherAssistant: 'Rana Kareem' })
  })

  it('a Retry pressed while the document is being read still opens on the retried version', async () => {
    const { server, autosaver, edit } = setup()
    server.down = true
    edit('k1', 'report_card', { ...EMPTY, comments: { sub1: 'New.' } })
    await autosaver.flush()
    server.down = false

    const opened = await openSKDocument('k1', 'report_card', autosaver, async () => {
      const read = { ...EMPTY, comments: { ...server.comments.k1 } } // read before the retried save lands
      await autosaver.retry()
      return read
    })
    expect(fieldsOf(opened).comments).toEqual({ sub1: 'New.' })
  })

  it("another student's failed save does not hold this student's documents", async () => {
    const { server, autosaver, open, edit } = setup()
    server.down = true
    edit('k2', 'report_card', { ...EMPTY, comments: { sub1: 'Paints.' } })
    await autosaver.flush()
    server.down = false

    expect(fieldsOf(await open('k1', 'progress_report')).comments).toEqual({ sub1: 'Old.' })
  })

  it('a document opens only after an edit to the other one has landed', async () => {
    const { server, open, edit } = setup()
    edit('k1', 'progress_report', { ...EMPTY, comments: { sub1: 'Loves painting.' } })
    expect(fieldsOf(await open('k1', 'report_card')).comments).toEqual({ sub1: 'Loves painting.' })
    expect(server.comments.k1.sub1).toBe('Loves painting.')
  })
})
