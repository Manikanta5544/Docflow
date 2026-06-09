import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { documentsApi, versionsApi } from '../lib/api';
import { useToast, ToastContainer } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import EditorToolbar from '../components/EditorToolbar';
import ShareModal from '../components/ShareModal';
import VersionHistory from '../components/VersionHistory';
import type { Document } from '../types';
import styles from './EditorPage.module.css';

type SaveState = 'saved' | 'unsaved' | 'saving';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, toast } = useToast();

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReadOnly = doc ? (!doc.is_owner && doc.access_role === 'viewer') : false;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      if (isReadOnly) return;
      setSaveState('unsaved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        handleAutoSave(editor.getJSON());
      }, 1500);
    },
  });

  useEffect(() => {
    if (!id) return;
    documentsApi.get(id)
      .then(({ data }) => {
        setDoc(data);
        setTitleValue(data.title);
        try {
          editor?.commands.setContent(JSON.parse(data.content));
        } catch {
          editor?.commands.setContent(data.content);
        }
      })
      .catch(() => {
        toast.error('Failed to load document');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id, editor]);

  // Update editability when doc loads
  useEffect(() => {
    if (!editor || !doc) return;
    editor.setEditable(!isReadOnly);
  }, [doc, isReadOnly, editor]);

  const handleAutoSave = useCallback(async (content: object) => {
    if (!id || !doc) return;
    setSaveState('saving');
    try {
      await documentsApi.update(id, { content: JSON.stringify(content) });
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  }, [id, doc]);

  async function handleTitleSave() {
    if (!id || !titleValue.trim()) return;
    setEditingTitle(false);
    const newTitle = titleValue.trim();
    setDoc((prev) => prev ? { ...prev, title: newTitle } : prev);
    try {
      await documentsApi.update(id, { title: newTitle });
    } catch {
      toast.error('Failed to rename document');
    }
  }

  async function handleSaveVersion() {
    if (!id) return;
    try {
      await versionsApi.save(id);
      toast.success('Version saved');
      if (showVersions) {
        // Refresh panel by toggling
        setShowVersions(false);
        setTimeout(() => setShowVersions(true), 50);
      }
    } catch {
      toast.error('Failed to save version');
    }
  }

  const saveIndicator = {
    saved: { label: 'Saved', cls: styles.saved },
    saving: { label: 'Saving…', cls: styles.saving },
    unsaved: { label: 'Unsaved changes', cls: styles.unsaved },
  }[saveState];

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Top bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')} title="Back to documents">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>

          {editingTitle && !isReadOnly ? (
            <input
              className={styles.titleInput}
              value={titleValue}
              autoFocus
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(doc?.title || ''); }
              }}
            />
          ) : (
            <h1
              className={`${styles.title} ${!isReadOnly ? styles.editable : ''}`}
              onClick={() => !isReadOnly && setEditingTitle(true)}
              title={isReadOnly ? undefined : 'Click to rename'}
            >
              {doc?.title || 'Untitled Document'}
            </h1>
          )}

          <span className={`${styles.saveIndicator} ${saveIndicator.cls}`}>
            {saveIndicator.label}
          </span>

          {isReadOnly && (
            <span className={styles.readonlyBadge}>View only</span>
          )}
        </div>

        <div className={styles.headerRight}>
          {doc?.is_owner && (
            <button
              className={styles.versionBtn}
              onClick={() => setShowVersions((v) => !v)}
              title="Version history"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              History
            </button>
          )}
          {!isReadOnly && (
            <button className={styles.saveVersionBtn} onClick={handleSaveVersion}>
              Save version
            </button>
          )}
          {doc?.is_owner && (
            <button className={styles.shareBtn} onClick={() => setShowShare(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>
          )}

          <div className={styles.userBadge} title={user?.email}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      {!isReadOnly && <EditorToolbar editor={editor} />}

      {/* Editor area */}
      <div className={styles.editorArea}>
        <div className={styles.editorWrapper}>
          <EditorContent editor={editor} className={styles.editorContent} />
        </div>

        {showVersions && doc && (
          <VersionHistory
            docId={doc.id}
            onClose={() => setShowVersions(false)}
            onToast={(msg, type) => toast[type](msg)}
          />
        )}
      </div>

      {showShare && doc && (
        <ShareModal
          docId={doc.id}
          onClose={() => setShowShare(false)}
          onToast={(msg, type) => toast[type](msg)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}