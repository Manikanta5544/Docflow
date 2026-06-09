import { useState, useEffect } from 'react';
import { versionsApi } from '../lib/api';
import type { DocumentVersion } from '../types';
import { formatDistanceToNow } from 'date-fns';
import styles from './versionhistory.module.css';

interface Props {
  docId: string;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function VersionHistory({ docId, onClose, onToast }: Props) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    versionsApi.list(docId)
      .then(({ data }) => setVersions(data))
      .catch(() => onToast('Failed to load version history', 'error'))
      .finally(() => setLoading(false));
  }, [docId]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>Version History</div>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.empty}><div className={styles.spinner} /></div>
        ) : versions.length === 0 ? (
          <div className={styles.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p>No saved versions yet.</p>
            <p>Save a version to checkpoint your work.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {versions.map((v, i) => (
              <div key={v.id} className={`${styles.item} ${i === 0 ? styles.latest : ''}`}>
                <div className={styles.itemLeft}>
                  <div className={styles.versionDot} />
                  {i < versions.length - 1 && <div className={styles.versionLine} />}
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.versionLabel}>
                    <span className={styles.versionNum}>{v.version_number}</span>
                    {i === 0 && <span className={styles.latestBadge}>Latest</span>}
                  </div>
                  <div className={styles.versionTitle}>{v.title}</div>
                  <div className={styles.versionMeta}>
                    Saved by {v.saved_by.name} · {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}