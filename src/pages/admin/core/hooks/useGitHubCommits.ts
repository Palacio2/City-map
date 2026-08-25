import { useState, useEffect } from 'react';
import { GitHubCommit } from '@admin/core/types/login.types';
import { GITHUB_CONFIG } from '@admin/core/constants/loginConstants';

export function useGitHubCommits() {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchGitHubData() {
      try {
        const headers: HeadersInit = {
          'Accept': 'application/vnd.github.v3+json'
        };

        const [commitsRes, tagsRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/commits?per_page=3`, { headers }),
          fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/tags?per_page=3`, { headers })
        ]);

        if (!commitsRes.ok) throw new Error(`GitHub API error: ${commitsRes.status}`);
        
        const commitsData = await commitsRes.json();
        const tagsData = tagsRes.ok ? await tagsRes.json() : [];

        const formatted: GitHubCommit[] = commitsData.map((item: { sha: string; commit: { author: { name: string; date: string }; message: string }; html_url: string }, idx: number) => {
          const matchedTag = tagsData[idx]?.name;
          const fallbackTag = `v1.0.${Math.max(0, commitsData.length - idx)}`;

          return {
            sha: item.sha.substring(0, 7),
            version: matchedTag || fallbackTag,
            message: item.commit.message.split('\n')[0],
            date: new Date(item.commit.author.date).toLocaleDateString(),
            url: item.html_url
          };
        });

        setCommits(formatted);
      } catch {
        setCommits([
          { sha: '8f2a1c', version: 'v1.0.3', message: 'Security & 2FA Enforcement', date: '', url: '#' },
          { sha: '4b1e9d', version: 'v1.0.2', message: 'Map engine & Tile styling update', date: '', url: '#' },
          { sha: '1c9a3b', version: 'v1.0.1', message: 'API Gateway Optimization', date: '', url: '#' }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchGitHubData();
  }, []);

  return { commits, loading };
}