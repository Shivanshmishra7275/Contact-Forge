import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch Downloads via GitHub API
    // We fetch the latest release of the Contact-Forge repository
    let downloads = 0;
    try {
      const githubRes = await fetch('https://api.github.com/repos/Shivanshmishra7275/Contact-Forge/releases/latest', {
        headers: {
          'User-Agent': 'ContactForge-Telemetry-Widget',
          // Optional: 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` if rate limits are hit
        },
        next: { revalidate: 60 } // Cache GitHub response for 60 seconds
      });

      if (!githubRes.ok) {
        console.error('GitHub API Error:', githubRes.status, await githubRes.text());
        // We won't throw here to ensure visitors still increments even if GitHub fails
      } else {
        const latestRelease = await githubRes.json();
        // Sum the download counts of all assets in the latest release
        if (latestRelease && latestRelease.assets) {
          downloads = latestRelease.assets.reduce((acc: number, asset: any) => acc + asset.download_count, 0);
        }
      }
    } catch (githubErr) {
      console.error('Failed to fetch from GitHub API:', githubErr);
    }

    // 2. Track Visitors via Vercel KV
    let visitors = 0;
    try {
      // Increment the counter and return the new value
      visitors = await kv.incr('contactforge_visitors');
    } catch (kvErr) {
      console.error('Failed to increment Vercel KV:', kvErr);
      // Fallback to a default if KV is misconfigured (e.g., missing KV_REST_API_URL)
      visitors = 0;
    }

    // Return the telemetry payload
    return NextResponse.json({ visitors, downloads });

  } catch (error) {
    console.error('Fatal error in telemetry route:', error);
    return NextResponse.json({ error: 'Failed to process telemetry' }, { status: 500 });
  }
}
