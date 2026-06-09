export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  owner_id: string;
  owner: User;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  access_role: string | null;
}

export interface Document extends DocumentSummary {
  content: string;
}

export interface AccessRecord {
  id: string;
  document_id: string;
  user: User;
  role: string;
  granted_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  title: string;
  version_number: string;
  saved_by: User;
  created_at: string;
}

export interface DocumentVersionDetail extends DocumentVersion {
  content: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}