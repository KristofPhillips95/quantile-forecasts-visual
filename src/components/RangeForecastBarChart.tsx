'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useMemo } from 'react';
import type { RangeChartPoint } from '@/utils/processData';

type Props = {
  data: RangeChartPoint[];
};

export default function RangeForecastBarChart({ data }: Props) {
    
  const binKeys = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]).filter((k) => k !== 'timestamp');
  }, [data]);

  const colorScale = (i: number, total: number): string => {
    const opacity = ((1 - Math.abs((i / total) - 0.5)) ** 2).toFixed(2);
    return `rgba(30, 144, 255, ${opacity})`; // DodgerBlue with variable opacity
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(val) =>
              new Date(val).toLocaleTimeString('nl-BE', {
                hour: '2-digit',
                minute: '2-digit',
              })
            }
          />
          <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${(value * 100).toFixed(1)}%`,
              `P[${name}]`,
            ]}
            labelFormatter={(label) => new Date(label).toLocaleString()}
          />
          <Legend />
          {binKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="prob"
              fill={colorScale(i, binKeys.length)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
