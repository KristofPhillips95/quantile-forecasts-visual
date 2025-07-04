// src/app/api/rangeforecasts/route.ts

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    return new NextResponse('API_KEY not defined', { status: 500 });
  }

  const apiUrl = `https://rb1o0cl7m4.execute-api.eu-west-3.amazonaws.com/dev/range_prob_forecasts?start=${encodeURIComponent(start!)}&end=${encodeURIComponent(end!)}`;

  const upstreamRes = await fetch(apiUrl, {
    headers: {
      'x-api-key': API_KEY,
    },
  });

  const text = await upstreamRes.text();

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch {
    console.error("Invalid JSON:", text);
    return new NextResponse("Invalid JSON from upstream", { status: 502 });
  }
}
