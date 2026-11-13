import { BENCH } from '@/data/bench-gsap';

export const dynamic = 'force-static';

/** The benchmark's raw results, every sample: the same file the page renders. */
export function GET() {
  return new Response(JSON.stringify(BENCH, null, 1), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
