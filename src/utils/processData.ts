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
