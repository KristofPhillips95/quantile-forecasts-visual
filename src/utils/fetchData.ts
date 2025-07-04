export async function fetchForecastData(start: string,end: string) {


  const url = `/api/forecast?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
  // console.log("Launching GET function for ", start, end)

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Fetch error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function fetchRangeForecastData(start: string,end: string) {


  const url = `/api/rangeforecasts?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
  // console.log("Launching GET function (range) for ", start, end)

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Fetch error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}


export async function fetchEntsoeData(start: string, end: string, dataset: string, country: string) {
  const url = `/api/entsoe?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&dataset=${dataset}&country=${country}`;
  
  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Fetch error ${res.status}: ${await res.text()}`);
  }

  const xml = await res.text();
  return xml; // Or parse it on the client side using an XML parser
}

