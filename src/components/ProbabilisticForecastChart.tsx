'use client';

import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
// import {Bar} from 'react-chartjs-2';
import { useMemo } from 'react';
import { extractPerQuantileForecasts } from '@/utils/processData';
import 'chartjs-adapter-luxon';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export type ForecastEntry = {
  start_date: string;
  quantile_value: number;
  forecast_value: number;
};

type Props = {
  data: ForecastEntry[];
};

// export function ProbabilisticForecastBarChart({ data }: Props) {
//   const { labels, byQuantile } = useMemo(() => extractPerQuantileForecasts(data), [data]);

//   const quantiles = Object.keys(byQuantile)
//     .map(Number)
//     .sort((a, b) => a - b);

//   const datasets = [];

//   for (let i = 0; i < quantiles.length - 1; i++) {
//     const qLow = quantiles[i];
//     const qHigh = quantiles[i + 1];

//     const qLowData = byQuantile[qLow];
//     const qHighData = byQuantile[qHigh];

//     const deltaData = qLowData.map((low, idx) => {
//       const high = qHighData?.[idx];
//       if (low == null || high == null) return null;
//       return high - low;
//     });

//     const opacity = 0.3 + 0.1 * (1 - (qHigh - qLow));
//     const backgroundColor = `rgba(0, 100, 255, ${opacity.toFixed(2)})`;

//     datasets.push({
//       label: `${qLow}–${qHigh}`,
//       data: deltaData,
//       backgroundColor,
//       stack: 'quantiles',
//       borderWidth: 0,
//     });
//   }

//   return (
//     <Bar
//       data={{ labels, datasets }}
//       options={{
//         responsive: true,
//         plugins: {
//           legend: {
//             position: 'top',
//           },
//           tooltip: {
//             mode: 'index',
//             intersect: false,
//           },
//         },
//         interaction: {
//           mode: 'nearest',
//           intersect: false,
//         },
//         scales: {
//           x: {
//             stacked: true,
//             title: {
//               display: true,
//               text: 'Time (Europe/Brussels)',
//             },
//           },
//           y: {
//             stacked: true,
//             title: {
//               display: true,
//               text: 'Imbalance Price (€/MWh)',
//             },
//             beginAtZero: false,
//             min: -1000,
//           },
//         },
//       }}
//     />
//   );
// }

export function ProbabilisticForecastLineChart({ data }: Props) {
  const { labels, byQuantile } = useMemo(() => extractPerQuantileForecasts(data), [data]);

  const quantilesToShow = [0,0.01,0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95,0.99,1];

  const datasets = quantilesToShow.map((q, i) => {
  const nextQ = quantilesToShow[i + 1];
  const quantileRange = nextQ != null ? `${q}–${nextQ}` : `${q}`;
  const baseOpacity = nextQ != null ? Math.min(3 * (nextQ - q), 1).toFixed(2) : '1.0';

    return {
      label: q === 0.5 ? 'Median (0.5)' : `Quantile ${quantileRange}`,
      data: byQuantile[q],
      borderColor: `rgba(0, 100, 255, ${baseOpacity})`,
      backgroundColor: `rgba(0, 100, 255, ${baseOpacity})`,
      pointRadius: 0,
      borderWidth: q === 0.5 ? 2 : 1,
      tension: 0.1,
      fill: nextQ != null ? '+1' : false,
    };
  });

  return (
    <Line
      data={{ labels, datasets }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        interaction: {
          mode: 'nearest',
          intersect: false,
        },
        scales: {
          x: {
            type: 'time',
            time: {
              tooltipFormat: 'HH:mm',
              displayFormats: {
                hour: 'HH:mm',
                minute: 'HH:mm',
              },
            },
            title: {
              display: true,
              text: 'Time (Europe/Brussels)',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Imbalance Price (€/MWh)',
            },
          },
        },
      }}
    />
  );
}
