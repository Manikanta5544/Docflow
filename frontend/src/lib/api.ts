import axios from 'axios';
import type { Document, DocumentSummary, AccessRecord, DocumentVersion, DocumentVersionDetail, User } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/login', { email, password }),
  register: (email: string, name: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/register', { email, name, password }),
  me: () => api.get<User>('/auth/me'),
  users: () => api.get<User[]>('/auth/users'),
};

// Documents
export const documentsApi = {
  list: () => api.get<DocumentSummary[]>('/documents'),
  get: (id: string) => api.get<Document>(`/documents/${id}`),
  create: (title?: string) => api.post<Document>('/documents', { title }),
  update: (id: string, data: { title?: string; content?: string }) =>
    api.patch<Document>(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

// Sharing
export const sharingApi = {
  share: (docId: string, email: string, role: 'editor' | 'viewer') =>
    api.post<AccessRecord>(`/sharing/${docId}/share`, { email, role }),
  listAccess: (docId: string) => api.get<AccessRecord[]>(`/sharing/${docId}/access`),
  revokeAccess: (docId: string, accessId: string) =>
    api.delete(`/sharing/${docId}/access/${accessId}`),
};

// Versions
export const versionsApi = {
  save: (docId: string) => api.post<DocumentVersion>(`/versions/${docId}/save-version`),
  list: (docId: string) => api.get<DocumentVersion[]>(`/versions/${docId}/versions`),
  get: (docId: string, versionId: string) =>
    api.get<DocumentVersionDetail>(`/versions/${docId}/versions/${versionId}`),
};

// Upload
export const uploadApi = {
  uploadFile: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<Document>('/upload/file', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};