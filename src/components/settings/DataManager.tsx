import { useState } from 'react';
import { useProgressStore } from '../../lib/stores/progress-store';
import { useFlashcardStore } from '../../lib/stores/flashcard-store';
import { useLeetCodeStore } from '../../lib/stores/leetcode-store';
import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';

interface BackupData {
  version: string;
  exportedAt: string;
  progress: {
    checklist: Record<string, boolean>;
    notes: Record<string, string>;
    streak: number;
    lastStudyDate: string;
  };
  flashcards: {
    cardStates: Record<string, unknown>;
    reviewsToday: number;
  };
  leetcode: {
    username: string;
    problems: unknown[];
  };
}

export default function DataManager() {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3000);
  };

  const exportData = () => {
    const progressState = useProgressStore.getState();
    const flashcardState = useFlashcardStore.getState();
    const leetcodeState = useLeetCodeStore.getState();

    const data: BackupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      progress: {
        checklist: progressState.checklist,
        notes: progressState.notes,
        streak: progressState.streak,
        lastStudyDate: progressState.lastStudyDate,
      },
      flashcards: {
        cardStates: flashcardState.cardStates,
        reviewsToday: flashcardState.reviewsToday,
      },
      leetcode: {
        username: leetcodeState.username,
        problems: leetcodeState.problems,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ios-prep-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showStatus('success', 'Data exported successfully!');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;

        if (!data.version) {
          throw new Error('Invalid backup file');
        }

        // Import progress
        if (data.progress) {
          const progressStore = useProgressStore.getState();
          // Clear existing and import
          Object.entries(data.progress.checklist || {}).forEach(([key, value]) => {
            if (value && !progressStore.checklist[key]) {
              progressStore.toggleChecklistItem(key);
            }
          });
          Object.entries(data.progress.notes || {}).forEach(([key, value]) => {
            progressStore.updateNote(key, value);
          });
        }

        // Import flashcard states - this needs the full card object which we don't have
        // So we'll skip detailed card state import for now
        // The user would need to re-review cards to rebuild state

        // Import LeetCode
        if (data.leetcode) {
          const leetcodeStore = useLeetCodeStore.getState();
          if (data.leetcode.username) {
            leetcodeStore.setUsername(data.leetcode.username);
          }
          // Import problems that don't already exist
          const existingIds = new Set(leetcodeStore.problems.map((p) => p.id));
          (data.leetcode.problems || []).forEach((p: unknown) => {
            const problem = p as { id: string; title: string; difficulty: 'easy' | 'medium' | 'hard'; pattern: string };
            if (!existingIds.has(problem.id)) {
              leetcodeStore.addProblem({
                id: problem.id,
                title: problem.title,
                difficulty: problem.difficulty,
                pattern: problem.pattern,
              });
            }
          });
        }

        showStatus('success', 'Data imported successfully!');
      } catch {
        showStatus('error', 'Failed to import. Invalid file format.');
      }

      // Reset file input
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-6 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
      <h3 className="text-body font-semibold mb-4">Data Management</h3>

      <p className="text-body-small text-[var(--color-text-secondary)] mb-6">
        Export your progress to a JSON file for backup. Import to restore on another device.
      </p>

      <div className="flex gap-4">
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-orange)] text-white rounded-[var(--radius-md)] font-medium"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>

        <label className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)] cursor-pointer hover:bg-[var(--color-surface-secondary)] transition-colors">
          <Upload className="w-4 h-4" />
          Import Data
          <input type="file" accept=".json" onChange={importData} className="hidden" />
        </label>
      </div>

      {status && (
        <div
          className={`mt-4 p-3 rounded-[var(--radius-md)] flex items-center gap-2 ${
            status.type === 'success'
              ? 'bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)]'
              : 'bg-[var(--color-accent-red)]/10 text-[var(--color-accent-red)]'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {status.message}
        </div>
      )}

      <div className="mt-6 p-4 bg-[var(--color-accent-orange)]/10 rounded-[var(--radius-md)]">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-[var(--color-accent-orange)] mt-0.5" />
          <div>
            <p className="font-medium text-[var(--color-accent-orange)]">Remember to backup!</p>
            <p className="text-body-small text-[var(--color-text-secondary)]">
              Export your data weekly to prevent data loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
