import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Category,
  Subcategory,
  Question,
  Page,
  Note,
  DashboardStats,
  ImportResult,
} from './models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  categories() {
    return this.http.get<Category[]>('/api/categories');
  }
  createCategory(name: string) {
    return this.http.post<Category>('/api/categories', { name });
  }
  updateCategory(id: number, name: string) {
    return this.http.put<Category>(`/api/categories/${id}`, { name });
  }
  deleteCategory(id: number) {
    return this.http.delete<void>(`/api/categories/${id}`);
  }
  subcategories(id?: number | null) {
    return this.http.get<Subcategory[]>(`/api/categories/${id}/subcategories`);
  }
  allSubcategories() {
    return this.http.get<Subcategory[]>('/api/subcategories');
  }
  createSubcategory(categoryId: number, name: string) {
    return this.http.post<Subcategory>('/api/subcategories', { categoryId, name });
  }
  questions(p: {
    page: number;
    size: number;
    categoryId?: number | null;
    subcategoryId?: number | null;
    studiedBefore?: boolean | null;
    search?: string | null;
    sort?: string | null;
  }) {
    let h = new HttpParams()
      .set('page', String(p.page))
      .set('size', String(p.size))
      .set('sort', p.sort ?? 'updatedAt,desc');

    Object.entries(p).forEach(([k, v]) => {
      if (
        k !== 'page' &&
        k !== 'size' &&
        k !== 'sort' &&
        v !== undefined &&
        v !== null &&
        v !== ''
      ) {
        h = h.set(k, String(v));
      }
    });

    return this.http.get<Page<Question>>('/api/questions', {
      params: h,
    });
  }
  getQuestion(id: number) {
    return this.http.get<Question>(`/api/questions/${id}`);
  }
  createQuestion(v: any) {
    return this.http.post<Question>('/api/questions', v);
  }
  updateQuestion(id: number, v: any) {
    return this.http.put<Question>(`/api/questions/${id}`, v);
  }
  deleteQuestion(id: number) {
    return this.http.delete<void>(`/api/questions/${id}`);
  }
  studied(id: number, value: boolean) {
    return this.http.patch<Question>(`/api/questions/${id}/studied`, { studiedBefore: value });
  }
  practice(id: number, delta: number) {
    return this.http.patch<Question>(`/api/questions/${id}/practice-count`, { delta });
  }
  validateImport(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ImportResult>('/api/questions/import/validate', fd);
  }
  confirmImport(importId: string) {
    return this.http.post<any>('/api/questions/import/confirm', null, { params: { importId } });
  }
  notes(page = 0, size = 20) {
    return this.http.get<Page<Note>>('/api/workspace-notes', { params: { page, size } });
  }
  allNotes() {
    return this.http.get<Note[]>('/api/workspace-notes/all');
  }
  getNote(id: number) {
    return this.http.get<Note>(`/api/workspace-notes/${id}`);
  }
  createNote(questionId: number, answer: string) {
    return this.http.post<Note>('/api/workspace-notes', { questionId, answer });
  }
  updateNote(id: number, questionId: number, answer: string) {
    return this.http.put<Note>(`/api/workspace-notes/${id}`, { questionId, answer });
  }
  deleteNote(id: number) {
    return this.http.delete<void>(`/api/workspace-notes/${id}`);
  }
  dashboard() {
    return this.http.get<DashboardStats>('/api/dashboard');
  }
}
