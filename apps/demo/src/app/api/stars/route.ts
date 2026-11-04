/**
 * The repo's star count for the sign-off's "Star on GitHub" button.
 *
 * Served from here, not fetched by each visitor's browser: GitHub's anonymous
 * API allows 60 calls an hour per address, and this way it is called at most
 * once an hour for everyone (ISR), and visitors' addresses never reach it.
 * Any failure answers `{ stars: null }` and the button shows no count.
 */
export const revalidate = 3600;

const REPO = 'DhruvilChauahan0210/ink-scroll';

export async function GET() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate },
    });
    if (!res.ok) return Response.json({ stars: null });
    const { stargazers_count } = (await res.json()) as { stargazers_count?: unknown };
    return Response.json({ stars: typeof stargazers_count === 'number' ? stargazers_count : null });
  } catch {
    return Response.json({ stars: null });
  }
}
