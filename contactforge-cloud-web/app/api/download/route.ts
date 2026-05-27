import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch the latest release metadata from GitHub
    const res = await fetch('https://api.github.com/repos/Shivanshmishra7275/Contact-Forge/releases/latest', {
      next: { revalidate: 3600 }, // cache for 1 hour to avoid rate limits
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
      // Redirect directly to the APK download
      return NextResponse.redirect(apkAsset.browser_download_url);
    }

    // Fallback if no APK is found in the latest release
    return NextResponse.redirect('https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest');
  } catch (error) {
    console.error('Error fetching release:', error);
    // Fallback on error
    return NextResponse.redirect('https://github.com/Shivanshmishra7275/Contact-Forge/releases/latest');
  }
}
