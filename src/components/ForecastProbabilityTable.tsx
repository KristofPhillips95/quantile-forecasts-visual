// src/components/ForecastProbabilityTable.tsx
'use client';

import { DateTime } from 'luxon';
import { RangeForecastPoint, DaPricePoint } from '@/utils/processData';

interface Props {
  rangeData: RangeForecastPoint[];
  daPrices: DaPricePoint[];
}

function getProbabilityAboveBelow(
  points: RangeForecastPoint[],
  threshold: number
): { p_above: number; p_below: number } {
  const totalProb = points.reduce((sum, p) => sum + p.probability, 0);
  if (totalProb === 0) return { p_above: 0, p_below: 0 };

  const p_above =
    points
      .filter(p => p.lower_bound >= threshold)
      .reduce((sum, p) => sum + p.probability, 0) / totalProb;

  const p_below =
    points
      .filter(p => p.upper_bound <= threshold)
      .reduce((sum, p) => sum + p.probability, 0) / totalProb;

  return { p_above, p_below };
}

export default function ForecastProbabilityTable({ rangeData, daPrices }: Props) {
  if (!rangeData.length || !daPrices.length) return <div>No data to display</div>;

  // Normalize DA price timestamps to hourly keys
  const daPriceMap = new Map<string, number>();
  for (const p of daPrices) {
    const hourKey = DateTime.fromISO(p.timestamp_utc, { zone: 'utc' })
      .setZone('Europe/Brussels')
      .toFormat('yyyy-MM-dd HH');
    daPriceMap.set(hourKey, p.price_eur_per_mwh);
  }

  // Group range forecast points by hourly bucket
  const groupedForecasts = rangeData.reduce<Record<string, RangeForecastPoint[]>>((acc, point) => {
    const hourKey = DateTime.fromISO(point.timestamp, { zone: 'utc' })
      .setZone('Europe/Brussels')
      .toFormat('yyyy-MM-dd HH');
    if (!acc[hourKey]) acc[hourKey] = [];
    acc[hourKey].push(point);
    return acc;
  }, {});

  const sortedHourKeys = Object.keys(groupedForecasts).sort();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-left">Hour</th>
            <th className="border px-2 py-1 text-right">DA Price</th>
            <th className="border px-2 py-1 text-right">P(Below)</th>
            <th className="border px-2 py-1 text-right">P(Above)</th>
          </tr>
        </thead>
        <tbody>
          {sortedHourKeys.map(hourKey => {
            const points = groupedForecasts[hourKey];
            const daPrice = daPriceMap.get(hourKey);
            if (daPrice === undefined) return null;

            const { p_above, p_below } = getProbabilityAboveBelow(points, daPrice);

            return (
              <tr key={hourKey} className="even:bg-gray-50">
                <td className="border px-2 py-1">{hourKey}:00</td>
                <td className="border px-2 py-1 text-right">{daPrice.toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{(p_below * 100).toFixed(1)}%</td>
                <td className="border px-2 py-1 text-right">{(p_above * 100).toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
