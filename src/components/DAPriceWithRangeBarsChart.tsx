'use client';

import Plot from 'react-plotly.js';
import { RangeForecastPoint, DaPricePoint } from '@/utils/processData';
import { DateTime } from 'luxon';
import { PlotData } from 'plotly.js';

interface Props {
  rangeData: RangeForecastPoint[];
  daPrices?: DaPricePoint[];
}

export default function DaPriceWithRangeBarsChart({ rangeData, daPrices }: Props) {
  if (!rangeData.length) return <div>No data to display</div>;

  const timestamps = rangeData.map(d => d.timestamp);
  const barIntervalMillis = - 15 * 60 * 1000; // 1 hour in ms

  const shiftedTimestamps = timestamps.map(ts =>
    DateTime.fromISO(ts).minus({ milliseconds: barIntervalMillis / 2 }).toISO()
);

  const base = rangeData.map(d => d.lower_bound);
  const height = rangeData.map(d => d.upper_bound - d.lower_bound);
  const probDensities = rangeData.map(d => d.probability / (d.upper_bound - d.lower_bound));
  const minProb = Math.min(...probDensities);
  const maxProb = Math.max(...probDensities);

  const barHoverText = rangeData.map(d => {
    const time = new Date(d.timestamp).toLocaleTimeString('nl-BE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    // const density = (d.probability / (d.upper_bound - d.lower_bound)).toFixed(4);
    // return `Time: ${time}<br>Lower: ${d.lower_bound.toFixed(2)}<br>Upper: ${d.upper_bound.toFixed(2)}<br>Density: ${density}`;
    return `Time: ${time}<br>Lower: ${d.lower_bound.toFixed(2)}<br>Upper: ${d.upper_bound.toFixed(2)}<br>Probability: ${d.probability }`;

  });

  const barTrace: Partial<PlotData> = {
    type: 'bar',
    x: shiftedTimestamps,
    y: height,
    base: base,
    marker: {
      color: probDensities,
    colorscale: [
    [0.0, 'rgba(180, 180, 180, 0.2)'],  // light grey
    [0.2, 'rgba(220, 120, 120, 0.4)'],  // light red already at 20%
    [0.4, 'rgba(240, 80, 80, 0.6)'],    // stronger red at 40%
    [0.6, 'rgba(255, 40, 40, 0.7)'],    // even stronger
    [1.0, 'rgba(255, 0, 34, 0.8)'],     // peak intensity
    ],
    

      colorbar: {
        title: { text: 'Prob. Density' },
    // @ts-expect-error -- 'titleside' is missing from types, but supported by Plotly
        titleside: 'right',
      },
      cmin: minProb,
      cmax: maxProb,
    },
    textposition: 'none',
    name: 'Range Forecast',
    text: barHoverText,
    hovertemplate: '%{text}<extra></extra>',
  };

  const daTrace: Partial<PlotData> | null = (() => {
    if (!daPrices || daPrices.length === 0) return null;

    const sorted = [...daPrices].sort(
      (a, b) => new Date(a.timestamp_utc).getTime() - new Date(b.timestamp_utc).getTime()
    );

    const convertedTimestamps = sorted.map(d =>
      DateTime.fromISO(d.timestamp_utc, { zone: 'utc' })
        .setZone('Europe/Brussels')
        .toISO()
    );

    return {
      x: convertedTimestamps,
      y: sorted.map(d => d.price_eur_per_mwh),
      type: 'scatter',
      mode: 'lines',
      name: 'DA Price',
      line: { color: 'orange', width: 3, shape: 'hv' },
    };
  })();

  return (
    <Plot
      data={[barTrace, ...(daTrace ? [daTrace] : [])]}
      layout={{
        title: { text: 'Range Forecast with DA Price', font: { size: 18 } },
        xaxis: {
          title: { text: 'Time (Europe/Brussels)' },
          tickformat: '%H:%M',
          tickangle: -30,
        },
        yaxis: { title: { text: 'Value (€/MWh)' } },
        bargap: 0.1,
        margin: { t: 30, b: 60, l: 50, r: 20 },
        height: 400,
      }}
      config={{ responsive: true }}
      style={{ width: '100%' }}
    />
  );
}
