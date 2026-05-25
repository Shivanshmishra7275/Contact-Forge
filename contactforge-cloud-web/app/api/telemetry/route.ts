import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY;
  const SITE_ID = process.env.PLAUSIBLE_SITE_ID;

  if (!PLAUSIBLE_API_KEY || !SITE_ID) {
    console.error('Telemetry Error: Missing PLAUSIBLE_API_KEY or PLAUSIBLE_SITE_ID in environment variables.');
    return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
  }

  try {
    const visitorsRes = await fetch(`https://plausible.io/api/v1/stats/aggregate?site_id=${SITE_ID}&period=all&metrics=visitors`, {
      headers: { Authorization: `Bearer ${PLAUSIBLE_API_KEY}` },
    });
    
    const downloadsRes = await fetch(`https://plausible.io/api/v1/stats/aggregate?site_id=${SITE_ID}&period=all&metrics=events&filters=event:name==Download%20APK%20Direct`, {
      headers: { Authorization: `Bearer ${PLAUSIBLE_API_KEY}` },
    });

    if (!visitorsRes.ok || !downloadsRes.ok) {
      const vBody = await visitorsRes.text();
      const dBody = await downloadsRes.text();
      console.error('Plausible API Error - Visitors:', visitorsRes.status, vBody);
      console.error('Plausible API Error - Downloads:', downloadsRes.status, dBody);
      throw new Error(`Plausible API responded with an error. V:${visitorsRes.status} D:${downloadsRes.status}`);
    }

    const visitorsData = JSON.parse(await visitorsRes.text());
    const downloadsData = JSON.parse(await downloadsRes.text());

    const visitors = visitorsData.results?.visitors?.value || 0;
    const downloads = downloadsData.results?.events?.value || 0;

    return NextResponse.json({ visitors, downloads });
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }
}
