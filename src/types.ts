import { Timestamp } from './firebase';

export type UserRole = 'student' | 'staff' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  verified: boolean;
  blocked?: boolean;
  createdAt?: Timestamp;
}

export type School = 'ICT' | 'Engineering' | 'Management' | 'Law' | 'Biotechnology' | 'Buddhist Studies' | 'Humanities' | 'Vocational Studies';

export type ExamType = 'Mid-Term' | 'Final' | 'Back-Paper';

export type PaperStatus = 'pending' | 'approved' | 'rejected';

export interface Paper {
  id: string;
  title: string;
  subjectCode: string;
  school: School;
  examType: ExamType;
  semester: number;
  year: number;
  pdfUrl: string;
  uploaderUid: string;
  status: PaperStatus;
  downloadCount: number;
  createdAt?: Timestamp;
}

export interface Download {
  id: string;
  paperId: string;
  userUid: string;
  timestamp: Timestamp;
}

export const SCHOOLS: School[] = [
  'ICT', 'Engineering', 'Management', 'Law', 'Biotechnology', 'Buddhist Studies', 'Humanities', 'Vocational Studies'
];

export const EXAM_TYPES: ExamType[] = ['Mid-Term', 'Final', 'Back-Paper'];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
