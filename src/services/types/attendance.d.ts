export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
}

export interface GeneralAttendanceRequest {
  attendanceDate: string; // yyyy-mm-dd
  entries: AttendanceEntry[];
}

export interface ClassAttendanceRequest extends GeneralAttendanceRequest {
  classId: string;
}

export interface AttendanceResponse {
  status: string;
  message?: string;
}

export interface GetAttendanceResponse {
  status: string;
  data: AttendanceEntry[];
}
