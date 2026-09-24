export interface User {
  id: number;
  email: string;
  displayName: string;
}
export interface Category {
  id: number;
  name: string;
  questionCount: number;
  subcategories: string[];
  createdAt: string;
  updatedAt: string;
}
export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface Ref {
  id: number;
  name: string;
}
export interface Question {
  id: number;
  category: Ref;
  subcategory: Ref | null;
  question: string;
  questionSource?: string;
  questionSourceUrl?: string;
  answerSource?: string;
  answerSourceUrl?: string;
  studiedBefore: boolean;
  practiceCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface ImportPreviewRow {
  row: number;
  category: string;
  subcategory: string;
  question: string;
  questionSource: string;
  questionSourceUrl: string;
  answerSource: string;
  answerSourceUrl: string;
  valid: boolean;
  errors: string[];
}
export interface ImportResult {
  importId: string | null;
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: { row: number; message: string }[];
  preview: ImportPreviewRow[];
}
export interface Note {
  id: number;
  question: Question;
  answer: string;
  createdAt: string;
  updatedAt: string;
}
export interface WorkspaceNoteBulkResult {
  created: number;
  updated: number;
  skipped: number;
}
export interface DashboardStats {
  totalQuestions: number;
  studied: number;
  notStudied: number;
  practiceSessions: number;
  workspaceNotes: number;
  categories: number;
  recentlyPracticed: Question[];
  notStudiedQuestions: Question[];
}
