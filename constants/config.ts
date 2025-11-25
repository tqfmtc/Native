export const API_CONFIG = {
  BASE_URL: 'https://api.tqfmohallatuitioncenters.in/api',
  ENDPOINTS: {
    TUTOR_LOGIN: '/auth/tutor/login',
    TUTOR:'/tutors/:id',
    STUDENT: '/students/:id',
    CREATESTUDENT: '/students/',
    MARKSTUDENTATTENDANCE: '/students/markDailyAttendance',
    BUTTONSTATUS: '/attendance/buttonStatus',
    ATTENDANCE: '/tutors/attendance',
    ATTENDANCE_RECENT: '/attendance/recent',
    ANNOUNCEMENTS: '/announcements/',
    VERSION_CHECK: '/native/version-check',
    STUDENT_SUBJECTS_BY_STUDENT: '/student-subjects/student/:studentId',
    STUDENT_SUBJECT_UPDATE: '/update/student-subjects/:studentId/:subjectId',
    STUDENT_SUBJECT_DELETE: '/delete/student-subjects/:studentId/:subjectId',
    STUDENT_SUBJECT_ADD_MARKS: '/student-subjects/marks/:studentId/:subjectId'
  }
};

export const APP_CONFIG = {
  ATTENDANCE_RADIUS: 20, // meters
  LOGIN_PERSISTENCE_DAYS: 36500, // ~100 years: effectively "never ask to login again"
  APP_VERSION: '2.0.0' // Current app version
};