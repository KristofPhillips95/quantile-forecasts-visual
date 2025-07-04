// components/RangeForecastPlot.tsx

'use client';

import Plot from 'react-plotly.js';
import { RangeForecastPoint } from '@/utils/processData';

interface Props {
  data: RangeForecastPoint[];
}


export default function RangeForecastPlot({ data }: Props) {
  if (!data.length) return <div>No data to display</div>;

  const timestamps = data.map(d => d.timestamp);
  const base = data.map(d => d.lower_bound);
  const height = data.map(d => d.upper_bound - d.lower_bound);
  const probabilities = data.map(d => d.probability);
const probDensities = data.map(d => d.probability / (d.upper_bound - d.lower_bound));
const minProb = Math.min(...probDensities);
const maxProb = Math.max(...probDensities);

return (
  <Plot
    data={[
      {
        type: 'bar',
        x: timestamps,
        y: height,
        base: base,
        marker: {
          color: probDensities,
          colorscale: [
            [0, 'rgba(0, 100, 255, 0.2)'],   // low opacity at min
            [1, 'rgba(0, 100, 255, 0.8)'],   // higher opacity at max
          ],
          colorbar: {
            title: 'Prob. Density',
            titleside: 'right',
          },
          cmin: minProb,
          cmax: maxProb,
        },
        name: 'Range Forecast',
        hoverinfo: 'x+y+marker.color',
      } as any,
    ]}
    layout={{
      title: { text: 'Range Forecast', font: { size: 18 } },
      xaxis: { title: { text: 'Time' } },
      yaxis: { title: { text: 'Value (€/MWh)' } },
      bargap: 0.1,
      margin: { t: 30, b: 40, l: 50, r: 20 },
      height: 400,
    }}
    config={{ responsive: true }}
    style={{ width: '100%' }}
  />
);

}


