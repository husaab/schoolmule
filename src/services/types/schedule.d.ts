export interface ScheduleEntry {
  schedule_id: string;
  school: string;
  grade: number;
  subject: string;
  teacher_name: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_lunch: boolean;
  lunch_supervisor?: string;
  week_start_date: string;
  created_at: string;
  updated_at: string;
}