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
      // Fetch the actual file from GitHub to proxy the download directly
      const fileResponse = await fetch(apkAsset.browser_download_url);
      
      if (!fileResponse.ok) {
        return NextResponse.redirect('https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest');
      }

      // Track the proxy download in Redis since GitHub API won't catch it
      try {
        if (process.env.REDIS_URL) {
          const redis = new Redis(process.env.REDIS_URL);
          await redis.incr('contactforge_downloads');
          await redis.quit().catch(() => {});
        }
      } catch (err) {
        console.error('Failed to increment proxy download count:', err);
      }

      // Create a direct response with the file stream and appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', 'application/vnd.android.package-archive');
      headers.set('Content-Disposition', `attachment; filename="${apkAsset.name}"`);
      
      return new NextResponse(fileResponse.body, {
        status: 200,
        headers,
      });
    }

    // Fallback if no APK is found in the latest release
    return NextResponse.redirect('https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest');
  } catch (error) {
    console.error('Error fetching release:', error);
    // Fallback on error
    return NextResponse.redirect('https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest');
  }
}
