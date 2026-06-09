import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { documentsApi, uploadApi } from '../lib/api';
import { useToast, ToastContainer } from '../hooks/useToast';
import type { DocumentSummary } from '../types';
import { formatDistanceToNow } from 'date-fns';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toasts, toast } = useToast();

  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    try {
      const { data } = await documentsApi.list();
      setDocs(data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function createDocument() {
    setCreating(true);
    try {
      const { data } = await documentsApi.create('Untitled Document');
      navigate(`/doc/${data.id}`);
    } catch {
      toast.error('Failed to create document');
      setCreating(false);
    }
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.uploadFile(file);
      toast.success(`"${data.title}" imported successfully`);
      navigate(`/doc/${data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || 'Upload failed. Only .txt and .md files are supported.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function deleteDoc(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this document? This cannot be undone.')) return;
    try {
      await documentsApi.delete(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  }

  const mine = docs.filter((d) => d.is_owner);
  const shared = docs.filter((d) => !d.is_owner);
  const visible = tab === 'mine' ? mine : shared;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--accent)" />
              <path d="M8 10h10M8 15h16M8 20h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            DocFlow
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userBadge}>
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'mine' ? styles.active : ''}`}
              onClick={() => setTab('mine')}
            >
              My Documents
              <span className={styles.count}>{mine.length}</span>
            </button>
            <button
              className={`${styles.tab} ${tab === 'shared' ? styles.active : ''}`}
              onClick={() => setTab('shared')}
            >
              Shared with me
              <span className={styles.count}>{shared.length}</span>
            </button>
          </div>
          <div className={styles.actions}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              className={styles.fileInput}
              onChange={handleFileUpload}
              id="upload-input"
            />
            <label htmlFor="upload-input" className={styles.uploadBtn}>
              {uploading ? (
                <span>Importing…</span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  Import .txt / .md
                </>
              )}
            </label>
            <button className={styles.newBtn} onClick={createDocument} disabled={creating}>
              {creating ? (
                'Creating…'
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  New Document
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.empty}>
            <div className={styles.spinner} />
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <p>
              {tab === 'mine'
                ? 'No documents yet. Create one or import a file.'
                : 'No documents shared with you yet.'}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map((doc) => (
              <div
                key={doc.id}
                className={styles.card}
                onClick={() => navigate(`/doc/${doc.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/doc/${doc.id}`)}
              >
                <div className={styles.cardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{doc.title}</div>
                  <div className={styles.cardMeta}>
                    <span>Updated {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</span>
                    {!doc.is_owner && (
                      <span className={styles.sharedBadge}>
                        {doc.access_role === 'viewer' ? '👁 Viewer' : '✏ Editor'} · by {doc.owner.name}
                      </span>
                    )}
                  </div>
                </div>
                {doc.is_owner && (
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => deleteDoc(doc.id, e)}
                    title="Delete document"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}