# School Mule - Full System Documentation

## Project Overview
School Mule is a comprehensive school management system with separate frontend and backend components.

**Frontend**: Next.js application (`/mnt/c/Users/husse/OneDrive/Desktop/Github/schoolmule`)
**Backend**: Separate Node.js API (`/mnt/c/Users/husse/OneDrive/Desktop/Github/schoolmule-backend`)
**Database**: Supabase PostgreSQL

## Database Schema (Supabase)

### Core Tables

#### users
- **Primary Key**: `user_id` (UUID)
- **Fields**: school, email, role, username, password, first_name, last_name, email_token, is_verified, school_token, is_verified_school
- **Purpose**: Authentication and user management for teachers/administrators

#### students
- **Primary Key**: `student_id` (UUID)
- **Fields**: name, homeroom_teacher_id, grade, oen, mother_name, mother_email, mother_number, father_name, father_email, father_number, emergency_contact, school
- **Foreign Keys**: homeroom_teacher_id → users(user_id)
- **Purpose**: Student profile and contact information

#### classes
- **Primary Key**: `class_id` (UUID)
- **Fields**: school, grade, subject, homeroom_teacher_name, teacher_name, teacher_id
- **Foreign Keys**: teacher_id → users(user_id)
- **Purpose**: Class/course definitions

#### class_students
- **Primary Key**: (class_id, student_id)
- **Purpose**: Many-to-many relationship between classes and students

### Scheduling System

#### schedules
- **Primary Key**: `schedule_id` (UUID)
- **Fields**: grade, day_of_week, start_time, end_time, subject, teacher_name, is_lunch, lunch_supervisor, school, week_start_date
- **Purpose**: Weekly class schedules with time blocks
- **Note**: Currently updated to support 1-hour time blocks (8 AM - 5 PM)

### Assessment & Grading

#### assessments
- **Primary Key**: `assessment_id` (UUID)
- **Fields**: class_id, name, weight_percent
- **Foreign Keys**: class_id → classes(class_id)
- **Purpose**: Assessment definitions for classes

#### student_assessments
- **Primary Key**: (student_id, assessment_id)
- **Fields**: score
- **Purpose**: Individual student assessment scores

### Attendance System

#### class_attendance
- **Primary Key**: (class_id, student_id, attendance_date)
- **Fields**: status (attendance_status enum)
- **Purpose**: Class-specific attendance tracking

#### general_attendance
- **Primary Key**: (student_id, attendance_date)
- **Fields**: status, school
- **Purpose**: General school attendance tracking

### Report Cards

#### report_cards
- **Primary Key**: (student_id, term)
- **Fields**: student_name, file_path, generated_at, grade
- **Purpose**: Generated report card storage

#### report_card_feedback
- **Primary Key**: (student_id, class_id, term)
- **Fields**: work_habits, behavior, comment
- **Purpose**: Teacher feedback for report cards

### Security

#### password_reset_tokens
- **Primary Key**: `token` (UUID)
- **Fields**: user_id, expires_at
- **Purpose**: Password reset functionality

## Custom Types (Enums)

- **school**: Enum for different schools
- **GRADE**: Enum for grade levels (1-8)
- **role**: User roles (teacher, admin, etc.)
- **attendance_status**: Attendance statuses (present, absent, late, etc.)

## Frontend Structure

### Key Components
- **Schedule System**: `ScheduleGrid.tsx`, `ScheduleWeekView.tsx`
  - Supports dynamic time blocks with precise positioning
  - Handles overlapping schedules and partial coverage
  - Recently updated to use 1-hour blocks instead of 45-minute blocks

### Services Layer
- API clients for each domain (authService, classService, scheduleService, etc.)
- Type definitions in `services/types/`

### State Management
- Zustand stores for user state and notifications

## Development Commands
- `npm run dev`: Start development server
- `npm run lint`: Code linting
- `npm run build`: Production build

## Backend Architecture

### Technology Stack
- **Framework**: Express.js with Node.js
- **Database**: PostgreSQL via Supabase
- **Authentication**: JWT tokens, bcrypt for passwords
- **Security**: Rate limiting, CORS, request validation
- **Utilities**: Puppeteer for PDFs, Resend for emails, ExcelJS for exports

### API Structure
```
/api/auth          - Authentication (login, signup, password reset)
/api/users         - User management  
/api/students      - Student CRUD operations
/api/classes       - Class management
/api/assessments   - Assessment definitions
/api/studentAssessments - Individual student scores
/api/attendance    - Class and general attendance
/api/report-cards  - Report card generation
/api/schedules     - Schedule management
/api/dashboard     - Dashboard data aggregation
/api/teachers      - Teacher-specific operations
```

### Key Features
- **Middleware**: Authentication verification for protected routes
- **Logging**: Structured logging with Pino
- **PDF Generation**: Puppeteer for report cards
- **Email**: Resend service for notifications
- **Validation**: Express-validator for input validation
- **Rate Limiting**: 1000 requests per minute

### Schedule API Endpoints
- `GET /api/schedules?school=X&week=Y` - Get all schedules
- `GET /api/schedules/grade/:grade?school=X&week=Y` - Get by grade
- `POST /api/schedules` - Create schedule
- `PATCH /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

## Memory Persistence
**IMPORTANT**: Claude Code doesn't retain information between sessions. This `CLAUDE.md` file serves as persistent memory. Always reference this file when working on the School Mule system.

## Notes for Future Development
- Backend project located at: `/mnt/c/Users/husse/OneDrive/Desktop/Github/schoolmule-backend`
- Schedule system recently enhanced to support variable-length time blocks
- Database uses UUIDs for all primary keys
- Foreign key relationships maintain referential integrity with CASCADE deletes where appropriate
- Backend uses structured MVC pattern: routes → controllers → queries → database