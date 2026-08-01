-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('MOTHER', 'FATHER', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AcademicPeriodType" AS ENUM ('ACADEMIC_YEAR', 'SEMESTER', 'TERM', 'SUMMER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AcademicPeriodStatus" AS ENUM ('PLANNED', 'CURRENT', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('RECRUITING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'TRANSFERRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('REGULAR', 'REVIEW', 'TEST', 'SPEAKING_PRACTICE', 'FINAL');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'LESSON_CANCELLED');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('ASSIGNED', 'COMPLETED', 'PARTIALLY_COMPLETED', 'NOT_COMPLETED', 'CHECKED');

-- CreateEnum
CREATE TYPE "WordProgressStatus" AS ENUM ('NEW', 'LEARNING', 'NEEDS_REVIEW', 'MASTERED', 'CONFIDENT');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ProgressLevel" AS ENUM ('SIGNIFICANT', 'STABLE', 'SMALL', 'NO_VISIBLE_CHANGE', 'NEEDS_ATTENTION');

-- CreateEnum
CREATE TYPE "LearningEventType" AS ENUM ('STUDENT_CREATED', 'PARENT_LINKED', 'PARENT_UNLINKED', 'GROUP_ENROLLED', 'GROUP_TRANSFERRED', 'GROUP_COMPLETED', 'TEACHER_CHANGED', 'BOOK_CHANGED', 'LEVEL_CHANGED', 'UNIT_COMPLETED', 'TEST_COMPLETED', 'REVIEW_PUBLISHED', 'STUDENT_ARCHIVED', 'STUDENT_RESTORED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'ARCHIVE', 'RESTORE', 'LINK', 'UNLINK', 'TRANSFER', 'PUBLISH');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bio" TEXT,
    "hiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "preferredContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" DATE,
    "startedAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "currentLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student_relations" (
    "id" UUID NOT NULL,
    "parentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "parent_student_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL,
    "ageFrom" INTEGER,
    "ageTo" INTEGER,
    "recommendedDurationMonths" INTEGER,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "level" TEXT NOT NULL,
    "description" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_books" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "grammarGoals" TEXT,
    "vocabularyGoals" TEXT,
    "recommendedLessonCount" INTEGER,
    "order" INTEGER NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AcademicPeriodType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "AcademicPeriodStatus" NOT NULL DEFAULT 'PLANNED',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "courseId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "academicPeriodId" UUID NOT NULL,
    "capacity" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" "GroupStatus" NOT NULL DEFAULT 'RECRUITING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_group_assignments" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "startedAt" DATE NOT NULL,
    "endedAt" DATE,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_group_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_group_enrollments" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "startedAt" DATE NOT NULL,
    "endedAt" DATE,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "transferReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_group_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "academicPeriodId" UUID NOT NULL,
    "lessonDate" TIMESTAMP(3) NOT NULL,
    "lessonType" "LessonType" NOT NULL DEFAULT 'REGULAR',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "studiedContent" TEXT,
    "grammar" TEXT,
    "parentComment" TEXT,
    "internalTeacherComment" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "comment" TEXT,
    "markedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homeworks" (
    "id" UUID NOT NULL,
    "lessonId" UUID,
    "groupId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "bookId" UUID,
    "bookName" TEXT,
    "page" TEXT,
    "exercises" TEXT,
    "description" TEXT NOT NULL,
    "dueDate" DATE,
    "attachmentUrl" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_homework_statuses" (
    "id" UUID NOT NULL,
    "homeworkId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "HomeworkStatus" NOT NULL DEFAULT 'ASSIGNED',
    "teacherComment" TEXT,
    "checkedAt" TIMESTAMP(3),
    "checkedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_homework_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_words" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "lessonId" UUID,
    "english" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "example" TEXT,
    "learnedAt" DATE,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "vocabulary_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_word_progress" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "wordId" UUID NOT NULL,
    "status" "WordProgressStatus" NOT NULL DEFAULT 'NEW',
    "teacherComment" TEXT,
    "assessedAt" TIMESTAMP(3),
    "assessedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_word_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "testDate" DATE NOT NULL,
    "maxScore" DECIMAL(8,2) NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" UUID NOT NULL,
    "testId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "score" DECIMAL(8,2) NOT NULL,
    "maxScore" DECIMAL(8,2) NOT NULL,
    "teacherComment" TEXT,
    "assessedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_skill_categories" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "skillCategoryId" UUID NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "course_skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_result_skill_scores" (
    "id" UUID NOT NULL,
    "testResultId" UUID NOT NULL,
    "skillCategoryId" UUID NOT NULL,
    "score" DECIMAL(8,2) NOT NULL,
    "maxScore" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_result_skill_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_assessments" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "academicPeriodId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_skill_scores" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "skillCategoryId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "teacherComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_skill_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_reviews" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "academicPeriodId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "achievements" TEXT,
    "improvements" TEXT,
    "recommendations" TEXT,
    "generalComment" TEXT,
    "progressLevel" "ProgressLevel" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "teacher_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_history_events" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "eventType" "LearningEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "actorUserId" UUID,
    "groupId" UUID,
    "teacherId" UUID,
    "bookId" UUID,
    "unitId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "previousData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_history_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousData" JSONB,
    "newData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "users_archivedAt_idx" ON "users"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON "teacher_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_userId_key" ON "parent_profiles"("userId");

-- CreateIndex
CREATE INDEX "students_status_archivedAt_idx" ON "students"("status", "archivedAt");

-- CreateIndex
CREATE INDEX "students_lastName_firstName_idx" ON "students"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "parent_student_relations_parentId_archivedAt_idx" ON "parent_student_relations"("parentId", "archivedAt");

-- CreateIndex
CREATE INDEX "parent_student_relations_studentId_archivedAt_idx" ON "parent_student_relations"("studentId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_key" ON "courses"("name");

-- CreateIndex
CREATE INDEX "courses_status_archivedAt_idx" ON "courses"("status", "archivedAt");

-- CreateIndex
CREATE INDEX "books_status_archivedAt_idx" ON "books"("status", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "books_name_publisher_key" ON "books"("name", "publisher");

-- CreateIndex
CREATE INDEX "course_books_bookId_idx" ON "course_books"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "course_books_courseId_bookId_key" ON "course_books"("courseId", "bookId");

-- CreateIndex
CREATE INDEX "units_bookId_status_idx" ON "units"("bookId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "units_bookId_order_key" ON "units"("bookId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "units_bookId_name_key" ON "units"("bookId", "name");

-- CreateIndex
CREATE INDEX "topics_unitId_status_idx" ON "topics"("unitId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "topics_unitId_order_key" ON "topics"("unitId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "topics_unitId_name_key" ON "topics"("unitId", "name");

-- CreateIndex
CREATE INDEX "academic_periods_status_isCurrent_idx" ON "academic_periods"("status", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "academic_periods_name_startDate_endDate_key" ON "academic_periods"("name", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "groups_status_archivedAt_idx" ON "groups"("status", "archivedAt");

-- CreateIndex
CREATE INDEX "groups_courseId_academicPeriodId_idx" ON "groups"("courseId", "academicPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_academicPeriodId_key" ON "groups"("name", "academicPeriodId");

-- CreateIndex
CREATE INDEX "teacher_group_assignments_teacherId_isCurrent_idx" ON "teacher_group_assignments"("teacherId", "isCurrent");

-- CreateIndex
CREATE INDEX "teacher_group_assignments_groupId_isCurrent_idx" ON "teacher_group_assignments"("groupId", "isCurrent");

-- CreateIndex
CREATE INDEX "student_group_enrollments_studentId_status_idx" ON "student_group_enrollments"("studentId", "status");

-- CreateIndex
CREATE INDEX "student_group_enrollments_groupId_status_idx" ON "student_group_enrollments"("groupId", "status");

-- CreateIndex
CREATE INDEX "lessons_groupId_lessonDate_idx" ON "lessons"("groupId", "lessonDate");

-- CreateIndex
CREATE INDEX "lessons_teacherId_lessonDate_idx" ON "lessons"("teacherId", "lessonDate");

-- CreateIndex
CREATE INDEX "lessons_status_archivedAt_idx" ON "lessons"("status", "archivedAt");

-- CreateIndex
CREATE INDEX "attendance_studentId_createdAt_idx" ON "attendance"("studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_lessonId_studentId_key" ON "attendance"("lessonId", "studentId");

-- CreateIndex
CREATE INDEX "homeworks_groupId_dueDate_idx" ON "homeworks"("groupId", "dueDate");

-- CreateIndex
CREATE INDEX "homeworks_archivedAt_idx" ON "homeworks"("archivedAt");

-- CreateIndex
CREATE INDEX "student_homework_statuses_studentId_status_idx" ON "student_homework_statuses"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_homework_statuses_homeworkId_studentId_key" ON "student_homework_statuses"("homeworkId", "studentId");

-- CreateIndex
CREATE INDEX "vocabulary_words_archivedAt_idx" ON "vocabulary_words"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_words_topicId_english_key" ON "vocabulary_words"("topicId", "english");

-- CreateIndex
CREATE INDEX "student_word_progress_studentId_status_idx" ON "student_word_progress"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_word_progress_studentId_wordId_key" ON "student_word_progress"("studentId", "wordId");

-- CreateIndex
CREATE INDEX "tests_status_archivedAt_idx" ON "tests"("status", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tests_groupId_title_testDate_key" ON "tests"("groupId", "title", "testDate");

-- CreateIndex
CREATE INDEX "test_results_studentId_createdAt_idx" ON "test_results"("studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_testId_studentId_key" ON "test_results"("testId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_code_key" ON "skill_categories"("code");

-- CreateIndex
CREATE INDEX "skill_categories_isActive_archivedAt_idx" ON "skill_categories"("isActive", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_order_key" ON "skill_categories"("order");

-- CreateIndex
CREATE UNIQUE INDEX "course_skill_categories_courseId_skillCategoryId_key" ON "course_skill_categories"("courseId", "skillCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "course_skill_categories_courseId_order_key" ON "course_skill_categories"("courseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "test_result_skill_scores_testResultId_skillCategoryId_key" ON "test_result_skill_scores"("testResultId", "skillCategoryId");

-- CreateIndex
CREATE INDEX "monthly_assessments_groupId_year_month_idx" ON "monthly_assessments"("groupId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_assessments_studentId_year_month_groupId_key" ON "monthly_assessments"("studentId", "year", "month", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_skill_scores_assessmentId_skillCategoryId_key" ON "monthly_skill_scores"("assessmentId", "skillCategoryId");

-- CreateIndex
CREATE INDEX "teacher_reviews_status_publishedAt_idx" ON "teacher_reviews"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_reviews_studentId_groupId_year_month_key" ON "teacher_reviews"("studentId", "groupId", "year", "month");

-- CreateIndex
CREATE INDEX "learning_history_events_studentId_eventDate_idx" ON "learning_history_events"("studentId", "eventDate");

-- CreateIndex
CREATE INDEX "learning_history_events_eventType_eventDate_idx" ON "learning_history_events"("eventType", "eventDate");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_relations" ADD CONSTRAINT "parent_student_relations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_relations" ADD CONSTRAINT "parent_student_relations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_books" ADD CONSTRAINT "course_books_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_books" ADD CONSTRAINT "course_books_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_group_assignments" ADD CONSTRAINT "teacher_group_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_group_assignments" ADD CONSTRAINT "teacher_group_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group_enrollments" ADD CONSTRAINT "student_group_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group_enrollments" ADD CONSTRAINT "student_group_enrollments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_homework_statuses" ADD CONSTRAINT "student_homework_statuses_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "homeworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_homework_statuses" ADD CONSTRAINT "student_homework_statuses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_homework_statuses" ADD CONSTRAINT "student_homework_statuses_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_words" ADD CONSTRAINT "vocabulary_words_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_words" ADD CONSTRAINT "vocabulary_words_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_words" ADD CONSTRAINT "vocabulary_words_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_word_progress" ADD CONSTRAINT "student_word_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_word_progress" ADD CONSTRAINT "student_word_progress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "vocabulary_words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_word_progress" ADD CONSTRAINT "student_word_progress_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skill_categories" ADD CONSTRAINT "course_skill_categories_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skill_categories" ADD CONSTRAINT "course_skill_categories_skillCategoryId_fkey" FOREIGN KEY ("skillCategoryId") REFERENCES "skill_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_result_skill_scores" ADD CONSTRAINT "test_result_skill_scores_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_result_skill_scores" ADD CONSTRAINT "test_result_skill_scores_skillCategoryId_fkey" FOREIGN KEY ("skillCategoryId") REFERENCES "skill_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_assessments" ADD CONSTRAINT "monthly_assessments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_assessments" ADD CONSTRAINT "monthly_assessments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_assessments" ADD CONSTRAINT "monthly_assessments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_assessments" ADD CONSTRAINT "monthly_assessments_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_skill_scores" ADD CONSTRAINT "monthly_skill_scores_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "monthly_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_skill_scores" ADD CONSTRAINT "monthly_skill_scores_skillCategoryId_fkey" FOREIGN KEY ("skillCategoryId") REFERENCES "skill_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_reviews" ADD CONSTRAINT "teacher_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_reviews" ADD CONSTRAINT "teacher_reviews_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_reviews" ADD CONSTRAINT "teacher_reviews_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_reviews" ADD CONSTRAINT "teacher_reviews_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_history_events" ADD CONSTRAINT "learning_history_events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_history_events" ADD CONSTRAINT "learning_history_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_history_events" ADD CONSTRAINT "learning_history_events_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_history_events" ADD CONSTRAINT "learning_history_events_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_history_events" ADD CONSTRAINT "learning_history_events_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_history_events" ADD CONSTRAINT "learning_history_events_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Business invariants that Prisma schema syntax cannot express as partial indexes.
CREATE UNIQUE INDEX "parent_student_relations_active_unique"
ON "parent_student_relations" ("parentId", "studentId")
WHERE "archivedAt" IS NULL;

CREATE UNIQUE INDEX "parent_student_relations_one_primary"
ON "parent_student_relations" ("studentId")
WHERE "isPrimary" = true AND "archivedAt" IS NULL;

CREATE UNIQUE INDEX "student_group_enrollments_one_active"
ON "student_group_enrollments" ("studentId")
WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "teacher_group_assignments_one_current"
ON "teacher_group_assignments" ("teacherId", "groupId")
WHERE "isCurrent" = true;

CREATE UNIQUE INDEX "academic_periods_one_current"
ON "academic_periods" ("isCurrent")
WHERE "isCurrent" = true AND "archivedAt" IS NULL;

-- Domain guards remain authoritative even if a caller bypasses the service layer.
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_period_dates_valid" CHECK ("endDate" >= "startDate");
ALTER TABLE "groups" ADD CONSTRAINT "group_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "groups" ADD CONSTRAINT "group_dates_valid" CHECK ("endDate" IS NULL OR "endDate" >= "startDate");
ALTER TABLE "teacher_group_assignments" ADD CONSTRAINT "teacher_assignment_dates_valid" CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt");
ALTER TABLE "student_group_enrollments" ADD CONSTRAINT "student_enrollment_dates_valid" CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt");
ALTER TABLE "tests" ADD CONSTRAINT "test_max_score_positive" CHECK ("maxScore" > 0);
ALTER TABLE "test_results" ADD CONSTRAINT "test_result_scores_valid" CHECK ("score" >= 0 AND "maxScore" > 0 AND "score" <= "maxScore");
ALTER TABLE "test_result_skill_scores" ADD CONSTRAINT "test_skill_scores_valid" CHECK ("score" >= 0 AND "maxScore" > 0 AND "score" <= "maxScore");
ALTER TABLE "monthly_assessments" ADD CONSTRAINT "monthly_assessment_month_valid" CHECK ("month" BETWEEN 1 AND 12);
ALTER TABLE "teacher_reviews" ADD CONSTRAINT "teacher_review_month_valid" CHECK ("month" BETWEEN 1 AND 12);
ALTER TABLE "monthly_skill_scores" ADD CONSTRAINT "monthly_skill_score_valid" CHECK ("score" BETWEEN 0 AND 100);
