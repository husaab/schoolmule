// src/lib/classroomFeatures.ts
// Classroom features that ship in later tasks. Quizzes stay out of the Create
// menu until the quiz builder and player exist (Task 24 flips this).

export const QUIZZES_ENABLED = false

// The grading view's "Messages about this work" panel needs Task 17's item
// thread routes (GET/POST /api/classroom/items/:itemId/students/:studentId/thread).
// Until that backend lands the panel is shown but inert; flip this once it does.
export const ITEM_THREADS_ENABLED = false
