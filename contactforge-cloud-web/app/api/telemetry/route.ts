export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  let downloadsCount = 0;
  let visitorsCount = 0;
  let githubDebug = "OK";
  let kvDebug = "OK";

  // 1. Fetch Downloads via GitHub API
  try {
    const githubRes = await fetch('https://api.github.com/repos/Shivanshmishra7275/Contact-Forge/releases/latest', {
      headers: {
        'User-Agent': 'ContactForge-Telemetry-Widget',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store'
    });

    if (!githubRes.ok) {
      const errorText = await githubRes.text().catch(() => 'Could not read response body');
      githubDebug = `GitHub API Error Status: ${githubRes.status} (${githubRes.statusText}) - Response: ${errorText}`;
      console.error(githubDebug);
    } else {
      const githubJson = await githubRes.json();
      console.log("GitHub API Data:", githubJson);
      
      if (githubJson && Array.isArray(githubJson.assets)) {
        downloadsCount = githubJson.assets.reduce((acc: number, asset: any) => acc + (asset.download_count ?? 0), 0);
      } else {
        githubDebug = "GitHub API Response lacks valid assets array";
        console.warn(githubDebug, githubJson);
      }
    }
  } catch (githubErr: any) {
    githubDebug = `GitHub Fetch Exception: ${githubErr?.message || String(githubErr)}`;
    console.error(githubDebug, githubErr);
  }

  // 2. Track Visitors via Vercel KV
  try {
    // Explicit environment variable availability check for production debugging
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Vercel KV environment variables are not configured in process.env.");
    }
    visitorsCount = await kv.incr('contactforge_visitors');
  } catch (kvErr) {
    kvDebug = String(kvErr);
    console.error('Failed to increment Vercel KV:', kvErr);
    visitorsCount = 0;
  }

  // Return the telemetry payload with explicit names and debug context
  return NextResponse.json({
    visitors: visitorsCount,
    downloads: downloadsCount,
    debug: { github: githubDebug, kv: kvDebug }
  });
}


