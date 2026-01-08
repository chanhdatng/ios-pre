import { useState, useEffect } from 'react';
import { useProgressStore } from '@lib/stores/progress-store';
import { Save, FileText } from 'lucide-react';

interface NoteEditorProps {
  topicId: string;
  topicTitle: string;
}

export default function NoteEditor({ topicId, topicTitle }: NoteEditorProps) {
  const { notes, updateNote } = useProgressStore();
  const [content, setContent] = useState(notes[topicId] || '');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setContent(notes[topicId] || '');
  }, [topicId, notes]);

  const handleSave = () => {
    updateNote(topicId, content);
    setIsSaved(true);
  };

  const handleChange = (value: string) => {
    setContent(value);
    setIsSaved(false);
  };

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (isSaved) return;

    const timer = setTimeout(() => {
      updateNote(topicId, content);
      setIsSaved(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, isSaved, topicId, updateNote]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-[var(--spacing-md)] border-b border-[var(--color-surface-secondary)]">
        <div className="flex items-center gap-[var(--spacing-xs)]">
          <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <span className="text-body font-medium">Notes: {topicTitle}</span>
        </div>
        <div className="flex items-center gap-[var(--spacing-xs)]">
          {!isSaved && (
            <span className="text-micro text-[var(--color-warning)]">Unsaved</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="flex items-center gap-[var(--spacing-xxs)] px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-body-small bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] disabled:opacity-50 hover:opacity-80 transition-opacity"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add your personal notes here..."
        className="w-full h-64 p-[var(--spacing-md)] bg-transparent resize-none focus:outline-none font-mono text-body-small text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
      />
    </div>
  );
}
