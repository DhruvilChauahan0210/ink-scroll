import { getRepo } from '@/lib/live-data';

/**
 * The repo's star count for the sign-off's "Star on GitHub" button.
 *
 * Served from here, not fetched by each visitor's browser: GitHub's anonymous
 * API allows 60 calls an hour per address, and this way it is called at most
 * once an hour for everyone (ISR), and visitors' addresses never reach it. It
 * shares the live chapter's cached copy (lib/live-data), so a refused refresh
 * keeps the last count; `{ stars: null }` only when there has never been one,
 * and the button then shows no count.
 */
export const revalidate = 3600;

export async function GET() {
  const repo = await getRepo();
  return Response.json({ stars: repo?.data.stars ?? null });
}
