import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Category,
  Subcategory,
  Question,
  Page,
  Note,
  WorkspaceNoteBulkResult,
  DashboardStats,
  ImportResult,
} from './models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  categories() {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }
  createCategory(name: string) {
    return this.http.post<Category>(`${this.apiUrl}/categories`, { name });
  }
  updateCategory(id: number, name: string) {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, { name });
  }
  deleteCategory(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }
  subcategories(id?: number | null) {
    return this.http.get<Subcategory[]>(`${this.apiUrl}/categories/${id}/subcategories`);
  }
  allSubcategories() {
    return this.http.get<Subcategory[]>(`${this.apiUrl}/subcategories`);
  }
  createSubcategory(categoryId: number, name: string) {
    return this.http.post<Subcategory>(`${this.apiUrl}/subcategories`, { categoryId, name });
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

    return this.http.get<Page<Question>>(`${this.apiUrl}/questions`, {
      params: h,
    });
  }
  getQuestion(id: number) {
    return this.http.get<Question>(`${this.apiUrl}/questions/${id}`);
  }
  createQuestion(v: any) {
    return this.http.post<Question>(`${this.apiUrl}/questions`, v);
  }
  updateQuestion(id: number, v: any) {
    return this.http.put<Question>(`${this.apiUrl}/questions/${id}`, v);
  }
  deleteQuestion(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/questions/${id}`);
  }
  studied(id: number, value: boolean) {
    return this.http.patch<Question>(`${this.apiUrl}/questions/${id}/studied`, {
      studiedBefore: value,
    });
  }
  practice(id: number, delta: number) {
    return this.http.patch<Question>(`${this.apiUrl}/questions/${id}/practice-count`, { delta });
  }
  validateImport(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ImportResult>(`${this.apiUrl}/questions/import/validate`, fd);
  }
  confirmImport(importId: string) {
    return this.http.post<any>(`${this.apiUrl}/questions/import/confirm`, null, {
      params: { importId },
    });
  }
  notes(page = 0, size = 20) {
    return this.http.get<Page<Note>>(`${this.apiUrl}/workspace-notes`, { params: { page, size } });
  }
  allNotes() {
    return this.http.get<Note[]>(`${this.apiUrl}/workspace-notes/all`);
  }
  getNote(id: number) {
    return this.http.get<Note>(`${this.apiUrl}/workspace-notes/${id}`);
  }
  createNote(questionId: number, answer: string) {
    return this.http.post<Note>(`${this.apiUrl}/workspace-notes`, { questionId, answer });
  }
  bulkSaveNotes(items: { questionId: number; answer: string }[]) {
    return this.http.post<WorkspaceNoteBulkResult>(`${this.apiUrl}/workspace-notes/bulk`, {
      items,
    });
  }
  updateNote(id: number, questionId: number, answer: string) {
    return this.http.put<Note>(`${this.apiUrl}/workspace-notes/${id}`, { questionId, answer });
  }
  deleteNote(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/workspace-notes/${id}`);
  }
  dashboard() {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }
}
