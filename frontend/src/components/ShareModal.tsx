import { useState, useEffect } from 'react';
import { sharingApi } from '../lib/api';
import type { AccessRecord } from '../types';
import styles from './ShareModal.module.css';

interface Props {
  docId: string;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ShareModal({ docId, onClose, onToast }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [accesses, setAccesses] = useState<AccessRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    sharingApi.listAccess(docId)
      .then(({ data }) => setAccesses(data))
      .catch(() => onToast('Failed to load sharing info', 'error'))
      .finally(() => setFetching(false));
  }, [docId]);

  async function handleShare() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data } = await sharingApi.share(docId, email.trim(), role);
      setAccesses((prev) => {
        const exists = prev.find((a) => a.user.email === data.user.email);
        if (exists) return prev.map((a) => a.user.email === data.user.email ? data : a);
        return [...prev, data];
      });
      setEmail('');
      onToast(`Shared with ${data.user.email} as ${role}`, 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      onToast(msg || 'Failed to share document', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(accessId: string, userEmail: string) {
    try {
      await sharingApi.revokeAccess(docId, accessId);
      setAccesses((prev) => prev.filter((a) => a.id !== accessId));
      onToast(`Removed access for ${userEmail}`, 'info');
    } catch {
      onToast('Failed to revoke access', 'error');
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Share document</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShare()}
            />
            <select
              className={styles.select}
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className={styles.shareBtn} onClick={handleShare} disabled={loading || !email.trim()}>
              {loading ? '…' : 'Share'}
            </button>
          </div>

          <div className={styles.accessList}>
            <div className={styles.sectionLabel}>People with access</div>
            {fetching ? (
              <div className={styles.loading}>Loading…</div>
            ) : accesses.length === 0 ? (
              <div className={styles.empty}>No one else has access yet.</div>
            ) : (
              accesses.map((access) => (
                <div key={access.id} className={styles.accessRow}>
                  <div className={styles.userAvatar}>
                    {access.user.name[0].toUpperCase()}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{access.user.name}</span>
                    <span className={styles.userEmail}>{access.user.email}</span>
                  </div>
                  <span className={`${styles.roleBadge} ${styles[access.role]}`}>
                    {access.role}
                  </span>
                  <button
                    className={styles.revokeBtn}
                    onClick={() => handleRevoke(access.id, access.user.email)}
                    title="Remove access"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}