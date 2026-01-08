export interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

export interface GitHubActivity {
  type: string;
  repo: string;
  createdAt: string;
  payload?: unknown;
}

/**
 * Fetch public repositories for a GitHub user
 * Sorted by most recently updated
 */
export async function fetchGitHubRepos(
  username: string,
  limit = 5
): Promise<GitHubRepo[]> {
  // Sanitize username to prevent injection
  const sanitizedUsername = encodeURIComponent(username.trim());

  const response = await fetch(
    `https://api.github.com/users/${sanitizedUsername}/repos?sort=updated&per_page=${limit}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    if (response.status === 403) {
      throw new Error('Rate limit exceeded. Try again later.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch recent public activity for a GitHub user
 */
export async function fetchGitHubActivity(
  username: string,
  limit = 10
): Promise<GitHubActivity[]> {
  // Sanitize username to prevent injection
  const sanitizedUsername = encodeURIComponent(username.trim());

  const response = await fetch(
    `https://api.github.com/users/${sanitizedUsername}/events/public?per_page=${limit}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    if (response.status === 403) {
      throw new Error('Rate limit exceeded. Try again later.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const events = await response.json();

  return events.map((event: { type: string; repo: { name: string }; created_at: string; payload: unknown }) => ({
    type: event.type,
    repo: event.repo.name,
    createdAt: event.created_at,
    payload: event.payload,
  }));
}
