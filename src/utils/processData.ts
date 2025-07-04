import { DateTime } from 'luxon';

type ForecastEntry = {
  start_date: string; // e.g. "2025-06-29 12:45:00+00:00"
  quantile_value: number;
  forecast_value: number;
};

type PerQuantileForecast = {
  labels: string[]; // ISO timestamps in Europe/Brussels
  byQuantile: Record<number, (number | null)[]>; // Quantile -> forecast values per label
};

// types.ts or directly in the component file
export interface DaPricePoint {
  timestamp_utc: string;         // ISO string
  price_eur_per_mwh: number;
}


export function extractPerQuantileForecasts(data: ForecastEntry[]): PerQuantileForecast {
  const grouped: Record<string, Record<number, number>> = {};

    data.forEach((entry) => {
    const dt = DateTime.fromSQL(entry.start_date, { zone: 'utc' });
    if (!dt.isValid) return;

    const timestamp = dt.setZone('Europe/Brussels').toISO();
    if (!timestamp) return;

    if (!grouped[timestamp]) grouped[timestamp] = {};
    grouped[timestamp][entry.quantile_value] = entry.forecast_value;
    });


  const labels = Object.keys(grouped).sort(); // sorted ISO strings

  // Collect all quantiles present in the data
  const allQuantiles = new Set<number>();
  Object.values(grouped).forEach((qMap) => {
    Object.keys(qMap).forEach((q) => allQuantiles.add(Number(q)));
  });

  const byQuantile: Record<number, (number | null)[]> = {};
  Array.from(allQuantiles).sort().forEach((q) => {
    byQuantile[q] = labels.map((ts) =>
      grouped[ts]?.[q] ?? null
    );
  });

  return { labels, byQuantile };
}


import {  Duration } from 'luxon';
import { XMLParser } from 'fast-xml-parser';

export interface DaPricePoint {
  timestamp_utc: string;
  price_eur_per_mwh: number;
}

type EntsoePoint = {
  position: string;
  'price.amount': string;
};

type EntsoePeriod = {
  timeInterval: {
    start: string;
    end: string;
  };
  resolution: string;
  Point: EntsoePoint[] | EntsoePoint;
};

type EntsoeTimeSeries = {
  Period: EntsoePeriod;
};

type EntsoeDocument = {
  Publication_MarketDocument: {
    TimeSeries: EntsoeTimeSeries[] | EntsoeTimeSeries;
  };
};

export function parseEntsoeXml(xml: string): DaPricePoint[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const parsed = parser.parse(xml) as EntsoeDocument;
  const doc = parsed.Publication_MarketDocument;
  if (!doc) return [];

  const timeSeries = Array.isArray(doc.TimeSeries) ? doc.TimeSeries : [doc.TimeSeries];

  const allPoints: DaPricePoint[] = [];

  for (const ts of timeSeries) {
    const period = ts.Period;
    if (!period?.timeInterval?.start || !period.resolution || !period.Point) continue;

    const start = DateTime.fromISO(period.timeInterval.start, { zone: 'utc' });
    const resolution = parseResolution(period.resolution);
    const points = Array.isArray(period.Point) ? period.Point : [period.Point];

    for (const p of points) {
      const pos = Number(p.position);
      const price = Number(p['price.amount']);
      if (isNaN(pos) || isNaN(price)) continue;

    const base = resolution.shiftTo('hours', 'minutes');
    const delta = Duration.fromObject({
      hours: (base.hours ?? 0) * (pos - 1),
      minutes: (base.minutes ?? 0) * (pos - 1),
    });
    const ts = start.plus(delta);

      allPoints.push({
        timestamp_utc: ts.toISO()!,
        price_eur_per_mwh: price,
      });
    }
  }

  return allPoints;
}

export function filterDaPricePoints(
  points: DaPricePoint[],
  start?: string,
  end?: string
): DaPricePoint[] {
  if (!start && !end) return points;

  const startDT = start ? DateTime.fromISO(start, { zone: 'utc' }) : null;
  const endDT = end ? DateTime.fromISO(end, { zone: 'utc' }) : null;

  return points.filter((pt) => {
    const t = DateTime.fromISO(pt.timestamp_utc, { zone: 'utc' });
    if (startDT && t < startDT) return false;
    if (endDT && t >= endDT) return false;
    return true;
  });
}

function parseResolution(res: string): Duration {
  switch (res) {
    case 'PT15M':
      return Duration.fromObject({ minutes: 15 });
    case 'PT30M':
      return Duration.fromObject({ minutes: 30 });
    case 'PT60M':
    case 'PT1H':
      return Duration.fromObject({ hours: 1 });
    default:
      throw new Error(`Unsupported resolution: ${res}`);
  }
}


export interface RangeForecastEntry {
  start_date: string; // ISO string with time + offset
  lower_bound: number;
  upper_bound: number;
  probability: number;
}

export type PerBinRangeForecast = {
  labels: string[]; // ISO timestamps in Europe/Brussels
  byBin: Record<string, (number | null)[]>; // '10-20' → array of probabilities per label
};

export function extractPerRangeForecasts(
  data: RangeForecastEntry[]
): PerBinRangeForecast {
  const grouped: Record<string, Record<string, number>> = {};

  for (const entry of data) {
    const dt = DateTime.fromSQL(entry.start_date, { zone: 'utc' });
    if (!dt.isValid) continue;

    const timestamp = dt.setZone('Europe/Brussels').toISO();
    if (!timestamp) continue;

    const binKey = `${entry.lower_bound}-${entry.upper_bound}`;

    if (!grouped[timestamp]) grouped[timestamp] = {};
    grouped[timestamp][binKey] = entry.probability;
  }

  const labels = Object.keys(grouped).sort();

  // collect all bins seen in any timestep
  const allBins = new Set<string>();
  Object.values(grouped).forEach((binMap) => {
    Object.keys(binMap).forEach((bin) => allBins.add(bin));
  });

  const byBin: Record<string, (number | null)[]> = {};
  Array.from(allBins).sort().forEach((bin) => {
    byBin[bin] = labels.map((ts) => grouped[ts]?.[bin] ?? null);
  });

  return { labels, byBin };
}
export type RangeChartPoint = {
  timestamp: string;
  [bin: string]: number | null | string;
};

export function convertToRechartsFormat(input: PerBinRangeForecast): RangeChartPoint[] {
  const { labels, byBin } = input;
  const binKeys = Object.keys(byBin);

  return labels.map((label, idx) => {
    const point: RangeChartPoint = { timestamp: label };
    for (const bin of binKeys) {
      point[bin] = byBin[bin][idx] ?? null;
    }
    return point;
  });
}

export interface RangeForecastPoint {
  timestamp: string;       // ISO string, already in Europe/Brussels
  lower_bound: number;
  upper_bound: number;
  probability: number;
}


export function convertRangeForecastToPlotPoints(data: RangeForecastEntry[]): RangeForecastPoint[] {
  return data
    .map((entry) => {
      const dt = DateTime.fromSQL(entry.start_date, { zone: 'utc' });
      const timestamp = dt.setZone('Europe/Brussels').toISO();
      if (!timestamp) return null;

      return {
        timestamp,
        lower_bound: entry.lower_bound,
        upper_bound: entry.upper_bound,
        probability: entry.probability,
      };
    })
    .filter((d): d is RangeForecastPoint => d !== null); // <- narrow to valid type
}
