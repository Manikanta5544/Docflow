import type { Editor } from '@tiptap/react';
import styles from './EditorToolbar.module.css';

interface Props {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      className={`${styles.btn} ${active ? styles.active : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        {btn(
          editor.isActive('heading', { level: 1 }),
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          'Heading 1',
          <span className={styles.label}>H1</span>
        )}
        {btn(
          editor.isActive('heading', { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          'Heading 2',
          <span className={styles.label}>H2</span>
        )}
        {btn(
          editor.isActive('heading', { level: 3 }),
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          'Heading 3',
          <span className={styles.label}>H3</span>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        {btn(
          editor.isActive('bold'),
          () => editor.chain().focus().toggleBold().run(),
          'Bold (Ctrl+B)',
          <strong>B</strong>
        )}
        {btn(
          editor.isActive('italic'),
          () => editor.chain().focus().toggleItalic().run(),
          'Italic (Ctrl+I)',
          <em>I</em>
        )}
        {btn(
          editor.isActive('underline'),
          () => editor.chain().focus().toggleUnderline().run(),
          'Underline (Ctrl+U)',
          <u>U</u>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        {btn(
          editor.isActive('bulletList'),
          () => editor.chain().focus().toggleBulletList().run(),
          'Bullet list',
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6"/>
            <line x1="9" y1="12" x2="20" y2="12"/>
            <line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1" fill="currentColor"/>
            <circle cx="4" cy="12" r="1" fill="currentColor"/>
            <circle cx="4" cy="18" r="1" fill="currentColor"/>
          </svg>
        )}
        {btn(
          editor.isActive('orderedList'),
          () => editor.chain().focus().toggleOrderedList().run(),
          'Numbered list',
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"/>
            <line x1="10" y1="12" x2="21" y2="12"/>
            <line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        {btn(
          false,
          () => editor.chain().focus().undo().run(),
          'Undo (Ctrl+Z)',
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,14 4,9 9,4"/>
            <path d="M20 20v-7a4 4 0 00-4-4H4"/>
          </svg>
        )}
        {btn(
          false,
          () => editor.chain().focus().redo().run(),
          'Redo (Ctrl+Y)',
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,14 20,9 15,4"/>
            <path d="M4 20v-7a4 4 0 014-4h12"/>
          </svg>
        )}
      </div>
    </div>
  );
}