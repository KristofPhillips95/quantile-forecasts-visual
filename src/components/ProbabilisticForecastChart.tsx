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
import {Bar} from 'react-chartjs-2';
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
export function ProbabilisticForecastBarChart({ data }: Props) {
  const { labels, byQuantile } = useMemo(() => extractPerQuantileForecasts(data), [data]);

  const quantiles = Object.keys(byQuantile)
    .map(Number)
    .sort((a, b) => a - b);

  const datasets = [];

  for (let i = 0; i < quantiles.length; i++) {
    const q = quantiles[i];

    // If first quantile, use raw values
    // Otherwise, use difference between current and previous quantile
    const dataPoints = i === 0
      ? byQuantile[q]
      : byQuantile[q].map((v, idx) => {
          const prevQ = quantiles[i - 1];
          const prevV = byQuantile[prevQ][idx];
          return v != null && prevV != null ? v - prevV : 0;
        });

    // Color cycling with some hue shift
    const hue = 210 + i * 15;
    const backgroundColor = `hsl(${hue}, 70%, 60%)`;

    datasets.push({
      label: `Quantile ${q}`,
      data: dataPoints,
      backgroundColor,
      borderWidth: 0,
      stack: 'combined',
    });
  }

  return (
    <Bar
      data={{
        labels,
        datasets,
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false },
        },
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: {
            type: 'time',
            stacked: true,
            time: {
              tooltipFormat: 'HH:mm',
              displayFormats: { hour: 'HH:mm', minute: 'HH:mm' },
            },
            title: { display: true, text: 'Time (Europe/Brussels)' },
          },
          y: {
            stacked: true,
            beginAtZero: false,
            title: { display: true, text: 'Imbalance Price (€/MWh)' },
            min: Math.min(
              ...quantiles.flatMap((q) => byQuantile[q].filter((v) => v != null))
            ) - 10,
            max: Math.max(
              ...quantiles.flatMap((q) => byQuantile[q].filter((v) => v != null))
            ) + 10,
          },
        },
      }}
    />
  );
}

export function ProbabilisticForecastLineChart({ data }: Props) {
  const { labels, byQuantile } = useMemo(() => extractPerQuantileForecasts(data), [data]);

  const quantilesToShow = [0,0.1,0.2,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.8, 0.9,1];

  const datasets = quantilesToShow.map((q, i) => {
      const nextQ = quantilesToShow[i + 1];
      const quantileRange = nextQ != null ? `${q}–${nextQ}` : `${q}`;
      const baseOpacity = nextQ != null 
      ? (Math.exp(-5 * Math.abs(q - 0.5))).toFixed(2) 
      : '1.0';
        return {
          label: q === 0.5 ? 'Median (0.5)' : `Quantile ${q}`,
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
