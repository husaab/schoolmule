// The whole-school timetable moved out of the admin panel so teachers can
// reach it too. Old bookmarks land here and are sent on.

import { redirect } from 'next/navigation'
import { SCHOOL_SCHEDULE_PATH } from '@/components/schedulePlanner/myScheduleUtils'

export default function LegacySchoolSchedulePage() {
  redirect(SCHOOL_SCHEDULE_PATH)
}
