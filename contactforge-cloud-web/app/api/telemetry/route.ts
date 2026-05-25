import { NextResponse } from 'next/server';

export async function GET() {
  // Use environment variables for the Plausible API
  // Add these to your .env.local: PLAUSIBLE_API_KEY and PLAUSIBLE_SITE_ID
  const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY;
  const SITE_ID = process.env.PLAUSIBLE_SITE_ID || 'contactforge.app'; // Replace with actual site ID if env is missing

  if (!PLAUSIBLE_API_KEY) {
    // If no key is configured, we return an error so the frontend can handle it or show a loading/error state
    return NextResponse.json({ error: 'Missing PLAUSIBLE_API_KEY' }, { status: 500 });
  }

  try {
    // Fetch Total Visitors (Unique Visitors)
    // Plausible API: GET /api/v1/stats/aggregate
    const visitorsRes = await fetch(`https://plausible.io/api/v1/stats/aggregate?site_id=${SITE_ID}&period=all&metrics=visitors`, {
      headers: {
        Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    // Fetch Total Downloads (Custom Event: "Download APK Direct")
    const downloadsRes = await fetch(`https://plausible.io/api/v1/stats/aggregate?site_id=${SITE_ID}&period=all&metrics=events&filters=event:name==Download%20APK%20Direct`, {
      headers: {
        Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!visitorsRes.ok || !downloadsRes.ok) {
      throw new Error('Plausible API responded with an error');
    }

    const visitorsData = await visitorsRes.json();
    const downloadsData = await downloadsRes.json();

    const visitors = visitorsData.results?.visitors?.value || 0;
    const downloads = downloadsData.results?.events?.value || 0;

    return NextResponse.json({ visitors, downloads });
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }
}
