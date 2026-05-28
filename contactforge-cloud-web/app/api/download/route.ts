import { NextResponse } from 'next/server';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch the latest release metadata from GitHub
    const res = await fetch('https://api.github.com/repos/Shivanshmishra7275/Contact-Forge/releases/latest', {
      next: { revalidate: 0 }, // do not cache so users always get the latest APK immediately
    });

    if (!res.ok) {
      console.error('Failed to fetch latest release from GitHub API:', res.status, res.statusText);
      // Fallback to the releases page if API fails
      return NextResponse.redirect('https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest');
    }

    const data = await res.json();
    
    // Find the first asset that is an APK
    const apkAsset = data.assets?.find((asset: any) => asset.name.endsWith('.apk'));

    if (apkAsset && apkAsset.browser_download_url) {
      // Track the proxy download in Redis before redirecting
      try {
        if (process.env.REDIS_URL) {
          const redis = new Redis(process.env.REDIS_URL);
          await redis.incr('contactforge_downloads');
          await redis.quit().catch(() => {});
        }
      } catch (err) {
        console.error('Failed to increment proxy download count:', err);
      }

      try {
        // Resolve the GitHub 302 redirect server-side so the client never hits github.com
        const resolveRes = await fetch(apkAsset.browser_download_url, { redirect: 'manual' });
        const finalUrl = resolveRes.headers.get('location');
        
        if (finalUrl) {
          const response = NextResponse.redirect(finalUrl);
          response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          return response;
        }
      } catch (err) {
        console.error('Failed to resolve final URL:', err);
      }

      // Fallback redirect directly to the APK download URL (this forces a download in the browser without opening GitHub UI)
      const response = NextResponse.redirect(apkAsset.browser_download_url);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      return response;
    }

    // Fallback if no APK is found in the latest release
    const response = NextResponse.redirect('https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error) {
    console.error('Error fetching release:', error);
    // Fallback on error
    const response = NextResponse.redirect('https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  }
}
