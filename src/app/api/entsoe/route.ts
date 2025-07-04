// src/app/api/entsoe/route.ts

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  const country = url.searchParams.get('country');
  const dataset = url.searchParams.get('dataset');

  const API_KEY = process.env.ENTSOE_API_KEY;
  console.log("ENTSOE API Key:", API_KEY);
  if (!API_KEY || !start || !end || !country || !dataset) {
    return new NextResponse("Missing required parameters or API key", { status: 400 });
  }

  // These would normally be stored in a config file, but hardcoding for now
  const BIDDING_ZONES: Record<string, string> = {
    'BE': '10YBE----------2',
    'FR': '10YFR-RTE------C',
    // Add others as needed
  };

  const DOCUMENT_TYPES: Record<string, string> = {
    'imbalance': 'A95',
    'dayaheadprices': 'A44',
    // Add others as needed
  };

  const inDomain = BIDDING_ZONES[country];
  const documentType = DOCUMENT_TYPES[dataset];

  if (!inDomain || !documentType) {
    return new NextResponse("Invalid country or dataset", { status: 400 });
  }

  const apiUrl = `https://web-api.tp.entsoe.eu/api`;

  const formattedStart = toEntsoeFormat(start);
  const formattedEnd = toEntsoeFormat(end);

  const params = new URLSearchParams({
    documentType,
    in_Domain: inDomain,
    out_Domain: inDomain,
    periodStart: formattedStart,
    periodEnd: formattedEnd,
    securityToken: API_KEY,
  });

  const fullUrl = `${apiUrl}?${params.toString()}`;

  try {
    const upstreamRes = await fetch(fullUrl);

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      console.error("ENTSOE error:", errText);
      return new NextResponse(`ENTSOE fetch failed: ${errText}`, { status: 502 });
    }

    const xml = await upstreamRes.text();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (err) {
    console.error("Fetch error:", err);
    return new NextResponse("ENTSOE API fetch crashed", { status: 500 });
  }
}

function toEntsoeFormat(dateStr: string): string {
  const date = new Date(dateStr);
  return date
    .toISOString()
    .slice(0, 16)      // '2025-07-03T22:15'
    .replace(/[-:T]/g, ''); // '202507032215'
}
