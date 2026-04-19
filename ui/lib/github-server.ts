// Server-only. Fetches bot memory markdown + recent commits for routine health.

import type { BotSlug, RoutineRun } from './types';

const OWNER = process.env.GITHUB_REPO_OWNER ?? 'thomascortebeeck-kidsnovel';
const REPO = process.env.GITHUB_REPO_NAME ?? 'trader';
const BRANCH = process.env.GITHUB_REPO_BRANCH ?? 'main';

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'trader-ui',
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

export async function fetchMemoryFile(slug: BotSlug, file: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/bots/${slug}/memory/${file}`;
  const res = await fetch(url, {
    headers: ghHeaders(),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`GitHub raw fetch ${url} failed: ${res.status}`);
  }
  return res.text();
}

export async function fetchRoutineCommits(slug: BotSlug, limit = 20): Promise<RoutineRun[]> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/commits?path=bots/${slug}&sha=${BRANCH}&per_page=${limit}`;
  const res = await fetch(url, {
    headers: ghHeaders(),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`GitHub commits fetch failed: ${res.status}`);
  }
  const commits = (await res.json()) as Array<{
    sha: string;
    commit: { message: string; author: { date: string } };
  }>;
  return commits.map((c) => {
    const subject = c.commit.message.split('\n')[0];
    const match = subject.match(/^[^:]+:\s*(\S+)/);
    return {
      routine: match ? match[1] : subject.slice(0, 40),
      lastRunISO: c.commit.author.date,
      commitSha: c.sha.slice(0, 7),
      success: true,
    };
  });
}
