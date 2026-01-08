import { useState, useEffect } from 'react';
import { fetchGitHubRepos, type GitHubRepo } from '../../lib/api/github';
import { Github, Star, GitFork, RefreshCw, ExternalLink } from 'lucide-react';

interface GitHubActivityProps {
  defaultUsername?: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function GitHubActivity({ defaultUsername = '' }: GitHubActivityProps) {
  const [username, setUsername] = useState(defaultUsername);
  const [savedUsername, setSavedUsername] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ios-prep-github-username');
    if (saved) {
      setUsername(saved);
      setSavedUsername(saved);
    }
  }, []);

  const fetchData = async () => {
    if (!username) return;

    setIsLoading(true);
    setError('');

    try {
      const repoData = await fetchGitHubRepos(username);
      setRepos(repoData);
      // Save username on successful fetch
      localStorage.setItem('ios-prep-github-username', username);
      setSavedUsername(username);
    } catch {
      setError('Failed to fetch GitHub data. Check username.');
    }

    setIsLoading(false);
  };

  // Auto-fetch if we have a saved username
  useEffect(() => {
    if (savedUsername) {
      fetchData();
    }
  }, [savedUsername]);

  return (
    <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
      <div className="flex items-center gap-2 mb-4">
        <Github className="w-5 h-5" />
        <h3 className="font-semibold text-body">GitHub Activity</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="GitHub username"
          onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          className="flex-1 px-3 py-2 bg-[var(--color-surface-primary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
        />
        <button
          onClick={fetchData}
          disabled={!username || isLoading}
          className="px-4 py-2 bg-[var(--color-accent-orange)] text-white rounded-[var(--radius-md)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p className="text-[var(--color-accent-red)] text-body-small mb-4">{error}</p>}

      <div className="space-y-3">
        {repos.length === 0 && !isLoading && (
          <p className="text-center text-caption py-4">
            Enter your GitHub username to see recent repos
          </p>
        )}

        {repos.map((repo) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-body">{repo.name}</span>
              <ExternalLink className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </div>
            {repo.description && (
              <p className="text-body-small text-[var(--color-text-secondary)] mt-1 line-clamp-1">
                {repo.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-caption">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" /> {repo.stargazers_count}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3 h-3" /> {repo.forks_count}
              </span>
              {repo.language && (
                <span className="text-[var(--color-accent-blue)]">{repo.language}</span>
              )}
              <span>{formatTimeAgo(repo.updated_at)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
