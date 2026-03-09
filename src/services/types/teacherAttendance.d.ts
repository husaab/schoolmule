export interface TodayStatusResponse {
  status: string;
  data: {
    checkedIn: boolean;
    status: string | null;
  };
}

export interface CheckInResponse {
  status: string;
  data: {
    teacherId: string;
    attendanceDate: string;
    status: string;
  };
}

export interface AttendanceRecord {
  attendanceDate: string;
  status: "PRESENT" | "ABSENT";
}

export interface MyMonthResponse {
  status: string;
  data: {
    records: AttendanceRecord[];
    workingDays: number;
    presentDays: number;
    absentDays: number;
  };
}

export interface TeacherAttendanceData {
  teacherId: string;
  firstName: string;
  lastName: string;
  username: string;
  records: AttendanceRecord[];
}

export interface AllTeachersResponse {
  status: string;
  data: {
    teachers: TeacherAttendanceData[];
    workingDays: number;
  };
}

export interface UpdateRecordResponse {
  status: string;
  data: {
    teacherId: string;
    attendanceDate: string;
    status: string;
  };
}
