export async function fetchForecastData(start: string,end: string) {


  const url = `/api/forecast?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
  console.log("Launching GET function for ", start, end)

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Fetch error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
